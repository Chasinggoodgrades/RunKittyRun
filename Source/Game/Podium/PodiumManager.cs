using WCSharp.Shared.Data;

public static class PodiumManager
{

    public static Point[] PodiumSpots;

    public static void Initialize()
    {
        SetPodiumPositions();
    }

    public static void BeginPodiumEvents()
    {
        var gamemode = Gamemode.CurrentGameMode;
        switch(Gamemode.CurrentGameMode)
        {
            case "Standard":
                StandardPodium.BeginPodiumActions();
                break;
            case "Tournament Solo":
                SoloPodium.BeginPodiumActions();
                break;
            case "Tournament Team":
                TeamPodium.BeginPodiumActions();
                break;
        }
    }

    private static void SetPodiumPositions()
    {
        PodiumSpots = new[]
{
            Regions.Podium_1.Center,
            Regions.Podium_2.Center,
            Regions.Podium_3.Center
        };
    }




}