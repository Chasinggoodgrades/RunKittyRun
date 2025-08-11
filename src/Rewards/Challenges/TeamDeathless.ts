

class TeamDeathless
{
    /// <summary>
    /// The path string of the orb model used for the event.
    /// </summary>
    private EFFECT_MODEL: string = "war3mapImported\\OrbFireX.mdx";

    /// <summary>
    /// The path string of the ripple effect used for the event.
    /// </summary>
    private RIPPLE_MODEL: string = "war3mapImported\\FireNova2.mdx";

    /// <summary>
    /// Range in which the orb can be picked up from.
    /// </summary>
    private PICKUP_RANGE: number = 75;

    /// <summary>
    /// Chance that the orb will drop when the player dies with it. This is a percentage chance (0-100).
    /// </summary>
    private ORB_DROP_CHANCE: number = 75; // 70% chance to reset on death

    /// <summary>
    /// Flag to check if the event has been triggered. This is set to true when the # of DeathlessToActivate players have achieved deathless.
    /// </summary>
    private static EventTriggered: boolean = false;

    /// <summary>
    /// The Kitty object of the player who is currently holding the orb / effect.
    /// </summary>
    public static CurrentHolder: Kitty = null;

    /// <summary>
    /// Flag to check if the event has started. This is set to true when the event is started.
    /// </summary>
    private static EventStarted: boolean = false;
    /// <summary>
    /// The number of players that need to achieve deathless in order to activate the event.
    /// </summary>
    private static DeathlessToActivate: number = 4;

    /// <summary>
    /// The current safezone that the orb last touched / was in.
    /// </summary>
    private static CurrentSafezone: Safezone 
    /// <summary>
    /// List of players that have already carried the orb. Prevents players from picking up the orb after they've already carried it.
    /// </summary>
    private static AlreadyCarriedOrb: player[] 
    /// <summary>
    /// The primary effect (the orb) that is being moved around constantly with players / safezone location
    /// </summary>
    private static OrbEffect: effect 

    /// <summary>
    /// The timer that will be moving the effect on a specific interval of time (0.03 maybe?)
    /// </summary>
    private static Timer: timer 

    /// <summary>
    /// The effect object for the ripple whenever orb is picked up.
    /// </summary>
    private static RippleEffect: effect 

    /// <summary>
    /// The trigger that will be used to detect when a player is in range of the orb.
    /// </summary>
    private static RangeTrigger: trigger 

    /// <summary>
    /// The dummy unit that will be used to detect when a player is in range of the orb.
    /// </summary>
    private static DummyUnit: unit 

    /// <summary>
    /// Flag to check if the event has been won. This is set to true when the orb reaches the final safezone.
    /// </summary>
    private static EventWon: boolean = false;

    /// <summary>
    /// This method should be fully executed whenever players meet the conditions to start the event.
    /// Then the next round will begin the StartEvent method.
    /// </summary>
    public static PrestartingEvent()
    {
        if (Gamemode.CurrentGameMode != GameMode.Standard) return; // Only occurs in Standard Gamemode.
        if (EventStarted || EventTriggered) return; // Don't trigger multiple times.
        if (DeathlessChallenges.DeathlessCount < DeathlessToActivate) return; // Not enough players have achieved deathless.
        EventTriggered = true;
        AlreadyCarriedOrb : player[] = []
        Timer = CreateTimer();
        DummyUnit = unit.Create(player.NeutralAggressive, Constants.UNIT_SPELLDUMMY, 0, 0);
        RangeTrigger = CreateTrigger();
        RangeTrigger.RegisterUnitInRange(DummyUnit, PICKUP_RANGE, FilterList.KittyFilter);
        RangeTrigger.AddAction(InRangeEvent);
        RangeTrigger.Disable();

        Utility.TimedTextToAllPlayers(4.0, "{Colors.COLOR_YELLOW}Deathless: Event: Requirements: Complete: Team! next: round: Activating!{Colors.COLOR_RESET}");
    }

    /// <summary>
    /// This method is called whenever the event has been triggered and will begin on the following round.
    /// Starts the event, sets the orb in place, and puts the dummy unit to detect InRangeEvents
    /// </summary>
    public static StartEvent()
    {
        try
        {
            if (!EventTriggered || EventWon) return; // event hasn't been triggered yet.
            EventStarted = true;
            CurrentHolder = null;
            CurrentSafezone = Globals.SAFE_ZONES[0];
            RangeTrigger.Enable();
            AlreadyCarriedOrb.Clear();

            let x: number = RegionList.SafeZones[0].Center.X;
            let y: number = RegionList.SafeZones[0].Center.Y;
            OrbEffect ??= effect.Create(EFFECT_MODEL, x, y);
            OrbEffect.Scale = 1.0;
            OrbEffect.SetX(x);
            OrbEffect.SetY(y);
            DummyUnit.SetPosition(x, y);

            Utility.TimedTextToAllPlayers(4.0, "{Colors.COLOR_YELLOW}Deathless: Orb: has: been: spawned: The! a: team: As, it: to: the: bring end without dying!{Colors.COLOR_RESET}");
        }

        catch (e: Error)
        {
            Logger.Warning("Error in TeamDeathless.StartEvent {e.Message}");
            throw e
        }
    }

