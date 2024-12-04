using WCSharp.Api;

public static class SoloMultiboard
{
    private static multiboard SoloOverallStatsMB;
    private static multiboard SoloBestTimesMB;
    private static trigger ESCTrigger;

    public static void Initialize()
    {
        if (Gamemode.CurrentGameMode != Globals.GAME_MODES[1]) return;
        ESCTrigger = trigger.Create();
    }
}