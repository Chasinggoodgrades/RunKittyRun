using System;
using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class NamedWolves
{
    public static List<Wolf> DNTNamedWolves { get; set; } = new List<Wolf>();
    public static Wolf ExplodingWolf;
    public static Wolf StanWolf;
    public static texttag StanNameTag = texttag.Create();
    public static texttag ExplodingWolfNameTag = texttag.Create();
    private static timer ExplodingTexttagTimer = timer.Create();
    private static timer ExplodingWolfRevive = timer.Create();
    private static string BLOOD_EFFECT_PATH = "war3mapImported\\Bloodstrike.mdx";

    /// <summary>
    /// Creates the named Wolves Marco and Stan. Only works in Standard mode.
    /// </summary>
    public static void CreateNamedWolves()
    {
        if (Gamemode.CurrentGameMode != "Standard") return;
        DNTNamedWolves.Clear();
        CreateStanWolf();
        CreateExplodingWolf();
    }

    private static void CreateExplodingWolf()
    {
        var index = GetRandomInt(0, RegionList.WolfRegions.Length - 1);
        ExplodingWolf = new Wolf(index);
        ExplodingWolfNameTag.SetPermanent(true);
        ExplodingTexttagTimer.Start(0.03f, true, () => ExplodingWolfNameTag.SetPosition(ExplodingWolf.Unit.X, ExplodingWolf.Unit.Y, 0.015f));
        ExplodingWolfDesc();
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
        StanWolf.Unit.IsInvulnerable = false;
        BurntMeat.RegisterDeathTrigger();
        Utility.SimpleTimer(1.0f, () => StanNameTag.SetPosition(StanWolf.Unit.X, StanWolf.Unit.Y, 0.015f));
        DNTNamedWolves.Add(StanWolf);
    }

    public static void KillExplodingWolf()
    {
        try
        {
            if (ExplodingWolf.IsReviving) return;
            ExplodingWolf.Unit.Kill();
            ExplodingWolf.IsReviving = true;
            ExplodingWolf.OVERHEAD_EFFECT_PATH = "";
            ExplodingWolfNameTag.SetText("", 0.015f);
            Utility.CreateEffectAndDispose(BLOOD_EFFECT_PATH, ExplodingWolf.Unit, "origin");
            ExplodingWolfRevive.Start(25.0f, false, () =>
            {
                DNTNamedWolves.Remove(ExplodingWolf);
                ExplodingWolf.IsReviving = false;
                ExplodingWolf.Unit?.Dispose();
                ExplodingWolf.Unit = unit.Create(ExplodingWolf.Unit.Owner, Wolf.WOLF_MODEL, ExplodingWolf.Unit.X, ExplodingWolf.Unit.Y, 360);
                ExplodingWolfDesc();
            });
        }
        catch
        {
            Logger.Warning("Error in KillExplodingWolf");
        }
    }

    private static void ExplodingWolfDesc()
    {
        try
        {
            Utility.MakeUnitLocust(ExplodingWolf.Unit);
            var randomPlayer = GetRandomPlayerFromLobby();
            SetRandomVertexColor(ExplodingWolf.Unit, randomPlayer.Id);
            ExplodingWolf.Unit.Name = Utility.FormattedColorPlayerName(randomPlayer);
            ExplodingWolf.OVERHEAD_EFFECT_PATH = Wolf.DEFAULT_OVERHEAD_EFFECT;
            ExplodingWolfNameTag.SetText(ExplodingWolf.Unit.Name, 0.015f);
            DNTNamedWolves.Add(ExplodingWolf);
        }
        catch
        {
            Logger.Warning("Error in ExplodingWolfDesc");
        }
    }

    public static bool ExplodingWolfCollision(unit unit, Kitty k)
    {
        if (Gamemode.CurrentGameMode != "Standard") return false;
        if (unit != ExplodingWolf.Unit) return false;
        Utility.GiveGoldFloatingText(25, k.Unit);
        KillExplodingWolf();
        return true;
    }

    public static void ShowWolfNames(bool hidden = true)
    {
        if (DNTNamedWolves.Count == 0) return;
        ExplodingWolfNameTag.SetVisibility(hidden);
        StanNameTag.SetVisibility(hidden);
    }

    private static player GetRandomPlayerFromLobby()
    {
        return Globals.ALL_PLAYERS[GetRandomInt(0, Globals.ALL_PLAYERS.Count - 1)];
    }

    private static void SetRandomVertexColor(unit u, int playerID)
    {
        Colors.SetUnitToVertexColor(u, playerID);
    }

}