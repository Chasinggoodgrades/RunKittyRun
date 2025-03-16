using System;
using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class NamedWolves
{
    public static List<Wolf> DNTNamedWolves { get; set; } = new List<Wolf>();
    public static Wolf ExplodingWolf;
    public static Wolf StanWolf;
    public const string STAN_NAME = $"{Colors.COLOR_PURPLE}Stan|r";
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
        ExplodingWolf.Texttag.SetPermanent(true);
        ExplodingTexttagTimer.Start(0.03f, true, () => ExplodingWolf.Texttag.SetPosition(ExplodingWolf.Unit.X, ExplodingWolf.Unit.Y, 0.015f));
        ExplodingWolfDesc();
    }

    private static void CreateStanWolf()
    {
        var index = GetRandomInt(0, RegionList.WolfRegions.Length - 1);
        StanWolf = new Wolf(index);

        StanWolf.WanderTimer.Pause();
        StanWolf.WanderTimer = null;
        StanWolf.Unit.SetVertexColor(235, 115, 255);
        StanWolf.Unit.Name = STAN_NAME;

        StanWolf.Texttag ??= texttag.Create();
        StanWolf.Texttag.SetText(StanWolf.Unit.Name, 0.015f);
        StanWolf.Texttag.SetPermanent(true);
        StanWolf.IsPaused = true;

        StanWolf.Unit.IsInvulnerable = false;
        BurntMeat.RegisterDeathTrigger();

        Utility.SimpleTimer(0.03f, () => StanWolf.Texttag.SetPosition(StanWolf.Unit.X, StanWolf.Unit.Y, 0.015f));
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
            ExplodingWolf.Texttag.SetText("", 0.015f);
            Utility.CreateEffectAndDispose(BLOOD_EFFECT_PATH, ExplodingWolf.Unit, "origin");
            ExplodingWolfRevive.Start(25.0f, false, () =>
            {
                DNTNamedWolves.Remove(ExplodingWolf);
                ExplodingWolf.IsReviving = false;
                ExplodingWolf.Unit?.Dispose();
                Globals.ALL_WOLVES.Remove(ExplodingWolf.Unit);
                ExplodingWolf.Unit = unit.Create(ExplodingWolf.Unit.Owner, Wolf.WOLF_MODEL, ExplodingWolf.Unit.X, ExplodingWolf.Unit.Y, 360);
                Globals.ALL_WOLVES.Add(ExplodingWolf.Unit, ExplodingWolf);
                ExplodingWolfDesc();
            });
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in KillExplodingWolf {e.Message}");
        }
    }

    private static void ExplodingTexttag()
    {
        ExplodingWolf.Texttag ??= texttag.Create();
        ExplodingWolf.Texttag.SetText(ExplodingWolf.Unit.Name, 0.015f);
    }

    private static void ExplodingWolfDesc()
    {
        try
        {
            Utility.MakeUnitLocust(ExplodingWolf.Unit);
            var randomPlayer = GetRandomPlayerFromLobby();
            SetRandomVertexColor(ExplodingWolf.Unit, randomPlayer.Id);
            ExplodingWolf.Unit.Name = Utility.FormattedColorPlayerName(randomPlayer);
            ExplodingTexttag();
            ExplodingWolf.OVERHEAD_EFFECT_PATH = Wolf.DEFAULT_OVERHEAD_EFFECT;
            DNTNamedWolves.Add(ExplodingWolf);
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in ExplodingWolfDesc {e.Message}");
        }
    }

    public static bool ExplodingWolfCollision(unit unit, Kitty k)
    {
        if (Gamemode.CurrentGameMode != "Standard") return false;
        if (unit != ExplodingWolf.Unit) return false;
        Utility.GiveGoldFloatingText(25, k.Unit);
        BurntMeat.FlamesDropChance(k);
        KillExplodingWolf();
        return true;
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