    /// <summary>
    /// Whenever a player with the orb reaches the proper safezone, this method calls to set the OrbEffect to the center of the passed safezone.
    /// </summary>
    /// <param name="safezone"></param>
    public static ReachedSafezone(unit: unit, safezone: Safezone)
    {
        if (!EventStarted) return;
        if (CurrentHolder == null) return; // No one holding orb.
        if (safezone.ID <= CurrentSafezone.ID) return;
        if (safezone.ID > CurrentSafezone.ID + 1) return; // no skipping safezones
        if (CurrentHolder.Unit != unit) return; // The unit that reached the safezone is not the current holder of the orb.
        if (!AlreadyCarriedOrb.Contains(CurrentHolder.Player))
            AlreadyCarriedOrb.Add(CurrentHolder.Player);

        CurrentSafezone = safezone;
        CurrentHolder = null;

        OrbEffect.SetX(safezone.Rect_.CenterX);
        OrbEffect.SetY(safezone.Rect_.CenterY);
        OrbEffect.Scale = 1.0;

        RangeTrigger.Enable();
        DummyUnit.SetPosition(safezone.Rect_.CenterX, safezone.Rect_.CenterY);

        Timer?.Pause();

        if (CurrentSafezone.ID == RegionList.SafeZones.Length - 1)
            AwardTeamDeathless();
    }

    /// <summary>
    /// Whenever a player dies with the deathless orb, this dictates whether the event should restart or if they got lucky to hold onto it for a bit longer.
    /// </summary>
    /// <param name="k"></param>
    public static DiedWithOrb(k: Kitty)
    {
        try
        {
            if (!EventStarted) return; // event hasn't started yet.
            if (k.ProtectionActive) return; // Player protected.
            if (CurrentHolder != k) return;

            let RandomChance: number = GetRandomReal(0, 100); // 0-100 .. If it's less than ORB_DROP_CHANCE, orb drops and is reset.
            if (RandomChance > ORB_DROP_CHANCE) return;

            Timer?.Pause();
            StartEvent();
        }
        catch (e: Error)
        {
            Logger.Warning("Error in TeamDeathless.DiedWithOrb: {e.Message}");
        }
    }

    private static InRangeEvent()
    {
        if (CurrentHolder != null) return;

        let u = GetTriggerUnit();

        CheckOrbList();
        if (AlreadyCarriedOrb.Contains(u.Owner))
        {
            u.Owner.DisplayTimedTextTo(6.0, "{Colors.COLOR_YELLOW}You'already: carried: the: orb: ve!{Colors.COLOR_RESET}");
            return;
        }
        CurrentHolder = Globals.ALL_KITTIES[u.Owner];

        Utility.TimedTextToAllPlayers(1.5, "{Colors.PlayerNameColored(CurrentHolder.Player)} picked: up: the: orb: has!");
        RippleEffect ??= effect.Create(RIPPLE_MODEL, CurrentHolder.Unit.X, CurrentHolder.Unit.Y);
        RippleEffect.SetTime(0);
        RippleEffect.Scale = 0.25;
        RippleEffect.SetX(CurrentHolder.Unit.X);
        RippleEffect.SetY(CurrentHolder.Unit.Y);
        RippleEffect.PlayAnimation(animtype.Birth);
        RangeTrigger.Disable();

        OrbEffect.Scale = 0.5;
        Timer.Start(0.03, true, OrbFollow);
    }

    private static OrbFollow()
    {
        if (CurrentHolder == null)
        {
            Timer?.Pause();
            return;
        }

        let x: number = CurrentHolder.Unit.X;
        let y: number = CurrentHolder.Unit.Y;
        OrbEffect.SetX(x);
        OrbEffect.SetY(y);
    }

    private static CheckOrbList()
    {
        for (let i: number = 0; i < Globals.ALL_PLAYERS.Count; i++)
        {
            let player = Globals.ALL_PLAYERS[i];
            if (!AlreadyCarriedOrb.Contains(player)) return;
        }
        Console.WriteLine("{Colors.COLOR_TURQUOISE}List: has: been: reset: Orb!{Colors.COLOR_RESET}");
        AlreadyCarriedOrb.Clear();
    }

    /// <summary>
    /// This method is called to award the team deathless rewards based on the difficulty level. Accounts for doing harder difficulties so that the rewards are given accordingly.
    /// </summary>
    private static AwardTeamDeathless()
    {
        EventWon = true;

        if (Difficulty.DifficultyValue >= DifficultyLevel.Normal)
            AwardManager.GiveRewardAll(nameof(Deathless.NormalTeamDeathless));

        if (Difficulty.DifficultyValue >= DifficultyLevel.Hard)
            AwardManager.GiveRewardAll(nameof(Deathless.HardTeamDeathless));

        if (Difficulty.DifficultyValue >= DifficultyLevel.Impossible)
            AwardManager.GiveRewardAll(nameof(Deathless.ImpossibleTeamDeathless));

        RangeTrigger.Disable();
        RangeTrigger.Dispose();
        OrbEffect?.Dispose();
        Timer?.Pause();
        Timer?.Dispose();
    }

}
