using System;
using System.Collections.Generic;
using System.Reflection;
using WCSharp.Api;
using static WCSharp.Api.Common;


public static class CustomStatFrame
{
    private static int Count = 0;
    private static framehandle CustomStatFrameBoxS;
    private static framehandle CustomStatFrameBoxF;

    public static Dictionary<int, unit> SelectedUnit = new Dictionary<int, unit>();
    private static List<CustomStat> Stats = new List<CustomStat>();
    private static string MoveSpeed = $"{Colors.COLOR_YELLOW_ORANGE}MS:|r";
    private static string Time = $"{Colors.COLOR_YELLOW_ORANGE}Time:|r";
    private static string Saves = $"{Colors.COLOR_YELLOW_ORANGE}Saves:|r";
    private static string Deaths = $"{Colors.COLOR_YELLOW_ORANGE}Deaths:|r";
    private static string Streak = $"{Colors.COLOR_YELLOW_ORANGE}Streak:|r";
    private static string Gold = $"{Colors.COLOR_YELLOW_ORANGE}Gold:|r";
    private static string Ratio = $"{Colors.COLOR_YELLOW_ORANGE}S/D:|r";
    private static string Progress = $"{Colors.COLOR_YELLOW_ORANGE}Prog.:|r";

    private static timer t;

    public static void Add(string icon, string text, string titleTooltip)
    {
        Count++;
        framehandle fh = BlzCreateSimpleFrame("CustomStat", CustomStatFrameBoxS, Count);
        framehandle tooltipBox = BlzCreateFrame("BoxedText", CustomStatFrameBoxF, 0, Count);
        framehandle fhHover = BlzCreateFrameByType("FRAME", "CustomStatHover", CustomStatFrameBoxF, "", Count);

        BlzFrameSetPoint(fhHover, FRAMEPOINT_BOTTOMLEFT, fh, FRAMEPOINT_BOTTOMLEFT, 0, 0);
        BlzFrameSetPoint(fhHover, FRAMEPOINT_TOPRIGHT, BlzGetFrameByName("CustomStatText", Count), FRAMEPOINT_TOPRIGHT, 0, 0);
        BlzFrameSetTooltip(fhHover, tooltipBox);

        BlzFrameSetAbsPoint(tooltipBox, FRAMEPOINT_BOTTOM, 0.6f, 0.2f);
        BlzFrameSetSize(tooltipBox, 0.15f, 0.08f);

        BlzFrameSetText(BlzGetFrameByName("CustomStatText", Count), text);
        BlzFrameSetText(BlzGetFrameByName("BoxedTextTitle", Count), titleTooltip);
        BlzFrameSetText(BlzGetFrameByName("BoxedTextValue", Count), text);
        BlzFrameSetTexture(BlzGetFrameByName("CustomStatIcon", Count), icon, 0, true);

        // Position frames based on Count
        if (Count == 1)
            fh.SetPoint(framepointtype.TopLeft, 0.015f, -0.035f, CustomStatFrameBoxS, framepointtype.TopLeft);
        else if (Count == 4)
            fh.SetPoint(framepointtype.TopRight, -0.060f, -0.035f, CustomStatFrameBoxS, framepointtype.TopRight);
        else
            fh.SetPoint(framepointtype.TopLeft, 0, -0.005f, BlzGetFrameByName("CustomStat", Count - 1), framepointtype.BottomLeft);

        Stats.Add(new CustomStat
        {
            Frame = fh,
            Icon = BlzGetFrameByName("CustomStatIcon", Count),
            Text = BlzGetFrameByName("CustomStatText", Count),
            Hover = fhHover,
            ToolTipBox = tooltipBox,
            ToolTipTitle = BlzGetFrameByName("BoxedTextTitle", Count),
            ToolTipText = BlzGetFrameByName("BoxedTextValue", Count)
        });
    }

    public static void Update()
    {
        var localPlayer = player.LocalPlayer;
        var selectedUnit = SelectedUnit[localPlayer.Id];
        
        HandleFrameText(selectedUnit);

        CustomStatFrameBoxF.Visible = CustomStatFrameBoxS.Visible;
    }

