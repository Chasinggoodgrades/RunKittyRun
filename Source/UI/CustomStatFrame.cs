using Source;
using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class CustomStatFrame
{
    private static int Count = 0;
    private static framehandle CustomStatFrameBoxS;
    private static framehandle CustomStatFrameBoxF;

    public static Dictionary<player, unit> SelectedUnit = new Dictionary<player, unit>();
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
        if (!SelectedUnit.TryGetValue(player.LocalPlayer, out var selectedUnit)) return;

        HandleFrameText(selectedUnit);

        CustomStatFrameBoxF.Visible = CustomStatFrameBoxS.Visible;
    }

    public static void Init()
    {
        BlzLoadTOCFile("war3mapImported\\CustomStat.toc");
        BlzLoadTOCFile("war3mapImported\\BoxedText.toc");

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
        trig.AddAction(() =>
        {
            var player = @event.Player;
            var unit = @event.Unit;
            SelectedUnit[player] = unit;
        });

        foreach (var player in Globals.ALL_PLAYERS)
            if (player.SlotState == playerslotstate.Playing) trig.RegisterPlayerUnitEvent(player, playerunitevent.Selected, null);

        CustomStatFrameBoxS = BlzCreateFrameByType("SIMPLEFRAME", "CustomStatFrameBoxSBoss", BlzGetFrameByName("SimpleUnitStatsPanel", 0), "", 0);
        CustomStatFrameBoxF = BlzCreateFrameByType("FRAME", "CustomStatFrameBoxFBoss", BlzGetOriginFrame(ORIGIN_FRAME_GAME_UI, 0), "", 0);

        Add("war3mapImported\\BTNStopwatch.blp", "", "Score");
        Add("ReplaceableTextures\\CommandButtons\\BTNInnerFireOn.blp", "", "Revives");
        Add("ReplaceableTextures\\CommandButtons\\BTNDeath Coil.blp", "", "Deaths");
        Add("ReplaceableTextures\\CommandButtons\\BTNHealingWave.tga", "", "Streak");
        Add("ReplaceableTextures\\CommandButtons\\BTNGoldCoin.blp", "", "Gold");
        Add("ReplaceableTextures\\CommandButtons\\BTNBootsOfSpeed.blp", "", "Speed");

        t = timer.Create();
        t.Start(0.1f, true, Update);
    }

    private static void HandleFrameText(unit selectedUnit)
    {
        if (selectedUnit.UnitType == Constants.UNIT_CUSTOM_DOG || selectedUnit.UnitType == Constants.UNIT_NITRO_PACER) SetWolfFrameText(selectedUnit);
        else if (SetChampionFrameText(selectedUnit)) { }
        else if (selectedUnit.UnitType == Constants.UNIT_KITTY)
        {
            SetCommonFrameText(selectedUnit);
            SetGamemodeFrameText(selectedUnit);
        }
        else
        {
            // do nothing, particularly buildings and w/e else isnt listed to avoid dictionary errors.
        }
    }

    private static bool SetChampionFrameText(unit selectedUnit)
    {
        if (selectedUnit.Name == "|cffffff00Solo Tournament 2023|r")
        {
            Stats[1].Text.Text = "|cffff0000Fieryfox|r";
            Stats[2].Text.Text = "|cffffff00Region:|r EU";
            Stats[0].Text.Text = "|cffffff00Time:|r 13:25";
            Stats[4].Text.Text = "|cffffff00Qoz|r";
            Stats[5].Text.Text = "|cffffff00Region:|r US";
            Stats[3].Text.Text = "|cffffff00Time:|r 15:36";
        }
        else if (selectedUnit.Name == "|cffffff00Team Tournament 2023|r")
        {
            Stats[2].Text.Text = "|cffffff00Region:|r US";
            Stats[1].Text.Text = "|cff00ffffAches|r";
            Stats[3].Text.Text = "|cff00ffffBranFlake|r";
            Stats[5].Text.Text = "|cffffff00Time:|r 23:12";
            Stats[4].Text.Text = "|cff00ffffBalmydrop|r";
            Stats[0].Text.Text = "|cff00ffffUdo|r";
        }
        else if (selectedUnit.Name == "|cffffff00Solo Tournament 2024|r")
        {
            Stats[1].Text.Text = "|cffff0000Fieryfox|r";
            Stats[2].Text.Text = "|cffffff00Region:|r EU";
            Stats[0].Text.Text = "|cffffff00Time:|r 13:23";
            Stats[4].Text.Text = "|cff964bc8MrGheed|r";
            Stats[5].Text.Text = "|cffffff00Region:|r US";
            Stats[3].Text.Text = "|cffffff00Time:|r 16:31";
        }
        else if (selectedUnit.Name == "|cffffff00Solo Tournament 2025|r")
        {
            Stats[0].Text.Text = "|cffffff00Time:|r 14:25";
            Stats[1].Text.Text = "|cffa471e3Stan|r";
            Stats[2].Text.Text = "|cffffff00Region:|r EU";
            Stats[3].Text.Text = "|cffffff00Time:|r 14:56";
            Stats[4].Text.Text = "|cff964bc8Balmydrop|r";
            Stats[5].Text.Text = "|cffffff00Region:|r US";
        }
        else return false;
        return true;
    }

    private static void SetWolfFrameText(unit selectedUnit)
    {
        Stats[0].Text.Text = "";
        Stats[1].Text.Text = "";
        Stats[2].Text.Text = "";
        Stats[3].Text.Text = "";
        //Stats[4].Text.Text = "";
        if (selectedUnit.UnitType == Constants.UNIT_CUSTOM_DOG) SetWolfAffixTexts(selectedUnit);
        if (Program.Debug) Stats[4].Text.Text = $"Walk: {Globals.ALL_WOLVES[selectedUnit].IsWalking}";
        Stats[5].Text.Text = $"{MoveSpeed} {(int)GetUnitMoveSpeed(selectedUnit)}";
    }

    private static void SetWolfAffixTexts(unit selectedUnit)
    {
        if (Gamemode.CurrentGameMode != "Standard") return;
        if (!Globals.ALL_WOLVES.TryGetValue(selectedUnit, out var wolf)) return;

        var affixes = wolf.Affixes;

        for (var i = 0; i < affixes.Count; i++)
        {
            Stats[i].Text.Text = affixes[i].Name;
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
        return Globals.PLAYERS_TEAMS.TryGetValue(u.Owner, out Team team) ? team.TeamColor : $"{Colors.COLOR_YELLOW_ORANGE}Team Aches|r";
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
