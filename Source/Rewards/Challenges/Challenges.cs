using WCSharp.Api;

public static class Challenges
{
    public const int DIVINITY_TENDRILS_COUNT = 4;
    public const int FREEZE_AURA_WOLF_REQUIREMENT = 50;
    private const int TURQUOISE_FIRE_DEATH_REQUIREMENT = 10;
    private const int BLUE_FIRE_DEATH_REQUIREMENT = 25;
    private const int PURPLE_FIRE_DEATH_REQUIREMENT = 0;
    private const float PINK_FIRE_SD_REQUIREMENT = 3.0f;
    private const int WHITE_FIRE_DEATH_REQUIREMENT = 3;
    private const int PURPLE_LIGHTNING_SAVE_REQUIREMENT = 175;

    public static void Initialize()
    {
        NitroChallenges.Initialize();
        DeathlessChallenges.Initialize();
        DoubleBackingTrigger();
    }

    public static void WhiteTendrils()
    {
        if (!DifficultyConfig.MeetsDifficultyRequirement(DifficultyLevel.Impossible)) return;
        AwardManager.GiveRewardAll(nameof(Globals.GAME_AWARDS_SORTED.Wings.WhiteTendrils));
    }

    public static void DivinityTendrils(player player) => AwardManager.GiveReward(player, nameof(Globals.GAME_AWARDS_SORTED.Wings.DivinityTendrils));

    public static void NecroWindwalk()
    {
        if (Globals.GAME_TIMER.Remaining > 1500) return; // only awarded if under 25 mins.
        AwardManager.GiveRewardAll(nameof(Globals.GAME_AWARDS_SORTED.Windwalks.WWNecro));
    }

    // Violet Windwalk, awarded for killing stan with something, then taking some burnt meat n and turning it in.
    public static void VioletWindwalk(player player)
    {
        AwardManager.GiveReward(player, nameof(Globals.GAME_AWARDS_SORTED.Windwalks.WWViolet));
    }

    // finished round, then run all the way back to the start.
    public static void DivineWindwalk(player player)
    {
        AwardManager.GiveReward(player, nameof(Globals.GAME_AWARDS_SORTED.Windwalks.WWDivine));
    }

    // Kibble Event, give all
    public static void HuntressKitty()
    {
        AwardManager.GiveRewardAll(nameof(Globals.GAME_AWARDS_SORTED.Skins.HuntressKitty));
    }

    public static void PatrioticLight(Kitty kitty)
    {
        if (!DifficultyConfig.IsVirtualRound(5, 5)) return;
        if (Difficulty.DifficultyValue == (int)DifficultyLevel.Progressive) return;
        if (!DifficultyConfig.MeetsDifficultyRequirement(DifficultyLevel.Impossible)) return;
        if (Globals.GAME_TIMER.Remaining > 995) return; // Formally 20 mins, now 16:35 and awards to all players.
        AwardManager.GiveRewardAll(nameof(Globals.GAME_AWARDS_SORTED.Nitros.PatrioticLight));
    }

    public static void ButterflyAura(player player)
    {
        if (!DifficultyConfig.MeetsDifficultyRequirement(DifficultyLevel.Impossible)) return;
        var currentDeaths = Globals.ALL_KITTIES[player].CurrentStats.RoundDeaths;
        if (currentDeaths > 5) return;
        AwardManager.GiveReward(player, nameof(Globals.GAME_AWARDS_SORTED.Auras.ButterflyAura));
    }

    public static void PurpleFire(player player)
    {
        var currentDeaths = Globals.ALL_KITTIES[player].CurrentStats.RoundDeaths;
        if (!DifficultyConfig.IsVirtualRound(2, 2) || currentDeaths > PURPLE_FIRE_DEATH_REQUIREMENT) return;
        if (!DifficultyConfig.MeetsDifficultyRequirement(DifficultyLevel.Impossible)) return;
        AwardManager.GiveReward(player, nameof(Globals.GAME_AWARDS_SORTED.Trails.PurpleFire));
    }

    public static void BlueFire()
    {
        foreach (var player in Globals.ALL_PLAYERS)
        {
            var gameDeaths = Globals.ALL_KITTIES[player].CurrentStats.TotalDeaths;
            if (gameDeaths >= BLUE_FIRE_DEATH_REQUIREMENT) continue;
            AwardManager.GiveReward(player, nameof(Globals.GAME_AWARDS_SORTED.Trails.BlueFire));
        }
    }

    public static void TurquoiseFire(player player)
    {
        var currentDeaths = Globals.ALL_KITTIES[player].CurrentStats.RoundDeaths;
        if (!DifficultyConfig.IsVirtualRound(5, 5) || currentDeaths > TURQUOISE_FIRE_DEATH_REQUIREMENT) return;
        AwardManager.GiveReward(player, nameof(Globals.GAME_AWARDS_SORTED.Trails.TurquoiseFire));
    }

    public static void PinkFire()
    {
        foreach (var player in Globals.ALL_PLAYERS)
        {
            var stats = Globals.ALL_KITTIES[player].CurrentStats;
            var currentSaves = stats.TotalSaves;
            var currentDeaths = stats.TotalDeaths;

            if (currentDeaths == 0 ? currentSaves < PINK_FIRE_SD_REQUIREMENT : (float)(currentSaves / currentDeaths) < PINK_FIRE_SD_REQUIREMENT) continue;

            AwardManager.GiveReward(player, nameof(Globals.GAME_AWARDS_SORTED.Trails.PinkFire));
        }
    }

