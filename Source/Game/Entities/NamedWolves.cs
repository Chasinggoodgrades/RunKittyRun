using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class NamedWolves
{
    public static List<Wolf> DNTNamedWolves { get; set; } = new List<Wolf>();
    public static Wolf MarcoWolf;
    private static Wolf StanWolf;
    private static timer MarcoRevive = timer.Create();
    private static string BLOOD_EFFECT_PATH = "war3mapImported\\Bloodstrike.mdx";

    public static void CreateNamedWolves()
    {
        DNTNamedWolves.Clear();
        CreateMarcoWolf();
        CreateStanWolf();
    }

    private static void CreateMarcoWolf()
    {
        var index = GetRandomInt(0, RegionList.WolfRegions.Length - 1);
        MarcoWolf = new Wolf(index);
        MarcoWolf.Unit.SetColor(playercolor.Yellow);
        MarcoWolf.Unit.Name = $"{Colors.COLOR_YELLOW}Marco|r";
        DNTNamedWolves.Add(MarcoWolf);
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
        StanWolf.Unit.Name = $"{Colors.COLOR_PURPLE}Stan|r";
        DNTNamedWolves.Add(StanWolf);
    }

    public static void MarcoDiedAgainLmao()
    {
        if (!MarcoWolf.Unit.Alive) return;
        MarcoWolf.Unit.Kill();
        Utility.CreateEffectAndDispose(BLOOD_EFFECT_PATH, MarcoWolf.Unit, "origin");
        MarcoRevive.Start(25.0f, false, () =>
        {
            MarcoWolf.Unit?.Dispose();
            MarcoWolf.Unit = unit.Create(player.NeutralExtra, Constants.UNIT_CUSTOM_DOG, MarcoWolf.Unit.X, MarcoWolf.Unit.Y, 0.0f);
            MarcoWolf.Unit.SetColor(playercolor.Yellow);
            MarcoWolf.Unit.Name = $"{Colors.COLOR_YELLOW}Marco|r";
        });
    }

}