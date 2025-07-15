using System.Collections.Generic;
using WCSharp.Api;

public static class Standard
{
    private static trigger KittyReachedLevelSix;
    private static trigger KittyReachedLevelTen;
    private const float ROUND_INTERMISSION = 10.0f;
    private const float ALERT_DURATION = 7.0f;

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
