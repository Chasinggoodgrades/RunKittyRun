using WCSharp.Shared.Data;

public static class PodiumManager
{

    public static Point[] PodiumSpots;

    public static void Initialize()
    {
        SetPodiumPositions();
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