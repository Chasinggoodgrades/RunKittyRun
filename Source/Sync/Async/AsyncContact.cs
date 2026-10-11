using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

/// <summary>
/// Contact between a Kitty's stand-in effect and what it can touch, decided on the machine that
/// owns the effect: the only one that knows where the effect really is. Port of the CONTACT idea
/// of AsyncHeroSync.ts / ContactCheck.ts.
///
/// Wolves and revive circles are units, so their positions are the same on every machine; only the
/// effect is local. The owning machine reads the units around its effect (no handle is made: one
/// group and one filter exist since the game started) and, on a touch, tells everyone through the
/// contact packet (see AsyncKittySync). What follows - the death, the revive - is the game's own
/// CollisionDetection.HandleWolfContact / HandleCircleContact, run on every machine on the same turn.
/// </summary>
public static class AsyncContact
{
    public const int KIND_WOLF = 0;
    public const int KIND_CIRCLE = 1;

    private static group scratch;
    private static boolexpr collector;
    private static readonly List<unit> found = new List<unit>();

    /// <summary>Creates the group and the filter. Call once at game start, on every machine alike: they are handles.</summary>
    public static void Initialize()
    {
        if (scratch != null) return;

        scratch = CreateGroup();
        collector = Condition(() =>
        {
            var candidate = GetFilterUnit();
            int type = GetUnitTypeId(candidate);

            if (type == Constants.UNIT_CUSTOM_DOG || type == Constants.UNIT_KITTY_CIRCLE)
            {
                found.Add(candidate);
            }

            // nothing is ever added to the group: the filter is only a way to walk the units in range
            return false;
        });
    }

    /// <summary>
    /// What the Kitty touches at that point, if anything. Same filters as the unit triggers in
    /// CollisionDetection, so the effect is held to exactly the rules the unit was.
    /// </summary>
    public static bool TryDetect(Kitty k, float x, float y, out int kind, out int id)
    {
        kind = 0;
        id = 0;

        if (scratch == null || !k.Alive || !k.Unit.Alive) return false;

        float wolfRadius = k.CurrentStats.CollisonRadius;
        float circleRadius = CollisionDetection.CIRCLE_COLLISION_RADIUS;
        float range = wolfRadius > circleRadius ? wolfRadius : circleRadius;

        found.Clear();
        GroupEnumUnitsInRange(scratch, x, y, range, collector);

        for (int i = 0; i < found.Count; i++)
        {
            var candidate = found[i];
            float dx = candidate.X - x;
            float dy = candidate.Y - y;
            float distanceSquared = dx * dx + dy * dy;

            if (GetUnitTypeId(candidate) == Constants.UNIT_CUSTOM_DOG)
            {
                if (k.Invulnerable) continue;
                if (distanceSquared > wolfRadius * wolfRadius) continue;
                if (!candidate.Alive) continue;
                if (!Globals.ALL_WOLVES.TryGetValue(candidate, out var wolf)) continue;
                if (wolf.IsReviving) continue;

                kind = KIND_WOLF;
                id = wolf.Id;
                return true;
            }

            // a revive circle
            if (Gamemode.CurrentGameMode == GameMode.Solo) continue;
            if (distanceSquared > circleRadius * circleRadius) continue;
            if (candidate.Owner == k.Player) continue;
            if (!Globals.ALL_KITTIES.TryGetValue(candidate.Owner, out var circleKitty)) continue;
            if (circleKitty.TeamID != k.TeamID) continue;

            kind = KIND_CIRCLE;
            id = candidate.Owner.Id;
            return true;
        }

        return false;
    }
}
