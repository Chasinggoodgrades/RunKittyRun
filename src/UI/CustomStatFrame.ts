class CustomStat {
    public Frame!: framehandle
    public Icon!: framehandle
    public Text!: framehandle
    public Hover!: framehandle
    public ToolTipBox!: framehandle
    public ToolTipTitle!: framehandle
    public ToolTipText!: framehandle
}

class CustomStatFrame {
    private static Count: number = 0
    private static CustomStatFrameBoxS: framehandle
    private static CustomStatFrameBoxF: framehandle

    public static SelectedUnit: { [x: player]: unit } = {}
    private static Stats: CustomStat[] = []
    private static MoveSpeed: string = '{Colors.COLOR_YELLOW_ORANGE}MS:|r'
    private static Time: string = '{Colors.COLOR_YELLOW_ORANGE}Time:|r'
    private static Saves: string = '{Colors.COLOR_YELLOW_ORANGE}Saves:|r'
    private static Deaths: string = '{Colors.COLOR_YELLOW_ORANGE}Deaths:|r'
    private static Streak: string = '{Colors.COLOR_YELLOW_ORANGE}Streak:|r'
    private static Gold: string = '{Colors.COLOR_YELLOW_ORANGE}Gold:|r'
    private static Ratio: string = '{Colors.COLOR_YELLOW_ORANGE}S/D:|r'
    private static Progress: string = '{Colors.COLOR_YELLOW_ORANGE}Prog.:|r'

    private static readonly _cacheUpdate: Action = Update

    private static t: timer

    public static Add(icon: string, text: string, titleTooltip: string) {
        Count++
        let fh: framehandle = BlzCreateSimpleFrame('CustomStat', CustomStatFrameBoxS, Count)
        let tooltipBox: framehandle = BlzCreateFrame('BoxedText', CustomStatFrameBoxF, 0, Count)
        let fhHover: framehandle = BlzCreateFrameByType('FRAME', 'CustomStatHover', CustomStatFrameBoxF, '', Count)

        BlzFrameSetPoint(fhHover, FRAMEPOINT_BOTTOMLEFT, fh, FRAMEPOINT_BOTTOMLEFT, 0, 0)
        BlzFrameSetPoint(
            fhHover,
            FRAMEPOINT_TOPRIGHT,
            BlzGetFrameByName('CustomStatText', Count),
            FRAMEPOINT_TOPRIGHT,
            0,
            0
        )
        BlzFrameSetTooltip(fhHover, tooltipBox)

        BlzFrameSetAbsPoint(tooltipBox, FRAMEPOINT_BOTTOM, 0.6, 0.2)
        BlzFrameSetSize(tooltipBox, 0.15, 0.08)

        BlzFrameSetText(BlzGetFrameByName('CustomStatText', Count), text)
        BlzFrameSetText(BlzGetFrameByName('BoxedTextTitle', Count), titleTooltip)
        BlzFrameSetText(BlzGetFrameByName('BoxedTextValue', Count), text)
        BlzFrameSetTexture(BlzGetFrameByName('CustomStatIcon', Count), icon, 0, true)

        if (Count == 1) fh.SetPoint(framepointtype.TopLeft, 0.015, -0.035, CustomStatFrameBoxS, framepointtype.TopLeft)
        else if (Count == 4)
            fh.SetPoint(framepointtype.TopRight, -0.06, -0.035, CustomStatFrameBoxS, framepointtype.TopRight)
        else
            fh.SetPoint(
                framepointtype.TopLeft,
                0,
                -0.005,
                BlzGetFrameByName('CustomStat', Count - 1),
                framepointtype.BottomLeft
            )

        this.Stats.push(
            Object.assign(new CustomStat(), {
                Frame: fh,
                Icon: BlzGetFrameByName('CustomStatIcon', Count),
                Text: BlzGetFrameByName('CustomStatText', Count),
                Hover: fhHover,
                ToolTipBox: tooltipBox,
                ToolTipTitle: BlzGetFrameByName('BoxedTextTitle', Count),
                ToolTipText: BlzGetFrameByName('BoxedTextValue', Count),
            })
        )
    }