    public static void Init()
    {
        var hideParent = BlzCreateFrameByType("SIMPLEFRAME", "HideParent", BlzGetFrameByName("ConsoleUI", 0), "", 0);
        hideParent.Visible = false;
        BlzFrameSetParent(BlzGetFrameByName("SimpleInfoPanelIconDamage", 0), hideParent);
        BlzFrameSetParent(BlzGetFrameByName("SimpleInfoPanelIconDamage", 1), hideParent);
        BlzFrameSetParent(BlzGetFrameByName("SimpleInfoPanelIconArmor", 2), hideParent);
        BlzFrameSetParent(BlzGetFrameByName("SimpleInfoPanelIconRank", 3), hideParent);
        BlzFrameSetParent(BlzGetFrameByName("SimpleInfoPanelIconFood", 4), hideParent);
        BlzFrameSetParent(BlzGetFrameByName("SimpleInfoPanelIconGold", 5), hideParent);
        BlzFrameSetParent(BlzGetFrameByName("SimpleInfoPanelIconHero", 6), hideParent);
        BlzFrameSetParent(BlzGetFrameByName("SimpleInfoPanelIconAlly", 7), hideParent);
        

        trigger trig = trigger.Create();
        trig.AddAction( () =>
        {
            var player = @event.Player;
            var unit = @event.Unit;
            SelectedUnit[player.Id] = unit;
        });

        foreach(var player in Globals.ALL_PLAYERS)
            if(player.SlotState == playerslotstate.Playing) trig.RegisterPlayerUnitEvent(player, playerunitevent.Selected, null);

        CustomStatFrameBoxS = BlzCreateFrameByType("SIMPLEFRAME", "CustomStatFrameBoxSBoss", BlzGetFrameByName("SimpleUnitStatsPanel", 0), "", 0);
        CustomStatFrameBoxF = BlzCreateFrameByType("FRAME", "CustomStatFrameBoxFBoss", BlzGetOriginFrame(ORIGIN_FRAME_GAME_UI, 0), "", 0);

        BlzLoadTOCFile("war3mapimported\\CustomStat.toc");
        BlzLoadTOCFile("war3mapimported\\BoxedText.toc");

        Add("war3mapImported\\BTNStopwatch.blp", "", "Score");
        Add("ReplaceableTextures\\CommandButtons\\BTNInnerFireOn.blp", "", "Revives");
        Add("ReplaceableTextures\\CommandButtons\\BTNDeath Coil.blp", "", "Deaths");
        Add("ReplaceableTextures\\CommandButtons\\BTNHealingWave.tga", "", "Streak");
        Add("ReplaceableTextures\\CommandButtons\\BTNGoldCoin.blp", "", "Gold");
        Add("ReplaceableTextures\\CommandButtons\\BTNBootsOfSpeed.blp", "", "Speed");

        t = timer.Create();
        t.Start(0.1f, true, Update);
    }

    public class CustomStat
    {
        public framehandle Frame { get; set; }
        public framehandle Icon { get; set; }
        public framehandle Text { get; set; }
        public framehandle Hover { get; set; }
        public framehandle ToolTipBox { get; set; }
        public framehandle ToolTipTitle { get; set; }
        public framehandle ToolTipText { get; set; }
    }

    private static void HandleFrameText(unit selectedUnit)
    {
        if (selectedUnit.UnitType == Constants.UNIT_CUSTOM_DOG || selectedUnit.UnitType == Constants.UNIT_NITRO_PACER) SetWolfFrameText(selectedUnit);
        else if (SetChampionFrameText(selectedUnit)) { }
        else
        {
            SetCommonFrameText(selectedUnit);
            SetGamemodeFrameText(selectedUnit);
        }
    }

    private static bool SetChampionFrameText(unit selectedUnit)
    {
        var b = false;
        if (selectedUnit.Name == "|cffffff00Solo Tournament 2023|r")
        {
            BlzFrameSetText(Stats[1].Text, ("|cffff0000Fieryfox|r"));
            BlzFrameSetText(Stats[2].Text, ("|cffffff00Region:|r EU"));
            BlzFrameSetText(Stats[0].Text, ("|cffffff00Time:|r 13:25"));
            BlzFrameSetText(Stats[4].Text, ("|cffffff00Qoz|r"));
            BlzFrameSetText(Stats[5].Text, ("|cffffff00Region:|r US"));
            BlzFrameSetText(Stats[3].Text, ("|cffffff00Time:|r 15:36"));
            b = true;
        }
        else if (selectedUnit.Name == "|cffffff00Team Tournament 2023|r")
        {
            BlzFrameSetText(Stats[2].Text, ("|cffffff00Region:|r US"));
            BlzFrameSetText(Stats[1].Text, ("|cff00ffffAches|r"));
            BlzFrameSetText(Stats[3].Text, ("|cff00ffffBranFlake|r"));
            BlzFrameSetText(Stats[5].Text, ("|cffffff00Time:|r 23:12"));
            BlzFrameSetText(Stats[4].Text, ("|cff00ffffBalmydrop|r"));
            BlzFrameSetText(Stats[0].Text, ("|cff00ffffUdo|r"));
            b = true;
        }
        else if (selectedUnit.Name == "|cffffff00Solo Tournament 2024|r")
        {
            BlzFrameSetText(Stats[1].Text, ("|cffff0000Fieryfox|r"));
            BlzFrameSetText(Stats[2].Text, ("|cffffff00Region:|r EU"));
            BlzFrameSetText(Stats[0].Text, ("|cffffff00Time:|r 13:23"));
            BlzFrameSetText(Stats[4].Text, ("|cff964bc8MrGheed|r"));
            BlzFrameSetText(Stats[5].Text, ("|cffffff00Region:|r US"));
            BlzFrameSetText(Stats[3].Text, ("|cffffff00Time:|r 16:31"));
            b = true;
        }
        return b;
    }


