using WCSharp.Api;
using System.Collections.Generic;
public static class Challenges
{
    private static Dictionary<player, timer> YellowLightningPairs = new Dictionary<player, timer>();
    public static Dictionary<player, int> FreezeAuraCounts = new Dictionary<player, int>();
    public const int DIVINITY_TENDRILS_COUNT = 4;
    private const int TURQUOISE_FIRE_DEATH_REQUIREMENT = 10;
    private const int BLUE_FIRE_DEATH_REQUIREMENT = 25;
    private const int PURPLE_FIRE_DEATH_REQUIREMENT = 0;
    private const float PINK_FIRE_SD_REQUIREMENT = 3.0f;
    private const int WHITE_FIRE_DEATH_REQUIREMENT = 3;
    private const int PURPLE_LIGHTNING_SAVE_REQUIREMENT = 175;
    private const int FREEZE_AURA_WOLF_REQUIREMENT = 50;

    public static void Initialize()
    {
        Nitros.Initialize();
        Deathless.Initialize();
    }

    public static void WhiteTendrils()
    {
        if (Difficulty.DifficultyValue != (int)DifficultyLevel.Impossible) return;
        AwardManager.GiveRewardAll(nameof(Globals.GAME_AWARDS.WhiteTendrils));
    }

    public static void DivinityTendrils(player player) => AwardManager.GiveReward(player, nameof(Globals.GAME_AWARDS.DivinityTendrils));

    public static void NecroWindwalk() => AwardManager.GiveRewardAll(nameof(Globals.GAME_AWARDS.WWNecro));

    public static void ButterflyAura(player player)
    {
        if (Difficulty.DifficultyValue != (int)DifficultyLevel.Impossible) return;
        var currentDeaths = Globals.ALL_KITTIES[player].CurrentStats.RoundDeaths;
        if (currentDeaths > 5) return;
        AwardManager.GiveReward(player, nameof(Globals.GAME_AWARDS.ButterflyAura));
    }

    public static void PurpleFire(player player)
    {
        var currentDeaths = Globals.ALL_KITTIES[player].CurrentStats.RoundDeaths;
        if (Globals.ROUND != 2 || currentDeaths > PURPLE_FIRE_DEATH_REQUIREMENT) return;
        if (Difficulty.DifficultyValue < (int)DifficultyLevel.Impossible) return;
        AwardManager.GiveReward(player, nameof(Globals.GAME_AWARDS.PurpleFire));
    }

    public static void BlueFire()
    {
        foreach(var player in Globals.ALL_PLAYERS)
        {
            var gameDeaths = Globals.ALL_KITTIES[player].CurrentStats.TotalDeaths;
            if (gameDeaths >= BLUE_FIRE_DEATH_REQUIREMENT) return;
            AwardManager.GiveReward(player, nameof(Globals.GAME_AWARDS.BlueFire));
        }
    }

    public static void TurquoiseFire(player player)
    {
        var currentDeaths = Globals.ALL_KITTIES[player].CurrentStats.RoundDeaths;
        if (Globals.ROUND != 5 || currentDeaths > TURQUOISE_FIRE_DEATH_REQUIREMENT) return;
        AwardManager.GiveReward(player, nameof(Globals.GAME_AWARDS.TurquoiseFire));
    }

    public static void PinkFire()
    {
        foreach (var player in Globals.ALL_PLAYERS)
        {
            var stats = Globals.ALL_KITTIES[player].CurrentStats;
            var currentSaves = stats.TotalSaves;
            var currentDeaths = stats.TotalDeaths;

            if (currentDeaths == 0 ? currentSaves < PINK_FIRE_SD_REQUIREMENT : (float)(currentSaves / currentDeaths) < PINK_FIRE_SD_REQUIREMENT) return;

            AwardManager.GiveReward(player, nameof(Globals.GAME_AWARDS.PinkFire));
        }
    }

    public static void WhiteFire(player player)
    {
        if (Nitros.GetNitroTimeRemaining() <= 0) return;
        var currentDeaths = Globals.ALL_KITTIES[player].CurrentStats.RoundDeaths;
        if (Globals.ROUND != 3 || currentDeaths > WHITE_FIRE_DEATH_REQUIREMENT) return;
        AwardManager.GiveReward(player, nameof(Globals.GAME_AWARDS.WhiteFire));
    }

    public static void PurpleLighting(Kitty kitty)
    {
        if (kitty.CurrentStats.TotalSaves < PURPLE_LIGHTNING_SAVE_REQUIREMENT) return;
        AwardManager.GiveReward(kitty.Player, nameof(Globals.GAME_AWARDS.PurpleLightning));
    }

    public static void GreenLightning(player player)
    {
        var kitty = Globals.ALL_KITTIES[player];
        var currentDeaths = kitty.CurrentStats.RoundDeaths;
        var saveStreak = kitty.SaveData.GameStats.SaveStreak;
        if (saveStreak < 10 || currentDeaths > 0) return;
        AwardManager.GiveReward(player, nameof(Globals.GAME_AWARDS.GreenLightning));
    }

    public static void FreezeAura()
    {
        if (!Gameover.WinGame) return;
        foreach (var kitty in Globals.ALL_KITTIES.Values)
        {
            if (kitty.CurrentStats.WolfFreezeCount < FREEZE_AURA_WOLF_REQUIREMENT) continue;
            AwardManager.GiveReward(kitty.Player, nameof(Globals.GAME_AWARDS.FreezeAura));
        }
    }

    /// <summary>
    /// Hard+, Nitro Round 4 and Win game.
    /// </summary>
    /// <param name="player"></param>
    public static void ZandalariKitty()
    {
        if(Difficulty.DifficultyValue < (int)DifficultyLevel.Hard) return;
        if (!Gameover.WinGame) return;
        foreach (var kitty in Globals.ALL_KITTIES.Values)
        {
            if (!kitty.CurrentStats.ObtainedNitros.Contains(4)) continue;
                AwardManager.GiveReward(kitty.Player, nameof(Globals.GAME_AWARDS.ZandalariKitty));
        }
    }
}

public class YellowLightning
{
    private const int YELLOW_LIGHTNING_SAVE_REQUIREMENT = 6;
    private const float YELLOW_LIGHTNING_TIMER = 3.0f;
    public player Player { get; private set; }
    public timer Timer { get; private set; }
    public int SaveCount { get; private set; }
    public YellowLightning(player player)
    {
        Player = player;
        Timer = timer.Create();
    }

    public void SaveIncrement()
    {
        if (Timer.Remaining <= 0) Timer.Start(YELLOW_LIGHTNING_TIMER, false, EndTimer);
        SaveCount++;
    }

    private void EndTimer()
    {
        if(SaveCount >= YELLOW_LIGHTNING_SAVE_REQUIREMENT && Gamemode.CurrentGameMode == "Standard")
        {
            AwardManager.GiveReward(Player, nameof(Globals.GAME_AWARDS.YellowLightning));
        }
        SaveCount = 0;
    }

    public void Dispose() => Timer.Dispose();
}