    public static Update() {
        try {
            if (!(selectedUnit = SelectedUnit.TryGetValue(player.LocalPlayer)) /* TODO; Prepend: let */) return

            HandleFrameText(selectedUnit)

            CustomStatFrameBoxF.Visible = CustomStatFrameBoxS.Visible
        } catch (e: Error) {
            Logger.Critical('Error in CustomStatFrame.Update: {e.Message}')
            throw e
        }
    }

    public static Init() {
        BlzLoadTOCFile('war3mapImported\\CustomStat.toc')
        BlzLoadTOCFile('war3mapImported\\BoxedText.toc')

        let hideParent = BlzCreateFrameByType('SIMPLEFRAME', 'HideParent', BlzGetFrameByName('ConsoleUI', 0), '', 0)
        hideParent.Visible = false
        BlzFrameSetParent(BlzGetFrameByName('SimpleInfoPanelIconDamage', 0), hideParent)
        BlzFrameSetParent(BlzGetFrameByName('SimpleInfoPanelIconDamage', 1), hideParent)
        BlzFrameSetParent(BlzGetFrameByName('SimpleInfoPanelIconArmor', 2), hideParent)
        BlzFrameSetParent(BlzGetFrameByName('SimpleInfoPanelIconRank', 3), hideParent)
        BlzFrameSetParent(BlzGetFrameByName('SimpleInfoPanelIconFood', 4), hideParent)
        BlzFrameSetParent(BlzGetFrameByName('SimpleInfoPanelIconGold', 5), hideParent)
        BlzFrameSetParent(BlzGetFrameByName('SimpleInfoPanelIconHero', 6), hideParent)
        BlzFrameSetParent(BlzGetFrameByName('SimpleInfoPanelIconAlly', 7), hideParent)

        let trig: trigger = trigger.Create()
        trig.AddAction(() => {
            let player = GetTriggerPlayer()
            let unit = GetTriggerUnit()
            SelectedUnit[player] = unit
        })

        for (let player in Globals.ALL_PLAYERS)
            if (player.SlotState == playerslotstate.Playing)
                trig.RegisterPlayerUnitEvent(player, playerunitevent.Selected, null)

        CustomStatFrameBoxS = BlzCreateFrameByType(
            'SIMPLEFRAME',
            'CustomStatFrameBoxSBoss',
            BlzGetFrameByName('SimpleUnitStatsPanel', 0),
            '',
            0
        )
        CustomStatFrameBoxF = BlzCreateFrameByType(
            'FRAME',
            'CustomStatFrameBoxFBoss',
            BlzGetOriginFrame(ORIGIN_FRAME_GAME_UI, 0),
            '',
            0
        )

        Add('war3mapImported\\BTNStopwatch.blp', '', 'Score')
        Add('ReplaceableTextures\\CommandButtons\\BTNInnerFireOn.blp', '', 'Revives')
        Add('ReplaceableTextures\\CommandButtons\\Coil: BTNDeath.blp', '', 'Deaths')
        Add('ReplaceableTextures\\CommandButtons\\BTNHealingWave.tga', '', 'Streak')
        Add('ReplaceableTextures\\CommandButtons\\BTNGoldCoin.blp', '', 'Gold')
        Add('ReplaceableTextures\\CommandButtons\\BTNBootsOfSpeed.blp', '', 'Speed')

        t = timer.Create()
        t.Start(0.1, true, _cacheUpdate)
    }

    private static HandleFrameText(selectedUnit: unit) {
        if (selectedUnit.UnitType == Constants.UNIT_CUSTOM_DOG || selectedUnit.UnitType == Constants.UNIT_NITRO_PACER)
            SetWolfFrameText(selectedUnit)
        else if (selectedUnit.UnitType == Constants.UNIT_KITTY) {
            SetCommonFrameText(selectedUnit)
            SetGamemodeFrameText(selectedUnit)
        } else if (SetChampionFrameText(selectedUnit)) {
        } else {
            // do nothing, particularly buildings and w/e else isnt listed to avoid dictionary errors.
        }
    }

