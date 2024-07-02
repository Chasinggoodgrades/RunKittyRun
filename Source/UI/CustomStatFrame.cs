using System;
using System.Collections.Generic;
using WCSharp.Api;
using WCSharp.Events;
using WCSharp.Shared.Data;
using static WCSharp.Api.Common;


public static class CustomStatFrame
{
    private static int Count = 0;
    private static framehandle CustomStatFrameBoxS;
    private static framehandle CustomStatFrameBoxF;

    private static List<CustomStat> Stats = new List<CustomStat>();
    private static Dictionary<int, unit> SelectedUnit = new Dictionary<int, unit>();

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
            BlzFrameSetAbsPoint(fh, FRAMEPOINT_TOPLEFT, 0.320f, 0.08f);
        else if (Count == 4)
            BlzFrameSetAbsPoint(fh, FRAMEPOINT_TOPLEFT, 0.420f, 0.08f);
        else if (Count == 7)
            BlzFrameSetAbsPoint(fh, FRAMEPOINT_TOPLEFT, 0.435f, 0.08f);
        else
            BlzFrameSetPoint(fh, FRAMEPOINT_TOPLEFT, BlzGetFrameByName("CustomStat", Count - 1), FRAMEPOINT_BOTTOMLEFT, 0, -0.005f);

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
        var localPlayer = GetLocalPlayer();
        var selectedUnit = SelectedUnit[GetPlayerId(localPlayer)];

        SetGamemodeFrameText(selectedUnit);
        SetCommonFrameText(selectedUnit);

        BlzFrameSetVisible(CustomStatFrameBoxF, BlzFrameIsVisible(CustomStatFrameBoxS));
    }

    public static void Init()
    {
        void MoveOutOfScreen(framehandle fh)
        {
            BlzFrameClearAllPoints(fh);
            BlzFrameSetAbsPoint(fh, FRAMEPOINT_CENTER, 3, 3);
            BlzFrameSetScale(fh, 0.001f);
        }

        MoveOutOfScreen(BlzGetFrameByName("SimpleInfoPanelIconDamage", 0));
        MoveOutOfScreen(BlzGetFrameByName("SimpleInfoPanelIconDamage", 1));
        MoveOutOfScreen(BlzGetFrameByName("SimpleInfoPanelIconArmor", 2));
        MoveOutOfScreen(BlzGetFrameByName("SimpleInfoPanelIconRank", 3));
        MoveOutOfScreen(BlzGetFrameByName("SimpleInfoPanelIconFood", 4));
        MoveOutOfScreen(BlzGetFrameByName("SimpleInfoPanelIconGold", 5));
        MoveOutOfScreen(BlzGetFrameByName("SimpleInfoPanelIconHero", 6));
        MoveOutOfScreen(BlzGetFrameByName("SimpleInfoPanelIconAlly", 7));

        trigger trig = CreateTrigger();
        TriggerAddAction(trig, () =>
        {
            SelectedUnit[GetPlayerId(GetTriggerPlayer())] = GetTriggerUnit();
        });

        for (int i = 0; i < Globals.NUMBER_OF_PLAYERS; i++)
        {
            if(GetPlayerSlotState(Player(i)) == playerslotstate.Playing) TriggerRegisterPlayerUnitEvent(trig, Player(i), EVENT_PLAYER_UNIT_SELECTED, null);
        }

        CustomStatFrameBoxS = BlzCreateFrameByType("SIMPLEFRAME", "CustomStatFrameBoxSBoss", BlzGetFrameByName("SimpleUnitStatsPanel", 0), "", 0);
        CustomStatFrameBoxF = BlzCreateFrameByType("FRAME", "CustomStatFrameBoxFBoss", BlzGetOriginFrame(ORIGIN_FRAME_GAME_UI, 0), "", 0);

        BlzLoadTOCFile("war3mapimported\\CustomStat.toc");
        BlzLoadTOCFile("war3mapimported\\BoxedText.toc");

        Add("ReplaceableTextures\\CommandButtons\\BTNHealingWave.tga", "s_Streak", "Streak");
        Add("ReplaceableTextures\\CommandButtons\\BTNGoldCoin.blp", "s_Gold", "Gold");
        Add("ReplaceableTextures\\CommandButtons\\BTNBootsOfSpeed.blp", "s_Speed", "Speed");
        Add("war3mapImported\\BTNStopwatch.blp", "s_Score", "Score");
        Add("ReplaceableTextures\\CommandButtons\\BTNInnerFireOn.blp", "s_Revives", "Revives");
        Add("ReplaceableTextures\\CommandButtons\\BTNDeath Coil.blp", "s_Deaths", "Deaths");

        t = CreateTimer();
        TimerStart(t, 0.1f, true, Update);
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
    private static void SetGamemodeFrameText(unit selectedUnit)
    {
        if (Gamemode.CurrentGameMode == Globals.GAME_MODES[0])
        {
            BlzFrameSetText(Stats[0].Text, $"Streak: {GetPlayerSaveStreak(selectedUnit)}");
            BlzFrameSetText(Stats[3].Text, $"Games: {GetPlayerGames(selectedUnit)}");
            BlzFrameSetText(Stats[4].Text, $"Saves: {GetPlayerSaves(selectedUnit)}");
        }
        else if (Gamemode.CurrentGameMode == Globals.GAME_MODES[1])
        {
            BlzFrameSetText(Stats[0].Text, $"Time: 0:00");
            BlzFrameSetText(Stats[3].Text, $"Progress: {GetPlayerProgress(selectedUnit)}%");
            BlzFrameSetText(Stats[4].Text, $"Saves: {GetPlayerSaves(selectedUnit)}");
        }
        else if (Gamemode.CurrentGameMode == Globals.GAME_MODES[2])
        {
            BlzFrameSetText(Stats[0].Text, $"Team: {GetPlayerTeamName(selectedUnit)}");
            BlzFrameSetText(Stats[3].Text, $"Progress: {GetPlayerProgress(selectedUnit)}%");
            BlzFrameSetText(Stats[4].Text, $"Saves: {GetPlayerSaves(selectedUnit)}");
        }
    }

    private static void SetCommonFrameText(unit selectedUnit)
    {
        BlzFrameSetText(Stats[1].Text, $"Gold: {GetPlayerGold(selectedUnit)}");
        BlzFrameSetText(Stats[2].Text, $"MS: {(int)GetUnitMoveSpeed(selectedUnit)}");
        BlzFrameSetText(Stats[5].Text, $"Deaths: {GetPlayerDeaths(selectedUnit)}");
    }
    private static string GetPlayerTeamName(unit u) => "TeamName"; // Placeholder
    private static int GetPlayerGold(unit u) => GetOwningPlayer(u).Gold;
    private static string GetPlayerProgress(unit u) => "50"; // Placeholder
    private static int GetPlayerSaves(unit u) => Globals.ALL_KITTIES[GetOwningPlayer(u)].Saves;
    private static int GetPlayerDeaths(unit u) => Globals.ALL_KITTIES[GetOwningPlayer(u)].Deaths;
    private static int GetPlayerSaveStreak(unit u) => 0; // Placeholder
    private static int GetPlayerGames(unit u) => 0; // Placeholder
    private static float GetPlayerTime(unit u) => 0.00f; // Placeholder
}
