public static class Standard
{
    private const float ROUND_INTERMISSION = 10.0f;

    public static void Initialize()
    {
        RoundManager.ROUND_INTERMISSION = Source.Program.Debug ? 0.0f : ROUND_INTERMISSION;
        ShadowKitty.Initialize();
        Difficulty.Initialize();
        Windwalk.Initialize();
        ProtectionOfAncients.Initialize();
        SpawnChampions.Initialize();
        RollerSkates.Initialize();
        EasterEggManager.LoadEasterEggs();
        AntiblockWand.Initialize();
        Relic.RegisterRelicEnabler();
    }
}