    private static void SetWolfFrameText(unit selectedUnit)
    {
        BlzFrameSetText(Stats[0].Text, "");
        BlzFrameSetText(Stats[1].Text, "");
        BlzFrameSetText(Stats[2].Text, "");
        BlzFrameSetText(Stats[3].Text, "");
        BlzFrameSetText(Stats[4].Text, "");
        if(selectedUnit.UnitType == Constants.UNIT_CUSTOM_DOG) SetWolfAffixTexts(selectedUnit);
        BlzFrameSetText(Stats[5].Text, $"{MoveSpeed} {(int)GetUnitMoveSpeed(selectedUnit)}");
    }

    private static void SetWolfAffixTexts(unit selectedUnit)
    {
        if (Gamemode.CurrentGameMode != "Standard") return;
        var wolf = Globals.ALL_WOLVES[selectedUnit];
        var affixes = wolf.Affixes;
        for (var i = 0; i < affixes.Count; i++)
        {
            BlzFrameSetText(Stats[i].Text, affixes[i].Name);
        }
    }

    private static void SetGamemodeFrameText(unit selectedUnit)
    {
        if (Gamemode.CurrentGameMode == "Standard") // Standard
        {
            BlzFrameSetText(Stats[3].Text, $"{Streak} {GetPlayerSaveStreak(selectedUnit)}");
            BlzFrameSetText(Stats[0].Text, $"{Ratio} {Colors.COLOR_GREEN}{GetCurrentRoundSaves(selectedUnit)}|r/{Colors.COLOR_RED}{GetCurrentRoundDeaths(selectedUnit)}|r");
            BlzFrameSetText(Stats[1].Text, $"{Saves} {Colors.COLOR_GREEN}{GetPlayerSaves(selectedUnit)}|r");
        }
        else if (Gamemode.CurrentGameMode == Globals.GAME_MODES[1]) // Solo
        {
            BlzFrameSetText(Stats[0].Text, $"{Time} {GetPlayerTime(selectedUnit)}");
            BlzFrameSetText(Stats[1].Text, $"{Progress} {GetPlayerProgress(selectedUnit)}%");
            BlzFrameSetText(Stats[2].Text, $"{Deaths} {GetGameTotalDeaths(selectedUnit)}");
        }
        else if (Gamemode.CurrentGameMode == Globals.GAME_MODES[2]) // Team
        {
            BlzFrameSetText(Stats[0].Text, $"{GetPlayerTeamName(selectedUnit)}");
            BlzFrameSetText(Stats[4].Text, $"{GetPlayerProgress(selectedUnit)}%");
            BlzFrameSetText(Stats[1].Text, $"{Saves} {GetGameTotalSaves(selectedUnit)}");
            BlzFrameSetText(Stats[2].Text, $"{Deaths} {GetGameTotalDeaths(selectedUnit)}");
        }
    }

    private static void SetCommonFrameText(unit selectedUnit)
    {
        BlzFrameSetText(Stats[4].Text, $"{Gold} {GetPlayerGold(selectedUnit)}");
        BlzFrameSetText(Stats[5].Text, $"{MoveSpeed} {(int)GetUnitMoveSpeed(selectedUnit)}");
        BlzFrameSetText(Stats[2].Text, $"{Deaths} {Colors.COLOR_RED}{GetPlayerDeaths(selectedUnit)}|r");
    }
    private static string GetPlayerTeamName(unit u)
    {
        if (Globals.PLAYERS_TEAMS.TryGetValue(u.Owner, out Team team)) return team.TeamColor;
        return $"{ Colors.COLOR_YELLOW_ORANGE}Team Aches|r";
    }
    private static int GetPlayerGold(unit u) => u.Owner.Gold;
    private static string GetPlayerProgress(unit u) => Globals.ALL_KITTIES[u.Owner].TimeProg.GetRoundProgress(Globals.ROUND).ToString("F2");
    private static int GetPlayerSaves(unit u) => (int)Globals.ALL_KITTIES[u.Owner].SaveData.GameStats.Saves;
    private static int GetPlayerDeaths(unit u) => Globals.ALL_KITTIES[u.Owner].SaveData.GameStats.Deaths;
    private static int GetPlayerSaveStreak(unit u) => (int)Globals.ALL_KITTIES[u.Owner].SaveData.GameStats.SaveStreak;
    private static string GetPlayerTime(unit u) => Utility.ConvertFloatToTime(Globals.ALL_KITTIES[u.Owner].TimeProg.GetRoundTime(Globals.ROUND));
    private static int GetCurrentRoundSaves(unit u) => Globals.ALL_KITTIES[u.Owner].CurrentStats.RoundSaves;
    private static int GetCurrentRoundDeaths(unit u) => Globals.ALL_KITTIES[u.Owner].CurrentStats.RoundDeaths;
    private static int GetGameTotalSaves(unit u) => Globals.ALL_KITTIES[u.Owner].CurrentStats.TotalSaves;
    private static int GetGameTotalDeaths(unit u) => Globals.ALL_KITTIES[u.Owner].CurrentStats.TotalDeaths;



}