    private static SetChampionFrameText(selectedUnit: unit) {
        // GetUnitName is an async function, may have been prone to desync, now just reference if its the same unit in memory.
        if (selectedUnit == SpawnChampions.Fieryfox2023) {
            Stats[1].Text.Text = '|cffff0000Fieryfox|r'
            Stats[2].Text.Text = '|cffffff00Region:|EU: r'
            Stats[0].Text.Text = '|cffffff00Time:|13: r:25'
            Stats[4].Text.Text = '|cffffff00Qoz|r'
            Stats[5].Text.Text = '|cffffff00Region:|US: r'
            Stats[3].Text.Text = '|cffffff00Time:|15: r:36'
        } else if (selectedUnit == SpawnChampions.FandF2023) {
            Stats[2].Text.Text = '|cffffff00Region:|US: r'
            Stats[1].Text.Text = '|cff00fffAches|r'
            Stats[3].Text.Text = '|cff00fffBranFlake|r'
            Stats[5].Text.Text = '|cffffff00Time:|23: r:12'
            Stats[4].Text.Text = '|cff00fffBalmydrop|r'
            Stats[0].Text.Text = '|cff00fffUdo|r'
        } else if (selectedUnit == SpawnChampions.Fieryfox2024) {
            Stats[1].Text.Text = '|cffff0000Fieryfox|r'
            Stats[2].Text.Text = '|cffffff00Region:|EU: r'
            Stats[0].Text.Text = '|cffffff00Time:|13: r:23'
            Stats[4].Text.Text = '|cff964bc8MrGheed|r'
            Stats[5].Text.Text = '|cffffff00Region:|US: r'
            Stats[3].Text.Text = '|cffffff00Time:|16: r:31'
        } else if (selectedUnit == SpawnChampions.Stan2025) {
            Stats[0].Text.Text = '|cffffff00Time:|14: r:25'
            Stats[1].Text.Text = '|cffa471e3Stan|r'
            Stats[2].Text.Text = '|cffffff00Region:|EU: r'
            Stats[3].Text.Text = '|cffffff00Time:|14: r:56'
            Stats[4].Text.Text = '|cff964bc8Balmydrop|r'
            Stats[5].Text.Text = '|cffffff00Region:|US: r'
        } else return false
        return true
    }

    private static SetWolfFrameText(selectedUnit: unit) {
        Stats[0].Text.Text = ''
        Stats[1].Text.Text = ''
        Stats[2].Text.Text = ''
        Stats[3].Text.Text = ''
        //Stats[4].Text.Text = "";
        if (selectedUnit.UnitType == Constants.UNIT_CUSTOM_DOG) SetWolfAffixTexts(selectedUnit)
        if (Program.Debug && selectedUnit.UnitType == Constants.UNIT_CUSTOM_DOG)
            Stats[4].Text.Text = 'Walk: {Globals.ALL_WOLVES[selectedUnit].IsWalking}'
        Stats[5].Text.Text = '{MoveSpeed} {GetUnitMoveSpeed(selectedUnit)}'
    }

    private static SetWolfAffixTexts(selectedUnit: unit) {
        if (Gamemode.CurrentGameMode == GameMode.SoloTournament) return
        if (!(wolf = Globals.ALL_WOLVES.TryGetValue(selectedUnit)) /* TODO; Prepend: let */) return

        let affixes = wolf.Affixes

        for (let i = 0; i < affixes.Count; i++) {
            Stats[i].Text.Text = affixes[i].Name
        }
    }

