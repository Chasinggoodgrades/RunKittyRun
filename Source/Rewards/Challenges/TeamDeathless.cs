using System.Collections.Generic;
using System.Threading;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class TeamDeathless
{
    /// <summary>
    /// The path string for the model of the effect that we'll be using. Should be a fiery orb.
    /// </summary>
    private const string EFFECT_MODEL = "";
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
    private static int DeathlessToActivate { get; set; } = 3;
    /// <summary>
    /// The Kitty object of the player who is currently holding the orb / effect.
    /// </summary>
    private static Kitty CurrentHolder { get; set; }
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
    private static timer Timer { get; set; }

    private static region EffectRegion { get; set; }

    private static trigger RangeTrigger { get; set; }

    public static void PrestartingEvent()
    {
        if (Gamemode.CurrentGameMode != "Standard") return; // Only occurs in Standard Gamemode.
        if (EventStarted || EventTriggered) return; // Don't trigger multiple times.
        if (DeathlessChallenges.DeathlessCount < DeathlessToActivate) return; // Not enough players have achieved deathless.
        EventTriggered = true;
        AlreadyCarriedOrb = new List<player>();
        Timer = CreateTimer();
        RangeTrigger = CreateTrigger();
        EffectRegion = CreateRegion();
    }

    public static void StartEvent()
    {
        if (!EventTriggered) return; // event hasn't been triggered yet.
        if (EventStarted) return; // event already started.
        EventStarted = true;
        OrbEffect ??= effect.Create(EFFECT_MODEL, RegionList.SafeZones[0].Center.X, RegionList.SafeZones[0].Center.Y);
        OrbEffect.SetX(RegionList.SafeZones[0].Center.X);
        OrbEffect.SetY(RegionList.SafeZones[0].Center.Y);
        AlreadyCarriedOrb.Clear();
        CurrentHolder = null;
        Timer.Start(0.03f, true, PeriodicRangeEvent);
    }

    private static void PeriodicRangeEvent()
    {
        if (!Globals.GAME_ACTIVE) return;
        if (CurrentHolder != null) return;


    }


}
