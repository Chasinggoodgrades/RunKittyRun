using WCSharp.Api;
using static WCSharp.Api.Common;

/// <summary>
/// Region triggers (safezones, the final safezone, wolf areas) driven by the stand-in effect while
/// it stands in for the unit: what the player sees enter a zone is what counts. The owning machine
/// watches its own effect against the zone rectangles and announces each new entry with one packet;
/// every machine then runs the game's own handler for that Kitty on the same turn. The victory line
/// is NOT part of this and stays on the unit.
///
/// While the effect is active the unit's own enter triggers stand aside (see Drives); when it is not
/// (dead, disabled) they work as ever.
/// </summary>
public static class AsyncZones
{
    public const int KIND_SAFEZONE = 0;
    public const int KIND_WOLFAREA = 1;

    /// <summary>True when the effect of this Kitty decides the zones, so the unit's enter triggers skip it.</summary>
    public static bool Drives(Kitty kitty)
    {
        var fx = kitty?.AsyncEffect;
        return fx != null && fx.IsActive;
    }

    /// <summary>
    /// Where floating text for this unit belongs: at the effect while it stands in for the Kitty's
    /// unit (the unit is hidden and a latency behind), at the unit otherwise. Display only.
    /// </summary>
    public static void WhereToDraw(unit u, out float x, out float y)
    {
        x = u.X;
        y = u.Y;

        if (u.UnitType != Constants.UNIT_KITTY) return;
        if (!Globals.ALL_KITTIES.TryGetValue(u.Owner, out var kitty)) return;
        if (kitty.Unit != u) return;

        var fx = kitty.AsyncEffect;
        if (fx == null || !fx.IsActive) return;

        x = fx.X;
        y = fx.Y;
    }

    private static bool Inside(WCSharp.Shared.Data.Rectangle r, float x, float y)
    {
        return x >= r.Left && x <= r.Right && y >= r.Bottom && y <= r.Top;
    }

    /// <summary>Marks the zones the effect already stands in as entered, without announcing them (a revive).</summary>
    public static void Seed(bool[] inside, float x, float y)
    {
        var safe = RegionList.SafeZones;
        for (int i = 0; i < safe.Length; i++) inside[i] = Inside(safe[i], x, y);

        var wolf = RegionList.WolfRegions;
        for (int i = 0; i < wolf.Length; i++) inside[safe.Length + i] = Inside(wolf[i], x, y);
    }

    public static int Count => RegionList.SafeZones.Length + RegionList.WolfRegions.Length;

    /// <summary>
    /// Owner only. Compares where the effect is with where it was; sends one packet per zone newly entered.
    /// </summary>
    public static void Scan(int kittyId, bool[] inside, float x, float y)
    {
        var safe = RegionList.SafeZones;
        for (int i = 0; i < safe.Length; i++)
        {
            bool now = Inside(safe[i], x, y);
            if (now && !inside[i]) AsyncKittySync.SendZone(kittyId, KIND_SAFEZONE, i);
            inside[i] = now;
        }

        var wolf = RegionList.WolfRegions;
        for (int i = 0; i < wolf.Length; i++)
        {
            bool now = Inside(wolf[i], x, y);
            int slot = safe.Length + i;
            if (now && !inside[slot]) AsyncKittySync.SendZone(kittyId, KIND_WOLFAREA, i);
            inside[slot] = now;
        }
    }

    /// <summary>Runs on every machine when the packet arrives.</summary>
    public static void Apply(Kitty kitty, int kind, int index)
    {
        if (kind == KIND_SAFEZONE)
        {
            if (index < 0 || index >= Globals.SAFE_ZONES.Count) return;

            Globals.SAFE_ZONES[index].HandleKittyEntered(kitty);

            if (index == Globals.SAFE_ZONES.Count - 1) FinalSafezone.HandleKittyEntered(kitty);
            if (index == 0) Challenges.DoubleBackingEntered(kitty);
        }
        else if (kind == KIND_WOLFAREA)
        {
            if (index < 0 || index >= WolfArea.WolfAreas_List.Count) return;

            WolfArea.WolfAreas_List[index].HandleKittyEntered(kitty);
        }
    }
}
