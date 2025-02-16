using WCSharp.Api;
using static WCSharp.Api.Common;

public static class NamedWolves
{
    private static Wolf MarcoWolf;
    private static Wolf StanWolf;

    public static void Initialize()
    {
    }

    public static void CreateNamedWolves()
    {

    }


    private static void CreateMarcoWolf()
    {
        var index = GetRandomInt(0, RegionList.WolfRegions.Length - 1);
        MarcoWolf = new Wolf(index);
        MarcoWolf.
    }

    private static void CreateStanWolf()
    {

    }

}