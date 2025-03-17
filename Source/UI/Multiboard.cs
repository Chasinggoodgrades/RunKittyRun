using WCSharp.Api;

public static class Multiboard
{
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
