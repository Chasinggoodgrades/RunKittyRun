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
    private const string ZONE_PREFIX = "Aches_Zone";
    private const string PICK_PREFIX = "Aches_Pick";

    /// <summary>How close the effect has to run over an item for its unit to take it.</summary>
    public const float PICKUP_RADIUS = 90f;
    private static readonly int ORDER_MOVE_ID = OrderId("move");
    private const char FIELD_SEPARATOR = '|';

    /// <summary>Movement and input rate: fine enough to look smooth, as the effect is only ever drawn.</summary>
    private static float TICK_PERIOD => AsyncTuning.Get(22);

    /// <summary>Twenty a second by default (the TS version sent ten); tunable with -asynctune positionperiod.</summary>
    private static float POSITION_PERIOD => AsyncTuning.Get(20);

    /// <summary>The player of THIS machine, read once: it never changes, and GetLocalPlayer is a native call.</summary>
    public static player LocalPlayer { get; private set; }

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
        LocalPlayer = GetLocalPlayer();

        AsyncMouse.Initialize();
        Screen2World.Initialize();
        AsyncContact.Initialize();
        AsyncSkinModels.Initialize();

        RegisterPositionEvent();
        RegisterContactEvent();
        RegisterSteerEvent();
        RegisterZoneEvent();
        RegisterPickEvent();

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

    // Position packet: three whole numbers, "a|b|c", each below 2^31 so they print and read back exactly.
    // The sender is the Kitty (checked against the player the packet comes from), so no id travels.
    //   a = ((sequence mod 64) * 2 + moving) * 256 + facing / 2, then * 65536 + x
    //   b = speed / 2 * 65536 + y
    //   c = targetX / 2 * 32768 + targetY / 2
    // x, y and the targets are offset by 32768 so they are never negative. Facing is kept to 2 degrees,
    // speed to 2 and the target to 2 units: it is only a heading for the others to carry on along.
    private const int COORD_OFFSET = 32768;

    private static int Pack16(float value)
    {
        int packed = Whole(value) + COORD_OFFSET;
        return packed < 0 ? 0 : (packed > 65535 ? 65535 : packed);
    }

    private static int Pack15Half(float value)
    {
        int packed = (Whole(value) + COORD_OFFSET) / 2;
        return packed < 0 ? 0 : (packed > 32767 ? 32767 : packed);
    }

    private static string Encode(int sequence, float x, float y, float facing, float targetX, float targetY, bool moving, float speed)
    {
        float heading = facing % 360f;
        if (heading < 0f) heading += 360f;

        int facingHalf = Whole(heading / 2f) % 180;
        int speedHalf = Whole(speed / 2f);
        if (speedHalf < 0) speedHalf = 0;
        if (speedHalf > 255) speedHalf = 255;

        int a = (((sequence % 64) * 2 + (moving ? 1 : 0)) * 256 + facingHalf) * 65536 + Pack16(x);
        int b = speedHalf * 65536 + Pack16(y);
        int c = Pack15Half(targetX) * 32768 + Pack15Half(targetY);

        return $"{a}{FIELD_SEPARATOR}{b}{FIELD_SEPARATOR}{c}";
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
            // a player only ever speaks for their own Kitty: the packet is theirs by who sent it
            var kitty = Globals.GetKitty(GetTriggerPlayer());
            if (kitty == null) return;

            var fields = BlzGetTriggerSyncData().Split(FIELD_SEPARATOR);
            if (fields.Length < 3) return;

            int a = int.Parse(fields[0]);
            int b = int.Parse(fields[1]);
            int c = int.Parse(fields[2]);

            float x = a % 65536 - COORD_OFFSET;
            int rest = a / 65536;
            float facing = (rest % 256) * 2f;
            rest /= 256;
            bool moving = rest % 2 == 1;
            int sequence = rest / 2;

            float speed = (b / 65536) * 2f;
            float y = b % 65536 - COORD_OFFSET;

            float targetX = (c / 32768) * 2f - COORD_OFFSET;
            float targetY = (c % 32768) * 2f - COORD_OFFSET;

            kitty.AsyncEffect?.ApplyPosition(sequence, x, y, facing, targetX, targetY, moving, speed);
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
            var kitty = Globals.GetKitty(sender);
            if (kitty == null) return;

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
                var circleKitty = Globals.GetKitty(Player(id));

                if (circleKitty != null && circleKitty.Circle != null && circleKitty.Circle.Unit != null)
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
            var kitty = Globals.GetKitty(sender);
            if (kitty == null) return;

            var fx = kitty.AsyncEffect;
            if (fx == null || !fx.IsActive) return;
            if (!kitty.Unit.Alive || kitty.Unit.IsPaused) return;

            // the same order on every machine, on the same turn
            IssuePointOrderById(kitty.Unit, ORDER_MOVE_ID, int.Parse(fields[1]), int.Parse(fields[2]));
        });
    }

    /// <summary>Owner only: the effect of this Kitty just entered a safezone / wolf area (see AsyncZones).</summary>
    public static void SendZone(int kittyId, int kind, int index)
    {
        BlzSendSyncData(ZONE_PREFIX, $"{kittyId}{FIELD_SEPARATOR}{kind}{FIELD_SEPARATOR}{index}");
    }

    private static void RegisterZoneEvent()
    {
        var trig = trigger.Create();

        foreach (var player in Globals.ALL_PLAYERS)
        {
            trig.RegisterPlayerSyncEvent(player, ZONE_PREFIX, false);
        }

        trig.AddAction(() =>
        {
            var sender = GetTriggerPlayer();
            if (sender == null) return;

            var fields = BlzGetTriggerSyncData().Split(FIELD_SEPARATOR);
            if (fields.Length < 3) return;

            // a player only ever speaks for their own Kitty
            if (sender.Id != int.Parse(fields[0])) return;
            var kitty = Globals.GetKitty(sender);
            if (kitty == null) return;

            var fx = kitty.AsyncEffect;
            if (fx == null || !fx.IsActive) return;
            if (kitty.Unit == null || !kitty.Unit.Alive) return;

            AsyncZones.Apply(kitty, int.Parse(fields[1]), int.Parse(fields[2]));
        });
    }

    /// <summary>Owner only: the effect runs over something to pick up here; the unit takes it, on every machine alike.</summary>
    public static void SendPickup(int kittyId, float x, float y)
    {
        BlzSendSyncData(PICK_PREFIX, $"{kittyId}{FIELD_SEPARATOR}{Whole(x)}{FIELD_SEPARATOR}{Whole(y)}");
    }

    private static void RegisterPickEvent()
    {
        var trig = trigger.Create();

        foreach (var player in Globals.ALL_PLAYERS)
        {
            trig.RegisterPlayerSyncEvent(player, PICK_PREFIX, false);
        }

        trig.AddAction(() =>
        {
            var sender = GetTriggerPlayer();
            if (sender == null) return;

            var fields = BlzGetTriggerSyncData().Split(FIELD_SEPARATOR);
            if (fields.Length < 3) return;

            // a player only ever speaks for their own Kitty
            if (sender.Id != int.Parse(fields[0])) return;
            var kitty = Globals.GetKitty(sender);
            if (kitty == null) return;

            var fx = kitty.AsyncEffect;
            if (fx == null || !fx.IsActive) return;
            if (kitty.Unit == null || !kitty.Unit.Alive) return;

            float x = int.Parse(fields[1]);
            float y = int.Parse(fields[2]);

            // the effect is never far from its unit; a point far off is not an honest one
            float dx = x - kitty.Unit.X, dy = y - kitty.Unit.Y;
            if (dx * dx + dy * dy > 700f * 700f) return;

            ItemSpatialGrid.KittyItemPickupAt(kitty, x, y, PICKUP_RADIUS);
        });
    }

    public static void SendContact(int kittyId, int kind, int id, float x, float y)
    {
        BlzSendSyncData(CONTACT_PREFIX, $"{kittyId}{FIELD_SEPARATOR}{kind}{FIELD_SEPARATOR}{id}{FIELD_SEPARATOR}{Whole(x)}{FIELD_SEPARATOR}{Whole(y)}");
    }

    /// <summary>Sends the state of the Kitty this machine owns, while its effect stands in for it and it moves.</summary>
    private static void BroadcastLocalPosition()
    {
        var kitty = Globals.GetKitty(LocalPlayer);
        if (kitty == null) return;

        var fx = kitty.AsyncEffect;
        if (fx == null) return;

        if (!fx.TryTakeBroadcast(out var sequence, out var x, out var y, out var facing, out var targetX, out var targetY, out var moving, out var speed)) return;

        BlzSendSyncData(POSITION_PREFIX, Encode(sequence, x, y, facing, targetX, targetY, moving, speed));
    }
}
