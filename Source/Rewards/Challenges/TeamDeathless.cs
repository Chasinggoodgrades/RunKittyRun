using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class TeamDeathless
{
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
    /// List of players that have already carried the orb. Prevents players from picking up the orb after they've already carried it.
    /// </summary>
    private static List<player> AlreadyCarriedOrb { get; set; }

    public static void Initialize()
    {
        if (Gamemode.CurrentGameMode != "Standard") return;
        AlreadyCarriedOrb = new List<player>();
    }

    public static void PrestartingEvent()
    {
        if (EventStarted) return; // don't trigger multiple times.
        if (DeathlessChallenges.DeathlessCount < DeathlessToActivate) return; // not enough players have achieved deathless.
        EventTriggered = true;
    }

    public static void StartEvent()
    {
        if (!EventTriggered) return; // event hasn't been triggered yet.
        if (EventStarted) return; // event already started.
        EventStarted = true;



    }


}
