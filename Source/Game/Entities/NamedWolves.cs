using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class NamedWolves
{
    public static List<Wolf> DNTNamedWolves { get; set; } = new List<Wolf>();
    public static Wolf MarcoWolf;
    private static Wolf StanWolf;
    public static texttag StanNameTag = texttag.Create();
    public static texttag MarcoNameTag = texttag.Create();
    private static timer MarcoTexttagTimer = timer.Create();
    private static timer MarcoRevive = timer.Create();
    private static string BLOOD_EFFECT_PATH = "war3mapImported\\Bloodstrike.mdx";

    /// <summary>
    /// Creates the named Wolves Marco and Stan. Only works in Standard mode.
    /// </summary>
    public static void CreateNamedWolves()
    {
        if (Gamemode.CurrentGameMode != "Standard") return;
        DNTNamedWolves.Clear();
        CreateStanWolf();
        CreateMarcoWolf();
    }

    private static void CreateMarcoWolf()
    {
        var index = GetRandomInt(0, RegionList.WolfRegions.Length - 1);
        MarcoWolf = new Wolf(index);
        MarcoNameTag.SetPermanent(true);
        MarcoTexttagTimer.Start(0.03f, true, () => MarcoNameTag.SetPosition(MarcoWolf.Unit.X, MarcoWolf.Unit.Y, 0.015f));
        MarcoWolfDesc();
    }

    private static void CreateStanWolf()
    {
        // this clown doesnt move :)
        var index = GetRandomInt(0, RegionList.WolfRegions.Length - 1);
        StanWolf = new Wolf(index);
        StanWolf.WanderTimer.Pause();
        StanWolf.WanderTimer = null;
        StanWolf.Unit.SetVertexColor(235, 115, 255);
        StanWolf.Unit.Name = $"{Colors.COLOR_PURPLE}Stan|r";
        StanNameTag.SetText(StanWolf.Unit.Name, 0.015f);
        StanNameTag.SetPermanent(true);
        StanWolf.IsPaused = true;
        Utility.SimpleTimer(1.0f, () => StanNameTag.SetPosition(StanWolf.Unit.X, StanWolf.Unit.Y, 0.015f));
        DNTNamedWolves.Add(StanWolf);
    }

    public static void MarcoDiedAgainLmao()
    {
        if (!MarcoWolf.Unit.Alive) return;
        MarcoWolf.Unit.Kill();
        MarcoWolf.OVERHEAD_EFFECT_PATH = "";
        MarcoNameTag.SetText("", 0.015f);
        Utility.CreateEffectAndDispose(BLOOD_EFFECT_PATH, MarcoWolf.Unit, "origin");
        MarcoRevive.Start(25.0f, false, () =>
        {
            DNTNamedWolves.Remove(MarcoWolf);
            MarcoWolf.Unit?.Dispose();
            MarcoWolf.Unit = unit.Create(player.NeutralExtra, Constants.UNIT_CUSTOM_DOG, MarcoWolf.Unit.X, MarcoWolf.Unit.Y, 0.0f);
            MarcoWolfDesc();
        });
    }

    private static void MarcoWolfDesc()
    {
        Utility.MakeUnitLocust(MarcoWolf.Unit);
        MarcoWolf.Unit.SetVertexColor(255, 255, 175);
        MarcoWolf.Unit.Name = $"{Colors.COLOR_YELLOW}Marco|r";
        MarcoWolf.OVERHEAD_EFFECT_PATH = Wolf.DEFAULT_OVERHEAD_EFFECT;
        MarcoNameTag.SetText(MarcoWolf.Unit.Name, 0.015f);
        DNTNamedWolves.Add(MarcoWolf);
    }

    public static void ShowWolfNames(bool hidden = true)
    {
        if (DNTNamedWolves.Count == 0) return;
        MarcoNameTag.SetVisibility(hidden);
        StanNameTag.SetVisibility(hidden);
    }

}