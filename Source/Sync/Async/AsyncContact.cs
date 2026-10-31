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

    private static readonly List<int> scanKeys = new List<int>();

    /// <summary>
    /// What the Kitty has just started touching at that point, if anything. Like the unit triggers
    /// in CollisionDetection (an "enters range" event), only a NEW touch counts: what the Kitty
    /// already overlapped stays harmless until it has left and come back. <paramref name="touching"/>
    /// is that memory, one per Kitty.
    /// </summary>
    public static bool TryDetect(Kitty k, float x, float y, HashSet<int> touching, out int kind, out int id)
    {
        kind = 0;
        id = 0;

        if (scratch == null || !k.Alive || !k.Unit.Alive) return false;

        return Scan(k, x, y, touching, false, out kind, out id);
    }

    /// <summary>
    /// Remembers what the Kitty overlaps right now without reacting to it: called when the effect
    /// appears (a revive), which gives the grace the unit had of surviving a wolf it was revived on.
    /// </summary>
    public static void Seed(Kitty k, float x, float y, HashSet<int> touching)
    {
        touching.Clear();

        if (scratch == null) return;

        Scan(k, x, y, touching, true, out _, out _);
    }

    private static bool Scan(Kitty k, float x, float y, HashSet<int> touching, bool seedOnly, out int kind, out int id)
    {
        kind = 0;
        id = 0;

        bool hit = false;
        float wolfRadius = k.CurrentStats.CollisonRadius;
        float circleRadius = CollisionDetection.CIRCLE_COLLISION_RADIUS;
        float range = wolfRadius > circleRadius ? wolfRadius : circleRadius;

        found.Clear();
        scanKeys.Clear();
        GroupEnumUnitsInRange(scratch, x, y, range, collector);

        for (int i = 0; i < found.Count; i++)
        {
            var candidate = found[i];
            float dx = candidate.X - x;
            float dy = candidate.Y - y;
            float distanceSquared = dx * dx + dy * dy;

            if (GetUnitTypeId(candidate) == Constants.UNIT_CUSTOM_DOG)
            {
                if (distanceSquared > wolfRadius * wolfRadius) continue;
                if (!candidate.Alive) continue;
                var wolf = Wolf.FromUnit(candidate);
                if (wolf == null) continue;

                // overlapping counts as "touching" even when it cannot hurt right now (invulnerable,
                // wolf reviving): it must not become a surprise touch the moment that ends
                int key = wolf.Id * 2;
                scanKeys.Add(key);

                if (hit || seedOnly || k.Invulnerable || wolf.IsReviving || touching.Contains(key)) continue;

                kind = KIND_WOLF;
                id = wolf.Id;
                hit = true;
                continue;
            }

            // a revive circle
            if (Gamemode.CurrentGameMode == GameMode.Solo) continue;
            if (distanceSquared > circleRadius * circleRadius) continue;
            if (candidate.Owner == k.Player) continue;
            var circleKitty = Globals.GetKitty(candidate.Owner);
            if (circleKitty == null) continue;

            // every Kitty has a circle unit; it only means something while its Kitty is dead
            if (circleKitty.Unit.Alive) continue;
            if (circleKitty.TeamID != k.TeamID) continue;

            int circleKey = candidate.Owner.Id * 2 + 1;
            scanKeys.Add(circleKey);

            if (hit || seedOnly || touching.Contains(circleKey)) continue;

            kind = KIND_CIRCLE;
            id = candidate.Owner.Id;
            hit = true;
        }

        touching.Clear();
        for (int i = 0; i < scanKeys.Count; i++) touching.Add(scanKeys[i]);

        return hit;
    }
}
