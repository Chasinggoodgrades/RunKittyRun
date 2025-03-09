using WCSharp.Api;

public static class Multiboard
{
    private static multiboard CurrentTeamsMB;
    private static multiboard TeamsStatsMB;
    private static multiboard StandardOverallStatsMB;
    private static multiboard StandardCurrentStatsMB;
    private static multiboard SoloOverallStatsMB;
    private static multiboard SoloBestTimesMB;
    private static trigger ESCTrigger;
    public static void Initialize()
    {
        SetupMultiboards();
    }

    private static void SetupMultiboards()
    {
        switch (Gamemode.CurrentGameMode)
        {
            case "Standard":
                StandardMultiboard.Initialize();
                break;
            case "Tournament Solo":
                SoloMultiboard.Initialize();
                break;
            case "Tournament Team":
                TeamsMultiboard.Initialize();
                break;
        }
    }
}