    public static void WhiteFire(player player)
    {
        if (NitroChallenges.GetNitroTimeRemaining() <= 0) return;
        var currentDeaths = Globals.ALL_KITTIES[player].CurrentStats.RoundDeaths;
        if (!DifficultyConfig.IsVirtualRound(3, 3) || currentDeaths > WHITE_FIRE_DEATH_REQUIREMENT) return;
        AwardManager.GiveReward(player, nameof(Globals.GAME_AWARDS_SORTED.Trails.WhiteFire));
    }

    public static void PurpleLighting(Kitty kitty)
    {
        if (kitty.CurrentStats.TotalSaves < PURPLE_LIGHTNING_SAVE_REQUIREMENT) return;
        AwardManager.GiveReward(kitty.Player, nameof(Globals.GAME_AWARDS_SORTED.Trails.PurpleLightning));
    }

    public static void GreenLightning(player player)
    {
        var kitty = Globals.ALL_KITTIES[player];
        var currentDeaths = kitty.CurrentStats.RoundDeaths;
        var saveStreak = kitty.SaveData.GameStats.SaveStreak; // current or overall, either is fine tbh.
        if (saveStreak < 10 || currentDeaths > 0) return;
        AwardManager.GiveReward(player, nameof(Globals.GAME_AWARDS_SORTED.Trails.GreenLightning));
    }

    public static void FreezeAura()
    {
        if (!Gameover.WinGame) return;
        foreach (var kitty in Globals.ALL_KITTIES_LIST)
        {
            if (kitty.CurrentStats.WolfFreezeCount < FREEZE_AURA_WOLF_REQUIREMENT) continue;
            AwardManager.GiveReward(kitty.Player, nameof(Globals.GAME_AWARDS_SORTED.Auras.FreezeAura));
        }
    }

    public static void TemperedAura()
    {
        if (!Gameover.WinGame) return;
        if (!DifficultyConfig.MeetsDifficultyRequirement(DifficultyLevel.Impossible)) return;
        foreach (var kitty in Globals.ALL_KITTIES_LIST)
        {
            if (kitty.Player.Lumber < 500) continue; // looks weird.. tho lumber is whats the total collected without me adding a variable
            AwardManager.GiveRewardAll(nameof(Globals.GAME_AWARDS_SORTED.Auras.TemperedAura));
            break;
        }
    }

    public static void ZandalariKitty()
    {
        if (!DifficultyConfig.MeetsDifficultyRequirement(DifficultyLevel.Hard)) return;
        if (!Gameover.WinGame) return;

        var requiredNitroRound = DifficultyConfig.IsProgressive ? 2 : 4;

        foreach (var kitty in Globals.ALL_KITTIES_LIST)
        {
            if (!kitty.CurrentStats.ObtainedNitros.Contains(requiredNitroRound)) continue;
            AwardManager.GiveReward(kitty.Player, nameof(Globals.GAME_AWARDS_SORTED.Skins.ZandalariKitty));
        }
    }

    private static void DoubleBackingTrigger()
    {
        if (Gamemode.CurrentGameMode != GameMode.Standard) return;
        var t = trigger.Create();
        Blizzard.TriggerRegisterEnterRegionSimple(t, RegionList.SafeZones[0].Region);
        t.AddAction(ErrorHandler.Wrap(() =>
        {
            var unit = @event.Unit;
            var player = unit.Owner;
            if (!Globals.GAME_ACTIVE) return;
            if (unit.UnitType != Constants.UNIT_KITTY) return;
            if (!Globals.ALL_PLAYERS.Contains(player)) return;
            if (!Globals.ALL_KITTIES[player].CurrentStats.RoundFinished) return;
            DivineWindwalk(player);
        }));
    }
}

public class YellowLightning
{
    private const int YELLOW_LIGHTNING_SAVE_REQUIREMENT = 6;
    private const float YELLOW_LIGHTNING_TIMER = 3.0f;
    public Kitty Kitty { get; private set; }
    public AchesTimers Timer { get; private set; }
    public int SaveCount { get; private set; }

    public YellowLightning(Kitty kitty)
    {
        Kitty = kitty;
        Timer = ObjectPool<AchesTimers>.GetEmptyObject();
    }

    public void SaveIncrement()
    {
        if (Timer.Timer.Remaining <= 0) Timer.Timer.Start(YELLOW_LIGHTNING_TIMER, false, EndTimer);
        SaveCount++;
    }

    private void EndTimer()
    {
        if (SaveCount >= YELLOW_LIGHTNING_SAVE_REQUIREMENT && Gamemode.CurrentGameMode == GameMode.Standard)
        {
            AwardManager.GiveReward(Kitty.Player, nameof(Globals.GAME_AWARDS_SORTED.Trails.YellowLightning));
        }
        SaveCount = 0;
    }

    public void Dispose()
    {
        Timer.Pause();
        Timer.Dispose();
    }
}
