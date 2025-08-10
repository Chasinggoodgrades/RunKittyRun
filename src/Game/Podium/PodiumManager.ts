

class PodiumManager
{
    public static Point[] PodiumSpots;

    public static Initialize()
    {
        SetPodiumPositions();
    }

    public static BeginPodiumEvents()
    {
        switch (Gamemode.CurrentGameMode)
        {
            case GameMode.Standard:
                StandardPodium.BeginPodiumActions();
                break;

            case GameMode.SoloTournament:
                SoloPodium.BeginPodiumActions();
                break;

            case GameMode.TeamTournament:
                TeamPodium.BeginPodiumActions();
                break;
        }
    }

    private static SetPodiumPositions()
    {
        PodiumSpots = new[]
{
            Regions.Podium_1.Center,
            Regions.Podium_2.Center,
            Regions.Podium_3.Center
        };
    }
}
