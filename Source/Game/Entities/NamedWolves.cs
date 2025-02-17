using WCSharp.Api;
using static WCSharp.Api.Common;

public static class NamedWolves
{
    public static Wolf MarcoWolf;
    private static Wolf StanWolf;
    private static timer MarcoRevive = timer.Create();

    public static void CreateNamedWolves()
    {
        CreateMarcoWolf();
        CreateStanWolf();
    }

    private static void CreateMarcoWolf()
    {
        var index = GetRandomInt(0, RegionList.WolfRegions.Length - 1);
        MarcoWolf = new Wolf(index);
        MarcoWolf.Unit.SetColor(playercolor.Yellow);
    }

    private static void CreateStanWolf()
    {
        // this clown doesnt move :)
        var index = GetRandomInt(0, RegionList.WolfRegions.Length - 1);
        StanWolf = new Wolf(index);
        StanWolf.Unit.IsPaused = true;
        StanWolf.WanderTimer.Pause();
        StanWolf.WanderTimer = null;
        StanWolf.Unit.SetColor(playercolor.Purple);
    }

    public static bool MarcoSucksLmao()
    {
        if (!MarcoWolf.Unit.Alive) return false;
        MarcoWolf.Unit.Kill();
        MarcoRevive.Start(25.0f, false, () =>
        {
            MarcoWolf.Unit.Revive(MarcoWolf.Unit.X, MarcoWolf.Unit.Y, true);
        });
        return true;
    }

}