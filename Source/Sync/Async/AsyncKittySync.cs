using WCSharp.Api;
using static WCSharp.Api.Common;

/// <summary>
/// C# port of AsyncHeroSync.ts. While a Kitty's stand-in effect is active (see KittyAsyncEffect),
/// this is what carries its state from the machine that owns it to every other machine, using
/// BlzSendSyncData the way the TS version does: no channel here waits for a round trip except
/// where the game itself must agree on something (death, contact).
///
/// Channels:
///  - Position, ten times a second: everything a receiver needs to place the stand-in effect
///    where the owning machine currently sees the unit,
///  - Death: the moment the owning machine sees the Kitty die, so every machine kills it at the
///    same spot,
///  - Terrain: reserved for a future terrain-driven state change, kept for wire parity with the
///    TS version even though Kitty movement is not slide based today,
///  - Contact: reserved the same way, for a collision only the owning machine noticed first,
///  - Event: reserved for anything that should be shown or called on every machine without
///    deciding anything (god mode effects, etc).
/// </summary>
public static class AsyncKittySync
{
    private const string POSITION_PREFIX = "Aches_POS";
    private const string DEATH_PREFIX = "Aches_DEATH";
    private const string TERRAIN_PREFIX = "Aches_Terrain";
    private const string CONTACT_PREFIX = "Aches_Contact";
    private const string EVENT_PREFIX = "Aches_Event";
    private const char FIELD_SEPARATOR = '|';

    /// <summary>Ten a second: matches AsyncHeroSync.ts POSITION_PERIOD, fine enough for a receiver to interpolate between packets.</summary>
    private const float POSITION_PERIOD = 0.1f;

    private static bool isInitialized = false;
    private static int sequence = 0;
    private static readonly timer PositionTimer = timer.Create();

    private static string Encode(int kittyId, int seq, KittyMovementState movement)
    {
        return string.Join(
            FIELD_SEPARATOR,
            kittyId,
            seq,
            movement.X.ToString("F2"),
            movement.Y.ToString("F2"),
            movement.Facing.ToString("F2"),
            movement.FlyHeight.ToString("F2"),
            movement.TerrainTypeId);
    }

    private static bool TryDecode(string data, out int kittyId, out int seq, out KittyMovementState movement)
    {
        var fields = data.Split(FIELD_SEPARATOR);

        kittyId = 0;
        seq = 0;
        movement = default;

        if (fields.Length < 6) return false;

        kittyId = int.Parse(fields[0]);
        seq = int.Parse(fields[1]);
        movement = new KittyMovementState(
            float.Parse(fields[2]),
            float.Parse(fields[3]),
            float.Parse(fields[4]),
            float.Parse(fields[5]),
            fields.Length > 6 ? int.Parse(fields[6]) : 0);

        return true;
    }

    /// <summary>Registers the sync events and starts the periodic broadcast. Safe to call once at game start.</summary>
    public static void Initialize()
    {
        if (isInitialized) return;
        isInitialized = true;

        RegisterPositionEvent();
        RegisterDeathEvent();

        PositionTimer.Start(POSITION_PERIOD, true, ErrorHandler.Wrap(BroadcastLocalPosition));
    }

    private static void RegisterPositionEvent()
    {
        var trig = trigger.Create();
        foreach (var player in Globals.ALL_PLAYERS)
        {
            trig.RegisterPlayerSyncEvent(player, POSITION_PREFIX, false);
        }

        trig.AddAction(() =>
        {
            var data = BlzGetTriggerSyncData();

            if (!TryDecode(data, out var kittyId, out var seq, out var movement)) return;

            FindKittyById(kittyId)?.AsyncEffect?.ApplyPosition(seq, movement);
        });
    }

    private static void RegisterDeathEvent()
    {
        var trig = trigger.Create();
        foreach (var player in Globals.ALL_PLAYERS)
        {
            trig.RegisterPlayerSyncEvent(player, DEATH_PREFIX, false);
        }

        trig.AddAction(() =>
        {
            var data = BlzGetTriggerSyncData();

            if (!TryDecode(data, out var kittyId, out var seq, out var movement)) return;

            FindKittyById(kittyId)?.AsyncEffect?.ApplyDeath(seq, movement);
        });
    }

    /// <summary>Kitty ids are stable player ids, unlike list positions which shift as Kitties are disposed.</summary>
    private static Kitty FindKittyById(int kittyId)
    {
        foreach (var kitty in Globals.ALL_KITTIES_LIST)
        {
            if (kitty.AsyncEffect?.KittyId == kittyId) return kitty;
        }

        return null;
    }

    /// <summary>Sends the state of every locally-owned Kitty currently standing in as an effect.</summary>
    private static void BroadcastLocalPosition()
    {
        var localPlayer = GetLocalPlayer();

        foreach (var kitty in Globals.ALL_KITTIES_LIST)
        {
            if (kitty.Player != localPlayer) continue;
            if (kitty.AsyncEffect == null || !kitty.AsyncEffect.IsActive) continue;

            sequence++;

            BlzSendSyncData(POSITION_PREFIX, Encode(kitty.AsyncEffect.KittyId, sequence, kitty.AsyncEffect.GetLocalMovementState()));
        }
    }

    /// <summary>Only the owning machine calls this: it is the only one knowing where its Kitty really stopped.</summary>
    public static void SendDeath(int kittyId, KittyMovementState movement)
    {
        sequence++;

        BlzSendSyncData(DEATH_PREFIX, Encode(kittyId, sequence, movement));
    }

    /// <summary>
    /// Reserved for a future terrain-driven hand-back, mirroring sendAsyncTerrainChange in
    /// AsyncHeroSync.ts. Not yet called by any gameplay system: Kitty movement is order driven,
    /// not slide driven, so there is no terrain hand-off moment today. Kept for wire parity.
    /// </summary>
    public static void SendTerrainChange(int kittyId, KittyMovementState movement)
    {
        sequence++;

        BlzSendSyncData(TERRAIN_PREFIX, Encode(kittyId, sequence, movement));
    }

    /// <summary>
    /// Reserved for a future contact channel, mirroring sendAsyncContact in AsyncHeroSync.ts.
    /// Not yet called by CollisionDetection: kept for wire parity until collision is ported to
    /// read from the stand-in effect instead of the unit.
    /// </summary>
    public static void SendContact(int kittyId, int contactKindId, int contactTargetId)
    {
        BlzSendSyncData(
            CONTACT_PREFIX,
            string.Join(FIELD_SEPARATOR, kittyId, contactKindId, contactTargetId));
    }

    /// <summary>
    /// Reserved for anything that should be shown or called on every machine without deciding
    /// anything, mirroring sendAsyncHeroEvent in AsyncHeroSync.ts. Not yet consumed.
    /// </summary>
    public static void SendEvent(int kittyId, int eventId, float x, float y)
    {
        BlzSendSyncData(
            EVENT_PREFIX,
            string.Join(FIELD_SEPARATOR, kittyId, eventId, x.ToString("F2"), y.ToString("F2")));
    }
}
