using System;
using System.Collections.Generic;
using System.Threading;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class TeamDeathless
{
    /// <summary>
    /// The path string for the model of the effect that we'll be using. Should be a fiery orb.
    /// </summary>
    private const string EFFECT_MODEL = "war3mapImported\\OrbFireX.mdx";

    private const string RIPPLE_MODEL = "war3mapImported\\FireNova2.mdx";

    private const float PICKUP_RANGE = 75f;

    private const float ORB_DROP_CHANCE = 50f; // 50% chance that event / orb resets whenever die with orb.

    /// <summary>
    /// Flag to check if the event has been triggered. This is set to true when the # of DeathlessToActivate players have achieved deathless.
    /// </summary>
    private static bool EventTriggered { get; set; } = false;
    /// <summary>
    /// Flag to check if the event has started. This is set to true when the event is started.
    /// </summary>
    private static bool EventStarted { get; set; } = false;
    /// <summary>
    /// The number of players that need to achieve deathless in order to activate the event.
    /// </summary>
    private static int DeathlessToActivate { get; set; } = 0;
    /// <summary>
    /// The Kitty object of the player who is currently holding the orb / effect.
    /// </summary>
    private static Kitty CurrentHolder { get; set; }

    private static Safezone CurrentSafezone { get; set; }
    /// <summary>
    /// List of players that have already carried the orb. Prevents players from picking up the orb after they've already carried it.
    /// </summary>
    private static List<player> AlreadyCarriedOrb { get; set; }
    /// <summary>
    /// The primary effect (the orb) that is being moved around constantly with players / safezone location
    /// </summary>
    private static effect OrbEffect { get; set; }
    /// <summary>
    /// The timer that will be moving the effect on a specific interval of time (0.03 maybe?)
    /// </summary>
    ///
    private static effect RippleEffect { get; set; }
    private static timer Timer { get; set; }

    private static trigger RangeTrigger { get; set; }

    private static unit DummyUnit { get; set; }

    public static void PrestartingEvent()
    {
        if (Gamemode.CurrentGameMode != "Standard") return; // Only occurs in Standard Gamemode.
        if (EventStarted || EventTriggered) return; // Don't trigger multiple times.
        if (DeathlessChallenges.DeathlessCount < DeathlessToActivate) return; // Not enough players have achieved deathless.
        EventTriggered = true;
        AlreadyCarriedOrb = new List<player>();
        Timer = CreateTimer();
        DummyUnit = unit.Create(player.NeutralAggressive, Constants.UNIT_SPELLDUMMY, 0, 0);
        RangeTrigger = CreateTrigger();
        RangeTrigger.RegisterUnitInRange(DummyUnit, PICKUP_RANGE, FilterList.KittyFilter);
        RangeTrigger.AddAction(InRangeEvent);
        Console.WriteLine("-- EVENT TRIGGERED TEXT GOES HERE -- [PLACEHOLDER]");
    }

    public static void StartEvent()
    {
        try
        {
            if (!EventTriggered) return; // event hasn't been triggered yet.
            EventStarted = true;
            CurrentHolder = null;
            CurrentSafezone = Globals.SAFE_ZONES[0];
            AlreadyCarriedOrb.Clear();

            float x = RegionList.SafeZones[0].Center.X;
            float y = RegionList.SafeZones[0].Center.Y;
            OrbEffect ??= effect.Create(EFFECT_MODEL, x, y);
            OrbEffect.Scale = 1.0f;
            OrbEffect.SetX(x);
            OrbEffect.SetY(y);
            DummyUnit.SetPosition(x, y);

            Console.WriteLine("DEBUG: Team Deathless Event Activated");
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in TeamDeathless.StartEvent {e.Message}");
            throw;
        }
    }

    public static void ReachedSafezone(Safezone safezone)
    {
        if (!EventStarted) return;
        if (CurrentHolder == null) return; // No one holding orb.
        if (safezone.ID <= CurrentSafezone.ID) return;
        if (safezone.ID > CurrentSafezone.ID + 1) return; // no skipping safezones
        if (!AlreadyCarriedOrb.Contains(CurrentHolder.Player))
            AlreadyCarriedOrb.Add(CurrentHolder.Player);

        CurrentSafezone = safezone;
        CurrentHolder = null;

        OrbEffect.SetX(safezone.Rect_.CenterX);
        OrbEffect.SetY(safezone.Rect_.CenterY);
        OrbEffect.Scale = 1.0f;

        DummyUnit.SetPosition(safezone.Rect_.CenterX, safezone.Rect_.CenterY);

        Timer?.Pause();

        if (CurrentSafezone.ID == RegionList.SafeZones.Length - 1) Console.WriteLine("GIVING AWAY!! HURRAY");
        Console.WriteLine("DEBUG: Reached Safezone");
    }

    public static void DiedWithOrb(Kitty k)
    {
        try
        {
            if (!EventStarted) return; // event hasn't started yet.
            if (CurrentHolder == null) return;

            float RandomChance = GetRandomReal(0, 100); // 0-100 .. If it's less than 50, orb drops and is reset.
            if (RandomChance > ORB_DROP_CHANCE) return;

            Timer?.Pause();
            StartEvent();
        }
        catch (Exception e)
        {
            Console.WriteLine($"Error in TeamDeathless.DiedWithOrb: {e.Message}");
        }
    }

    private static void InRangeEvent()
    {
        if (CurrentHolder != null) return;

        var u = GetTriggerUnit();

        CheckOrbList();
        if (AlreadyCarriedOrb.Contains(u.Owner))
        {
            u.Owner.DisplayTimedTextTo(6.0f, $"{Colors.COLOR_YELLOW}You've already carried the orb!{Colors.COLOR_RESET}");
            return;
        }
        CurrentHolder = Globals.ALL_KITTIES[u.Owner];

        Utility.TimedTextToAllPlayers(1.5f, $"{Colors.PlayerNameColored(CurrentHolder.Player)} has picked up the orb!");
        RippleEffect ??= effect.Create(RIPPLE_MODEL, CurrentHolder.Unit.X, CurrentHolder.Unit.Y);
        RippleEffect.SetTime(0);
        RippleEffect.Scale = 0.25f;
        RippleEffect.SetX(CurrentHolder.Unit.X);
        RippleEffect.SetY(CurrentHolder.Unit.Y);
        RippleEffect.PlayAnimation(animtype.Birth);

        OrbEffect.Scale = 0.5f;
        Timer.Start(0.03f, true, OrbFollow);
    }

    private static void OrbFollow()
    {
        if (CurrentHolder == null)
        {
            Console.WriteLine("DEBUG: CurrentHolder is null");
            Timer?.Pause();
            return;
        }

        float x = CurrentHolder.Unit.X;
        float y = CurrentHolder.Unit.Y;
        OrbEffect.SetX(x);
        OrbEffect.SetY(y);
    }

    private static void CheckOrbList()
    {
        for(int i = 0; i < Globals.ALL_PLAYERS.Count; i++)
        {
            var player = Globals.ALL_PLAYERS[i];
            if (!AlreadyCarriedOrb.Contains(player)) return;
        }

        AlreadyCarriedOrb.Clear();
    }
}
