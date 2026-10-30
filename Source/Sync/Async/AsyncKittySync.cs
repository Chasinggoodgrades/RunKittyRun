using System;
using WCSharp.Api;
using static WCSharp.Api.Common;

/// <summary>
/// C# port of AsyncHeroSync.ts for running Kitties. While a Kitty's stand-in effect is active
/// (see KittyAsyncEffect), the machine that owns it tells every other machine where it is and
/// where it is heading, using BlzSendSyncData the way the TS version does: the event it raises
/// fires on every machine in the same game turn, which is what turns a local truth into a state
/// the others can replay.
///
/// Channels:
///  - POSITION, ten times a second while the Kitty runs (and once more when it stops): where it is,
///    where it looks, the point it heads to and at what speed, enough for a receiver to carry the
///    run on by itself between two packets,
///  - CONTACT, whenever the owning machine sees its effect touch a wolf or a revive circle (see
///    AsyncContact). What a contact does changes the game itself, a death or a revive, so it
///    cannot be drawn by the machine that noticed alone: every machine, the sender included, runs
///    the game's own contact handler when the packet arrives, on the same turn.
///
/// A death needs no packet of its own: it follows the contact, and KillKitty stands the effect
/// down on every machine. The TS channels for terrain hand-back, event, caster aim and mortar hits
/// belong to sliding and are not ported yet.
///
/// Also owns the one global tick that moves every stand-in effect and reads the local click.
/// </summary>
public static class AsyncKittySync
{
    private const string POSITION_PREFIX = "Aches_POS";
    private const string CONTACT_PREFIX = "Aches_Contact";
    private const string STEER_PREFIX = "Aches_Steer";
    private static readonly int ORDER_MOVE_ID = OrderId("move");
    private const char FIELD_SEPARATOR = '|';

    /// <summary>Movement and input rate: fine enough to look smooth, as the effect is only ever drawn.</summary>
    private static float TICK_PERIOD => AsyncTuning.Get(22);

    /// <summary>Twenty a second by default (the TS version sent ten); tunable with -asynctune positionperiod.</summary>
    private static float POSITION_PERIOD => AsyncTuning.Get(20);

    private static bool isInitialized;
    private static timer tickTimer;
    private static timer positionTimer;

    /// <summary>Seconds since the tick started, on THIS machine. Only for local timeouts, never for synced logic.</summary>
    public static float Now { get; private set; }

    /// <summary>
    /// Registers the sync event and starts the timers. Called once at game start, on every
    /// machine alike, before any Kitty exists: timers and triggers are handles.
    /// </summary>
    public static void Initialize()
    {
        if (isInitialized) return;
        isInitialized = true;

        AsyncMouse.Initialize();
        Screen2World.Initialize();
        AsyncContact.Initialize();
        AsyncSkinModels.Initialize();

        RegisterPositionEvent();
        RegisterContactEvent();
        RegisterSteerEvent();

        tickTimer = timer.Create();
        tickTimer.Start(TICK_PERIOD, true, ErrorHandler.Wrap(Tick));

        positionTimer = timer.Create();
        positionTimer.Start(POSITION_PERIOD, true, ErrorHandler.Wrap(BroadcastLocalPosition));
    }

    /// <summary>Applies a changed position period (-asynctune positionperiod) to the running timer.</summary>
    public static void ApplyTuning()
    {
        positionTimer?.Start(POSITION_PERIOD, true, ErrorHandler.Wrap(BroadcastLocalPosition));
        tickTimer?.Start(TICK_PERIOD, true, ErrorHandler.Wrap(Tick));
    }

    private static void Tick()
    {
        Now += TICK_PERIOD;

        AsyncClickInput.Poll();

        var kitties = Globals.ALL_KITTIES_LIST;

        for (int i = 0; i < kitties.Count; i++)
        {
            kitties[i].AsyncEffect?.Advance(TICK_PERIOD);
        }
    }

    // ------------------------------------------------------------------ wire format

    // Whole numbers only: positions in game units are precise enough to the unit, and an integer
    // text reads back the same on every machine.
    private static int Whole(float value)
    {
        return (int)Math.Round(value);
    }

    private static string Encode(int kittyId, int sequence, KittyMovementState movement)
    {
        return $"{kittyId}{FIELD_SEPARATOR}{sequence}{FIELD_SEPARATOR}{Whole(movement.X)}{FIELD_SEPARATOR}{Whole(movement.Y)}{FIELD_SEPARATOR}{Whole(movement.Facing)}{FIELD_SEPARATOR}{Whole(movement.TargetX)}{FIELD_SEPARATOR}{Whole(movement.TargetY)}{FIELD_SEPARATOR}{(movement.IsMoving ? 1 : 0)}{FIELD_SEPARATOR}{Whole(movement.Speed)}";
    }

    private static bool TryDecode(string data, out int kittyId, out int sequence, out KittyMovementState movement)
    {
        var fields = data.Split(FIELD_SEPARATOR);

        kittyId = 0;
        sequence = 0;
        movement = default;

        if (fields.Length < 9) return false;

        kittyId = int.Parse(fields[0]);
        sequence = int.Parse(fields[1]);
        movement = new KittyMovementState(
            int.Parse(fields[2]),
            int.Parse(fields[3]),
            int.Parse(fields[4]),
            int.Parse(fields[5]),
            int.Parse(fields[6]),
            int.Parse(fields[7]) == 1,
            int.Parse(fields[8]));

        return true;
    }

