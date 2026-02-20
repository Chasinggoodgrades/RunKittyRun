public static class Standard
{
    public const float ROUND_INTERMISSION = 10.0f;

    public static void Initialize()
    {
        ShadowKitty.Initialize();
        Difficulty.Initialize();
        Windwalk.Initialize();
        ProtectionOfAncients.Initialize();
        SpawnChampions.Initialize();
        RollerSkates.Initialize();
        EasterEggManager.LoadEasterEggs();
        Relic.RegisterRelicEnabler();
    }

    public static void SetupProgressive()
    {
        Gamemode.NumberOfRounds = 3;
    }

    public static void SetupStandard()
    {
        Gamemode.NumberOfRounds = 5;
    }
}
