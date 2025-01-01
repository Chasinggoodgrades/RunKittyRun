using System.Collections.Generic;

public static class DecodeOldsave
{

    private static GameAwardsData awards = Globals.GAME_AWARDS;
    private static GameTimesData times = Globals.GAME_TIMES;
    private static GameStatsData stats = Globals.GAME_STATS;

    public static List<KeyValuePair<string, int>> decodeValues = new List<KeyValuePair<string, int>>
    {
        new KeyValuePair<string, int>(nameof(awards.ButterflyAura), 1),
        new KeyValuePair<string, int>(nameof(awards.DivinityTendrils), 1),
        new KeyValuePair<string, int>(nameof(awards.GreenTendrils), 1),
        new KeyValuePair<string, int>(nameof(awards.RedTendrils), 1),  
        new KeyValuePair<string, int>(nameof(awards.WhiteTendrils), 1),  
        new KeyValuePair<string, int>(nameof(awards.GreenLightning), 1),  
        new KeyValuePair<string, int>(nameof(awards.YellowLightning), 1),  
        new KeyValuePair<string, int>(nameof(awards.PurpleLightning), 1),  
        new KeyValuePair<string, int>(nameof(awards.RedLightning), 1),  
        new KeyValuePair<string, int>(nameof(awards.WWSwift), 1),  
        new KeyValuePair<string, int>(nameof(awards.WWNecro), 1),  
        new KeyValuePair<string, int>(nameof(awards.WWFire), 1),  
        new KeyValuePair<string, int>(nameof(awards.WWBlue), 1),  
        new KeyValuePair<string, int>(nameof(awards.WWBlood), 1),  
        new KeyValuePair<string, int>(nameof(awards.Deathless5), 1),  
        new KeyValuePair<string, int>(nameof(awards.Deathless4), 1),  
        new KeyValuePair<string, int>(nameof(awards.Deathless3), 1),  
        new KeyValuePair<string, int>(nameof(awards.Deathless2), 1),  
        new KeyValuePair<string, int>(nameof(awards.Deathless1), 1),  
        new KeyValuePair<string, int>(nameof(awards.WhiteFire), 1),  
        new KeyValuePair<string, int>(nameof(awards.PinkFire), 1),  
        new KeyValuePair<string, int>(nameof(awards.BlueFire), 1),  
        new KeyValuePair<string, int>(nameof(awards.TurquoiseFire), 1),  
        new KeyValuePair<string, int>(nameof(awards.NitroPurple), 1),  
        new KeyValuePair<string, int>(nameof(awards.NitroGreen), 1),  
        new KeyValuePair<string, int>(nameof(awards.NitroRed), 1),  
        new KeyValuePair<string, int>(nameof(awards.NitroBlue), 1),  
        new KeyValuePair<string, int>(nameof(awards.Nitro), 1),  
        new KeyValuePair<string, int>(nameof(times.RoundFiveNormal), 420),
        new KeyValuePair<string, int>(nameof(times.RoundFourNormal), 300),
        new KeyValuePair<string, int>(nameof(times.RoundThreeNormal), 300),
        new KeyValuePair<string, int>(nameof(times.RoundTwoNormal), 300),
        new KeyValuePair<string, int>(nameof(times.RoundOneNormal), 300),
        new KeyValuePair<string, int>(nameof(stats.WinStreak), 100),
        new KeyValuePair<string, int>(nameof(stats.NormalWins), 999),  
        new KeyValuePair<string, int>(nameof(stats.NormalGames), 9999), 
        new KeyValuePair<string, int>(nameof(stats.Saves), 99999),  
        new KeyValuePair<string, int>(nameof(stats.Deaths), 99999),  
        new KeyValuePair<string, int>(nameof(awards.PurpleFire), 1),  
        new KeyValuePair<string, int>(nameof(awards.PatrioticTendrils), 1),  
        new KeyValuePair<string, int>(nameof(awards.DivineLight), 1),  
        new KeyValuePair<string, int>(nameof(awards.ZandalariKitty), 1), 
    };

}