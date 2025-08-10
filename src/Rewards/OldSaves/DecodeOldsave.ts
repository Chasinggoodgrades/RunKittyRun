

class DecodeOldsave
{
    private static awards: GameAwardsDataSorted = Globals.GAME_AWARDS_SORTED;
    private static times: RoundTimesData = Globals.GAME_TIMES;
    private static stats: GameStatsData = Globals.GAME_STATS;

    public static List<KeyValuePair<string, int>> decodeValues = new List<KeyValuePair<string, int>>
    {
        new KeyValuePair<string, int>(nameof(awards.Auras.ButterflyAura), 1),
        new KeyValuePair<string, int>(nameof(awards.Wings.DivinityTendrils), 1),
        new KeyValuePair<string, int>(nameof(awards.Wings.GreenTendrils), 1),
        new KeyValuePair<string, int>(nameof(awards.Wings.RedTendrils), 1),
        new KeyValuePair<string, int>(nameof(awards.Wings.WhiteTendrils), 1),
        new KeyValuePair<string, int>(nameof(awards.Trails.GreenLightning), 1),
        new KeyValuePair<string, int>(nameof(awards.Trails.YellowLightning), 1),
        new KeyValuePair<string, int>(nameof(awards.Trails.PurpleLightning), 1),
        new KeyValuePair<string, int>(nameof(awards.Trails.RedLightning), 1),
        new KeyValuePair<string, int>(nameof(awards.Windwalks.WWSwift), 1),
        new KeyValuePair<string, int>(nameof(awards.Windwalks.WWNecro), 1),
        new KeyValuePair<string, int>(nameof(awards.Windwalks.WWFire), 1),
        new KeyValuePair<string, int>(nameof(awards.Windwalks.WWBlue), 1),
        new KeyValuePair<string, int>(nameof(awards.Windwalks.WWBlood), 1),
        new KeyValuePair<string, int>(nameof(awards.Deathless.NormalDeathless5), 1),
        new KeyValuePair<string, int>(nameof(awards.Deathless.NormalDeathless4), 1),
        new KeyValuePair<string, int>(nameof(awards.Deathless.NormalDeathless3), 1),
        new KeyValuePair<string, int>(nameof(awards.Deathless.NormalDeathless2), 1),
        new KeyValuePair<string, int>(nameof(awards.Deathless.NormalDeathless1), 1),
        new KeyValuePair<string, int>(nameof(awards.Trails.WhiteFire), 1),
        new KeyValuePair<string, int>(nameof(awards.Trails.PinkFire), 1),
        new KeyValuePair<string, int>(nameof(awards.Trails.BlueFire), 1),
        new KeyValuePair<string, int>(nameof(awards.Trails.TurquoiseFire), 1),
        new KeyValuePair<string, int>(nameof(awards.Nitros.NitroPurple), 1),
        new KeyValuePair<string, int>(nameof(awards.Nitros.NitroGreen), 1),
        new KeyValuePair<string, int>(nameof(awards.Nitros.NitroRed), 1),
        new KeyValuePair<string, int>(nameof(awards.Nitros.NitroBlue), 1),
        new KeyValuePair<string, int>(nameof(awards.Nitros.Nitro), 1),
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
        new KeyValuePair<string, int>(nameof(awards.Trails.PurpleFire), 1),
        new KeyValuePair<string, int>(nameof(awards.Wings.PatrioticTendrils), 1),
        new KeyValuePair<string, int>(nameof(awards.Nitros.DivineLight), 1),
        new KeyValuePair<string, int>(nameof(awards.Skins.ZandalariKitty), 1),
    };
}