    // ------------------------------------------------------------------ receiving

    private static void RegisterPositionEvent()
    {
        var trig = trigger.Create();

        foreach (var player in Globals.ALL_PLAYERS)
        {
            trig.RegisterPlayerSyncEvent(player, POSITION_PREFIX, false);
        }

        trig.AddAction(() =>
        {
            var sender = GetTriggerPlayer();

            if (!TryDecode(BlzGetTriggerSyncData(), out var kittyId, out var sequence, out var movement)) return;

            // a player only ever speaks for their own Kitty
            if (sender == null || sender.Id != kittyId) return;

            if (!Globals.ALL_KITTIES.TryGetValue(sender, out var kitty)) return;

            kitty.AsyncEffect?.ApplyPosition(sequence, movement);
        });
    }

    private static void RegisterContactEvent()
    {
        var trig = trigger.Create();

        foreach (var player in Globals.ALL_PLAYERS)
        {
            trig.RegisterPlayerSyncEvent(player, CONTACT_PREFIX, false);
        }

        trig.AddAction(() =>
        {
            var sender = GetTriggerPlayer();
            if (sender == null) return;

            var fields = BlzGetTriggerSyncData().Split(FIELD_SEPARATOR);
            if (fields.Length < 5) return;

            int kittyId = int.Parse(fields[0]);
            int kind = int.Parse(fields[1]);
            int id = int.Parse(fields[2]);

            // a player only ever speaks for their own Kitty
            if (sender.Id != kittyId) return;
            if (!Globals.ALL_KITTIES.TryGetValue(sender, out var kitty)) return;

            var fx = kitty.AsyncEffect;
            if (fx == null) return;

            // read before anything else, on every machine alike: a Kitty that stopped standing in meanwhile is left to its unit
            if (!fx.IsActive)
            {
                fx.ReleaseContactHold();
                return;
            }

            fx.SetContactPoint(int.Parse(fields[3]), int.Parse(fields[4]));

            if (kind == AsyncContact.KIND_WOLF)
            {
                var wolf = Wolf.GetById(id);

                if (wolf != null && wolf.Unit != null)
                {
                    CollisionDetection.HandleWolfContact(kitty, wolf.Unit);
                }
            }
            else if (kind == AsyncContact.KIND_CIRCLE)
            {
                if (Globals.ALL_KITTIES.TryGetValue(Player(id), out var circleKitty) && circleKitty.Circle != null && circleKitty.Circle.Unit != null)
                {
                    CollisionDetection.HandleCircleContact(kitty, circleKitty.Circle.Unit);
                }
            }

            fx.ClearContactPoint();
            fx.ReleaseContactHold();
        });
    }

    // ------------------------------------------------------------------ sending

    /// <summary>
    /// Tells every machine, this one included, what the effect of the Kitty this machine owns just
    /// touched, and where it stood. Only its owner calls this: it is the only one knowing.
    /// </summary>
    /// <summary>
    /// Owner only: asks every machine to give the Kitty's unit a move order to this point. Used while
    /// the right button is held, when the game does not keep issuing orders itself, and throttled by
    /// the effect (an order only now and then, and only when the target moved far enough).
    /// </summary>
    public static void SendSteer(int kittyId, float x, float y)
    {
        BlzSendSyncData(STEER_PREFIX, $"{kittyId}{FIELD_SEPARATOR}{Whole(x)}{FIELD_SEPARATOR}{Whole(y)}");
    }

    private static void RegisterSteerEvent()
    {
        var trig = trigger.Create();

        foreach (var player in Globals.ALL_PLAYERS)
        {
            trig.RegisterPlayerSyncEvent(player, STEER_PREFIX, false);
        }

        trig.AddAction(() =>
        {
            var sender = GetTriggerPlayer();
            if (sender == null) return;

            var fields = BlzGetTriggerSyncData().Split(FIELD_SEPARATOR);
            if (fields.Length < 3) return;

            // a player only ever speaks for their own Kitty
            if (sender.Id != int.Parse(fields[0])) return;
            if (!Globals.ALL_KITTIES.TryGetValue(sender, out var kitty)) return;

            var fx = kitty.AsyncEffect;
            if (fx == null || !fx.IsActive) return;
            if (!kitty.Unit.Alive || kitty.Unit.IsPaused) return;

            // the same order on every machine, on the same turn
            IssuePointOrderById(kitty.Unit, ORDER_MOVE_ID, int.Parse(fields[1]), int.Parse(fields[2]));
        });
    }

    public static void SendContact(int kittyId, int kind, int id, float x, float y)
    {
        BlzSendSyncData(CONTACT_PREFIX, $"{kittyId}{FIELD_SEPARATOR}{kind}{FIELD_SEPARATOR}{id}{FIELD_SEPARATOR}{Whole(x)}{FIELD_SEPARATOR}{Whole(y)}");
    }

    /// <summary>Sends the state of the Kitty this machine owns, while its effect stands in for it and it moves.</summary>
    private static void BroadcastLocalPosition()
    {
        var localPlayer = GetLocalPlayer();
        if (localPlayer == null) return;

        if (!Globals.ALL_KITTIES.TryGetValue(localPlayer, out var kitty)) return;

        var fx = kitty.AsyncEffect;
        if (fx == null) return;

        if (!fx.TryTakeBroadcast(out var sequence, out var movement)) return;

        BlzSendSyncData(POSITION_PREFIX, Encode(fx.KittyId, sequence, movement));
    }
}
