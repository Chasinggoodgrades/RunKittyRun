using System;

/// <summary>
/// Run-time tunables of the async effect, set from the -asynctune command to try values in game.
/// Each one is defined on its own line in the static constructor: constant, command name, default,
/// and what it does. Code reads them by the constant (AsyncTuning.Get(AsyncTuning.TURN_RATE)).
/// They only change what is drawn (and how the owner's own effect leashes), so they are safe to
/// change mid-game.
/// </summary>
public static class AsyncTuning
{
    // ------------------------------------------------------------------ indices (the order of the -asynctune list)
    public const int MAX_LEAD = 0;
    public const int SNAP_DISTANCE = 1;
    public const int CATCH_UP_FACTOR = 2;
    public const int ARRIVE_EPSILON = 3;
    public const int TURN_RATE = 4;
    public const int FALLBACK_TURN = 5;
    public const int PROPULSION = 6;
    public const int SETTLE_TURN_DISTANCE = 7;
    public const int STILL_TIME = 8;
    public const int LOCAL_TIMEOUT = 9;
    public const int ORDER_AGREE = 10;
    public const int CONTACT_HOLD = 11;
    public const int PACKET_SILENCE = 12;
    public const int PACKET_SNAP = 13;
    public const int BLOCKED = 14;
    public const int GLIDE = 15;
    public const int OVERHEAD = 16;
    public const int HEAD = 17;
    public const int CHEST = 18;
    public const int HAND = 19;
    public const int POSITION_PERIOD = 20;
    public const int CLICK_REFRESH = 21;
    public const int TICK_PERIOD = 22;
    public const int LEAD_TIME = 23;
    public const int REPLICA_LAG = 24;
    public const int CORRECTION = 25;
    public const int HOLD_INTERVAL = 26;
    public const int HOLD_DISTANCE = 27;
    public const int SETTLE_DELAY = 28;
    public const int SETTLE_TOLERANCE = 29;
    public const int WALK_ANIM = 30;

    private const int COUNT = 31;

    private static readonly string[] Names = new string[COUNT];
    private static readonly float[] Defaults = new float[COUNT];
    private static readonly float[] Values = new float[COUNT];

    static AsyncTuning()
    {
        //      constant               command name     default   group: what it does
        Define(MAX_LEAD,              "maxlead",            150f); // Leash to the unit: farthest the effect may run ahead of the unit
        Define(SNAP_DISTANCE,         "snap",               900f); // Leash to the unit: farther than this from the unit and the effect snaps back to it (teleport, revive)
        Define(CATCH_UP_FACTOR,       "catchup",            1.5f); // Leash to the unit: how much faster than move speed it catches up with the unit
        Define(ARRIVE_EPSILON,        "arrive",               2f); // Leash to the unit: this close to a target counts as arrived
        Define(TURN_RATE,             "turnrate",           100f); // Turning: degrees per second per point of the unit's turn rate
        Define(FALLBACK_TURN,         "fallbackturn",       360f); // Turning: degrees per second when the unit's turn rate cannot be read
        Define(PROPULSION,            "propulsion",         360f); // Turning: degrees off the heading it may be and still move (360 = always moves)
        Define(SETTLE_TURN_DISTANCE,  "settle",              20f); // Turning: settling on the unit over less than this does not turn the effect
        Define(STILL_TIME,            "stilltime",          0.5f); // Orders: a confirmed run whose unit has not moved this long (seconds) is over
        Define(LOCAL_TIMEOUT,         "localtimeout",       0.9f); // Orders: an unconfirmed local click is dropped after this many seconds
        Define(ORDER_AGREE,           "orderagree",         150f); // Orders: a move order this close to the local click confirms it
        Define(CONTACT_HOLD,          "contacthold",          1f); // Orders: seconds it stands still after a touch, waiting for the network
        Define(PACKET_SILENCE,        "packetsilence",      0.5f); // Other players' view: seconds without a packet before the owner counts as quiet
        Define(PACKET_SNAP,           "packetsnap",          60f); // Other players' view: a packet this far (x3) from the shown effect replaces its position
        Define(BLOCKED,               "blocked",           0.12f); // Obstacles: seconds blocked before it goes where the unit went
        Define(GLIDE,                 "glide",              2.5f); // Leash to the unit: per second, how fast it glides back to a unit that got ahead
        Define(OVERHEAD,              "overhead",            90f); // Attachment heights: height of the 'overhead' attachment point
        Define(HEAD,                  "head",                70f); // Attachment heights: height of the 'head' attachment point
        Define(CHEST,                 "chest",               45f); // Attachment heights: height of the 'chest' attachment point
        Define(HAND,                  "hand",                35f); // Attachment heights: height of the 'hand' attachment point
        Define(POSITION_PERIOD,       "positionperiod",    0.05f); // Timing: seconds between position packets
        Define(CLICK_REFRESH,         "clickrefresh",      0.02f); // Timing: seconds between cursor reads while the button is held
        Define(TICK_PERIOD,           "tickperiod",        0.01f); // Timing: seconds between movement ticks
        Define(LEAD_TIME,             "leadtime",           0.7f); // Leash to the unit: seconds of lead allowed before the effect eases off
        Define(REPLICA_LAG,           "replicalag",        0.08f); // Other players' view: seconds a packet is already old when it arrives
        Define(CORRECTION,            "correction",           8f); // Other players' view: per second, how fast an observer's effect takes up a packet's error
        Define(HOLD_INTERVAL,         "holdinterval",       0.5f); // Orders: seconds between orders to the unit while the button is held (0 = never)
        Define(HOLD_DISTANCE,         "holddistance",       100f); // Orders: cursor must move this far before the held button sends another order
        Define(SETTLE_DELAY,          "settledelay",       0.35f); // Leash to the unit: seconds the unit stands still before the last units are eased on
        Define(SETTLE_TOLERANCE,      "settletolerance",     50f); // Leash to the unit: a stopped effect this close to the unit is left alone
        Define(WALK_ANIM,             "walkanim",           350f); // Animation: move speed at which the walk animation plays at normal speed (faster running plays it faster; 0 = always normal)
    }

    private static void Define(int index, string name, float defaultValue)
    {
        Names[index] = name;
        Defaults[index] = defaultValue;
        Values[index] = defaultValue;
    }

    public static int Count => COUNT;
    public static string NameAt(int index) => Names[index];
    public static float Get(int index) => Values[index];
    public static float DefaultAt(int index) => Defaults[index];

    public static int IndexOf(string name)
    {
        for (int i = 0; i < COUNT; i++)
        {
            if (Names[i] == name) return i;
        }

        return -1;
    }

    public static void Set(int index, float value)
    {
        Values[index] = value;
    }

    public static void ResetAll()
    {
        for (int i = 0; i < COUNT; i++) Values[i] = Defaults[i];
    }
}
