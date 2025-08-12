export class Standard {
    private ROUND_INTERMISSION: number = 10.0

    public static Initialize() {
        RoundManager.ROUND_INTERMISSION = Source.Program.Debug ? 0.0 : ROUND_INTERMISSION
        ShadowKitty.Initialize()
        Difficulty.Initialize()
        Windwalk.Initialize()
        ProtectionOfAncients.Initialize()
        SpawnChampions.Initialize()
        RollerSkates.Initialize()
        EasterEggManager.LoadEasterEggs()
        AntiblockWand.Initialize()
        Relic.RegisterRelicEnabler()
    }
}
