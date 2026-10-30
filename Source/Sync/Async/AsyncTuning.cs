using System;

/// <summary>
/// Run-time tunables of the async effect, set from the -asynctune command to try values in game.
/// Index order matches the table below; KittyAsyncEffect reads them every tick. They only change what
/// is drawn (and how the owner's own effect leashes), so they are safe to change mid-game.
/// </summary>
public static class AsyncTuning
{
    private static readonly string[] Names =
    {
        "maxlead",
        "snap",
        "catchup",
        "arrive",
        "turnrate",
        "fallbackturn",
        "propulsion",
        "settle",
        "stilltime",
        "localtimeout",
        "orderagree",
        "contacthold",
        "packetsilence",
        "packetsnap",
        "blocked",
        "glide",
        "overhead",
        "head",
        "chest",
        "hand",
        "positionperiod",
        "clickrefresh",
        "tickperiod",
        "leadtime",
        "replicalag",
        "correction",
        "holdinterval",
        "holddistance",
        "settledelay",
        "settletolerance"
    };

    private static readonly float[] Defaults = { 150f, 900f, 1.5f, 2f, 600f, 360f, 60f, 20f, 0.5f, 0.9f, 150f, 1f, 0.5f, 60f, 0.12f, 2.5f, 90f, 70f, 45f, 35f, 0.05f, 0.02f, 0.01f, 0.7f, 0.08f, 8f, 0.5f, 100f, 0.35f, 50f };

    private static readonly float[] Values = (float[])Defaults.Clone();

    public static int Count => Names.Length;
    public static string NameAt(int index) => Names[index];
    public static float Get(int index) => Values[index];
    public static float DefaultAt(int index) => Defaults[index];

    public static int IndexOf(string name)
    {
        for (int i = 0; i < Names.Length; i++)
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
        for (int i = 0; i < Values.Length; i++) Values[i] = Defaults[i];
    }
}
