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
            case GameMode.Standard:
                StandardMultiboard.Initialize();
                break;

            case GameMode.Solo:
                SoloMultiboard.Initialize();
                break;

            case GameMode.Team:
                TeamsMultiboard.Initialize();
                break;
        }
    }
}
