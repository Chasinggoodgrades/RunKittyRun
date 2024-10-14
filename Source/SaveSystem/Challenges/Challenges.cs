using static WCSharp.Api.Common;
using WCSharp.Api;
using System.Collections.Generic;
public static class Challenges
{
    private static Dictionary<player, timer> YellowLightningPairs = new Dictionary<player, timer>();
    public const int DIVINITY_TENDRILS_COUNT = 4;
    private const int TURQUOISE_FIRE_DEATH_REQUIREMENT = 10;
    private const int BLUE_FIRE_DEATH_REQUIREMENT = 25;
    private const int PURPLE_FIRE_DEATH_REQUIREMENT = 0;
    private const float PINK_FIRE_SD_REQUIREMENT = 3.0f;
    private const int WHITE_FIRE_DEATH_REQUIREMENT = 3;
    private const int PURPLE_LIGHTNING_SAVE_REQUIREMENT = 175;
    public static void Initialize()
    {
        Deathless.Initialize();
        Nitros.Initialize();
    }
    public static void WhiteTendrils() => AwardManager.GiveRewardAll(Awards.White_Tendrils);
    public static void DivinityTendrils(player player) => AwardManager.GiveReward(player, Awards.Divinity_Tendrils);
    public static void NecroWindwalk() => AwardManager.GiveRewardAll(Awards.WW_Necro);
    public static void ButterflyAura(player player)
    {
        if (Difficulty.DifficultyValue != (int)DifficultyLevel.Impossible) return;
        AwardManager.GiveReward(player, Awards.Butterfly_Aura);
    }
    public static void PurpleFire(player player)
    {
        var currentDeaths = Globals.ALL_KITTIES[player].CurrentStats.RoundDeaths;
        if (Globals.ROUND != 2 && currentDeaths > PURPLE_FIRE_DEATH_REQUIREMENT) return;
        AwardManager.GiveReward(player, Awards.Purple_Fire);
    }
    public static void BlueFire()
    {
        foreach(var player in Globals.ALL_PLAYERS)
        {
            var gameDeaths = Globals.ALL_KITTIES[player].CurrentStats.TotalDeaths;
            if (gameDeaths >= BLUE_FIRE_DEATH_REQUIREMENT) return;
            AwardManager.GiveReward(player, Awards.Blue_Fire);
        }
    }
    public static void TurquoiseFire(player player)
    {
        var currentDeaths = Globals.ALL_KITTIES[player].CurrentStats.RoundDeaths;
        if (Globals.ROUND != 5 && currentDeaths > TURQUOISE_FIRE_DEATH_REQUIREMENT) return;
    }
    public static void PinkFire()
    {
        foreach(var player in Globals.ALL_PLAYERS)
        {
            var stats = Globals.ALL_KITTIES[player].CurrentStats;
            var currentSaves = stats.TotalSaves;
            var currentDeaths = stats.TotalDeaths;
            if ((float)currentSaves / currentDeaths < PINK_FIRE_SD_REQUIREMENT) return;
            AwardManager.GiveReward(player, Awards.Pink_Fire);
        }
    }
    public static void WhiteFire(player player)
    {
        if (Nitros.GetNitroTimeRemaining() <= 0) return;
        var currentDeaths = Globals.ALL_KITTIES[player].CurrentStats.RoundDeaths;
        if (Globals.ROUND != 3 && currentDeaths > WHITE_FIRE_DEATH_REQUIREMENT) return;
        AwardManager.GiveReward(player, Awards.White_Fire);
    }

    public static void PurpleLighting(Kitty kitty)
    {
        if (kitty.CurrentStats.TotalSaves < PURPLE_LIGHTNING_SAVE_REQUIREMENT) return;
        AwardManager.GiveReward(kitty.Player, Awards.Purple_Lightning);
    }

    public static void GreenLightning(player player)
    {
        var kitty = Globals.ALL_KITTIES[player];
        var currentDeaths = kitty.CurrentStats.RoundDeaths;
        var saveStreak = kitty.SaveData.GameStats[StatTypes.SaveStreak];
        if (saveStreak < 10 && currentDeaths > 0) return;
        AwardManager.GiveReward(player, Awards.Green_Lightning);
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
        Timer = CreateTimer();
    }

    public void SaveIncrement()
    {
        if (Timer.Remaining <= 0) Timer.Start(YELLOW_LIGHTNING_TIMER, false, EndTimer);
        SaveCount++;
    }

    private void EndTimer()
    {
        if(SaveCount >= YELLOW_LIGHTNING_SAVE_REQUIREMENT)
        {
            AwardManager.GiveReward(Player, Awards.Yellow_Lightning);
        }
        SaveCount = 0;
    }

    public void Dispose() => Timer.Dispose();

}