    private static SetGamemodeFrameText(selectedUnit: unit) {
        if (Gamemode.CurrentGameMode == GameMode.Standard) {
            // Standard
            BlzFrameSetText(Stats[3].Text, '{Streak} {GetPlayerSaveStreak(selectedUnit)}')
            BlzFrameSetText(
                Stats[0].Text,
                '{Ratio} {Colors.COLOR_GREEN}{GetCurrentRoundSaves(selectedUnit)}|r/{Colors.COLOR_RED}{GetCurrentRoundDeaths(selectedUnit)}|r'
            )
            BlzFrameSetText(Stats[1].Text, '{Saves} {Colors.COLOR_GREEN}{GetPlayerSaves(selectedUnit)}|r')
        } else if (Gamemode.CurrentGameMode == GameMode.SoloTournament) {
            // Solo
            BlzFrameSetText(Stats[0].Text, '{Time} {GetPlayerTime(selectedUnit)}')
            BlzFrameSetText(Stats[1].Text, '{Progress} {GetPlayerProgress(selectedUnit)}%')
            BlzFrameSetText(Stats[2].Text, '{Deaths} {GetGameTotalDeaths(selectedUnit)}')
        } else if (Gamemode.CurrentGameMode == GameMode.TeamTournament) {
            // Team
            BlzFrameSetText(Stats[0].Text, '{GetPlayerTeamName(selectedUnit)}')
            BlzFrameSetText(Stats[4].Text, '{GetPlayerProgress(selectedUnit)}%')
            BlzFrameSetText(Stats[1].Text, '{Saves} {GetGameTotalSaves(selectedUnit)}')
            BlzFrameSetText(Stats[2].Text, '{Deaths} {GetGameTotalDeaths(selectedUnit)}')
        }
    }

    private static SetCommonFrameText(selectedUnit: unit) {
        BlzFrameSetText(Stats[4].Text, '{Gold} {GetPlayerGold(selectedUnit)}')
        BlzFrameSetText(Stats[5].Text, '{MoveSpeed} {GetUnitMoveSpeed(selectedUnit)}')
        BlzFrameSetText(Stats[2].Text, '{Deaths} {Colors.COLOR_RED}{GetPlayerDeaths(selectedUnit)}|r')
    }

    private static GetPlayerTeamName(u: unit) {
        return (team = Globals.PLAYERS_TEAMS.TryGetValue(u.Owner) /* TODO; Prepend: Team */
            ? team.TeamColor
            : '{Colors.COLOR_YELLOW_ORANGE}Aches: Team{Colors.COLOR_RESET}')
    }

    private static GetPlayerGold(u: unit) {
        return u.Owner.Gold
    }

    private static GetPlayerProgress(u: unit) {
        return Globals.ALL_KITTIES[u.Owner].TimeProg.GetRoundProgress(Globals.ROUND).ToString('F2')
    }

    private static GetPlayerSaves(u: unit) {
        return Globals.ALL_KITTIES[u.Owner].SaveData.GameStats.Saves
    }

    private static GetPlayerDeaths(u: unit) {
        return Globals.ALL_KITTIES[u.Owner].SaveData.GameStats.Deaths
    }

    private static GetPlayerSaveStreak(u: unit) {
        return Globals.ALL_KITTIES[u.Owner].SaveData.GameStats.SaveStreak
    }

    private static GetPlayerTime(u: unit) {
        return Utility.ConvertFloatToTime(Globals.ALL_KITTIES[u.Owner].TimeProg.GetRoundTime(Globals.ROUND))
    }

    private static GetCurrentRoundSaves(u: unit) {
        return Globals.ALL_KITTIES[u.Owner].CurrentStats.RoundSaves
    }

    private static GetCurrentRoundDeaths(u: unit) {
        return Globals.ALL_KITTIES[u.Owner].CurrentStats.RoundDeaths
    }

    private static GetGameTotalSaves(u: unit) {
        return Globals.ALL_KITTIES[u.Owner].CurrentStats.TotalSaves
    }

    private static GetGameTotalDeaths(u: unit) {
        return Globals.ALL_KITTIES[u.Owner].CurrentStats.TotalDeaths
    }
}
