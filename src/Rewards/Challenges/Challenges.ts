class Challenges {
    public DIVINITY_TENDRILS_COUNT: number = 4
    public FREEZE_AURA_WOLF_REQUIREMENT: number = 50
    private TURQUOISE_FIRE_DEATH_REQUIREMENT: number = 10
    private BLUE_FIRE_DEATH_REQUIREMENT: number = 25
    private PURPLE_FIRE_DEATH_REQUIREMENT: number = 0
    private PINK_FIRE_SD_REQUIREMENT: number = 3.0
    private WHITE_FIRE_DEATH_REQUIREMENT: number = 3
    private PURPLE_LIGHTNING_SAVE_REQUIREMENT: number = 175

    public static Initialize() {
        NitroChallenges.Initialize()
        DeathlessChallenges.Initialize()
        DoubleBackingTrigger()
    }

    public static WhiteTendrils() {
        if (Difficulty.DifficultyValue < DifficultyLevel.Impossible) return
        AwardManager.GiveRewardAll('WhiteTendrils')
    }

    public static DivinityTendrils(player: player) {
        return AwardManager.GiveReward(player, 'DivinityTendrils')
    }

    public static NecroWindwalk() {
        if (Globals.GAME_TIMER.Remaining > 1500) return // only awarded if under 25 mins.
        AwardManager.GiveRewardAll('WWNecro')
    }

    // Violet Windwalk, awarded for killing stan with something, then taking some burnt meat n and turning it in.
    public static VioletWindwalk(player: player) {
        AwardManager.GiveReward(player, 'WWViolet')
    }

    // finished round, then run all the way back to the start.
    public static DivineWindwalk(player: player) {
        AwardManager.GiveReward(player, 'WWDivine')
    }

    // Kibble Event, give all
    public static HuntressKitty() {
        AwardManager.GiveRewardAll('HuntressKitty')
    }

    public static PatrioticLight(kitty: Kitty) {
        if (Globals.ROUND != 5) return
        if (Difficulty.DifficultyValue < DifficultyLevel.Impossible) return
        if (Globals.GAME_TIMER.Remaining > 995) return // Formally 20 mins, now 16:35 and awards to all players.
        AwardManager.GiveRewardAll('PatrioticLight')
    }

    public static ButterflyAura(player: player) {
        if (Difficulty.DifficultyValue < DifficultyLevel.Impossible) return
        let currentDeaths = Globals.ALL_KITTIES[player].CurrentStats.RoundDeaths
        if (currentDeaths > 5) return
        AwardManager.GiveReward(player, 'ButterflyAura')
    }

    public static PurpleFire(player: player) {
        let currentDeaths = Globals.ALL_KITTIES[player].CurrentStats.RoundDeaths
        if (Globals.ROUND != 2 || currentDeaths > PURPLE_FIRE_DEATH_REQUIREMENT) return
        if (Difficulty.DifficultyValue < DifficultyLevel.Impossible) return
        AwardManager.GiveReward(player, 'PurpleFire')
    }

    public static BlueFire() {
        for (let player in Globals.ALL_PLAYERS) {
            let gameDeaths = Globals.ALL_KITTIES[player].CurrentStats.TotalDeaths
            if (gameDeaths >= BLUE_FIRE_DEATH_REQUIREMENT) continue
            AwardManager.GiveReward(player, 'BlueFire')
        }
    }

    public static TurquoiseFire(player: player) {
        let currentDeaths = Globals.ALL_KITTIES[player].CurrentStats.RoundDeaths
        if (Globals.ROUND != 5 || currentDeaths > TURQUOISE_FIRE_DEATH_REQUIREMENT) return
        AwardManager.GiveReward(player, 'TurquoiseFire')
    }

    public static PinkFire() {
        for (let player in Globals.ALL_PLAYERS) {
            let stats = Globals.ALL_KITTIES[player].CurrentStats
            let currentSaves = stats.TotalSaves
            let currentDeaths = stats.TotalDeaths

            if (
                currentDeaths == 0
                    ? currentSaves < PINK_FIRE_SD_REQUIREMENT
                    : currentSaves / currentDeaths < PINK_FIRE_SD_REQUIREMENT
            )
                continue

            AwardManager.GiveReward(player, 'PinkFire')
        }
    }

    public static WhiteFire(player: player) {
        if (NitroChallenges.GetNitroTimeRemaining() <= 0) return
        let currentDeaths = Globals.ALL_KITTIES[player].CurrentStats.RoundDeaths
        if (Globals.ROUND != 3 || currentDeaths > WHITE_FIRE_DEATH_REQUIREMENT) return
        AwardManager.GiveReward(player, 'WhiteFire')
    }

    public static PurpleLighting(kitty: Kitty) {
        if (kitty.CurrentStats.TotalSaves < PURPLE_LIGHTNING_SAVE_REQUIREMENT) return
        AwardManager.GiveReward(kitty.Player, 'PurpleLightning')
    }

    public static GreenLightning(player: player) {
        let kitty = Globals.ALL_KITTIES[player]
        let currentDeaths = kitty.CurrentStats.RoundDeaths
        let saveStreak = kitty.SaveData.GameStats.SaveStreak // current or overall, either is fine tbh.
        if (saveStreak < 10 || currentDeaths > 0) return
        AwardManager.GiveReward(player, 'GreenLightning')
    }

    public static FreezeAura() {
        if (!Gameover.WinGame) return
        for (let kitty in Globals.ALL_KITTIES) {
            if (kitty.Value.CurrentStats.WolfFreezeCount < FREEZE_AURA_WOLF_REQUIREMENT) continue
            AwardManager.GiveReward(kitty.Value.Player, 'FreezeAura')
        }
    }

    /// <summary>
    /// Hard+, Nitro Round 4 and Win game.
    /// </summary>
    /// <param name="player"></param>
    public static ZandalariKitty() {
        if (Difficulty.DifficultyValue < DifficultyLevel.Hard) return
        if (!Gameover.WinGame) return
        for (let kitty in Globals.ALL_KITTIES) {
            if (!kitty.Value.CurrentStats.ObtainedNitros.Contains(4)) continue
            AwardManager.GiveReward(kitty.Value.Player, 'ZandalariKitty')
        }
    }

    private static DoubleBackingTrigger() {
        if (Gamemode.CurrentGameMode != GameMode.Standard) return
        let t = CreateTrigger()
        TriggerRegisterEnterRegionSimple(t, RegionList.SafeZones[0].Region)
        t.AddAction(
            ErrorHandler.Wrap(() => {
                let unit = GetTriggerUnit()
                let player = unit.Owner
                if (!Globals.GAME_ACTIVE) return
                if (GetUnitTypeId(unit) != Constants.UNIT_KITTY) return
                if (!Globals.ALL_PLAYERS.Contains(player)) return
                if (!Globals.ALL_KITTIES[player].CurrentStats.RoundFinished) return
                DivineWindwalk(player)
            })
        )
    }
}

class YellowLightning {
    private YELLOW_LIGHTNING_SAVE_REQUIREMENT: number = 6
    private YELLOW_LIGHTNING_TIMER: number = 3.0
    public Kitty: Kitty
    public Timer: AchesTimers
    public SaveCount: number

    public YellowLightning(kitty: Kitty) {
        Kitty = kitty
        Timer = ObjectPool.GetEmptyObject<AchesTimers>()
    }

    public SaveIncrement() {
        if (Timer.Timer.Remaining <= 0) Timer.Timer.Start(YELLOW_LIGHTNING_TIMER, false, EndTimer)
        SaveCount++
    }

    private EndTimer() {
        if (SaveCount >= YELLOW_LIGHTNING_SAVE_REQUIREMENT && Gamemode.CurrentGameMode == GameMode.Standard) {
            AwardManager.GiveReward(Kitty.Player, 'YellowLightning')
        }
        SaveCount = 0
    }

    public Dispose() {
        Timer.Pause()
        Timer.Dispose()
    }
}
