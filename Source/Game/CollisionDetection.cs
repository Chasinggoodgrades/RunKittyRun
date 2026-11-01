using System;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class CollisionDetection
{
    public const float DEFAULT_WOLF_COLLISION_RADIUS = 73.5f;
    public const float CIRCLE_COLLISION_RADIUS = 79.0f;

    private static Predicate<Relic> IsBeaconOfUnitedLifeforce = r => r is BeaconOfUnitedLifeforce;

    private static Func<bool> WolfCollisionFilter(Kitty k)
    {
        return () =>
        {
            if (!k.Alive) return false;
            var filterUnit = GetFilterUnit();
            return filterUnit.UnitType == Constants.UNIT_CUSTOM_DOG && filterUnit.Alive;
        };
    }

    private static Func<bool> ShadowRelicWolvesFilter(ShadowKitty sk)
    {
        return () =>
        {
            return (GetUnitTypeId(GetFilterUnit()) == Constants.UNIT_CUSTOM_DOG)
                    && sk.Unit.Alive;
        };
    }

    private static Func<bool> ShadowRelicCircleFilter(ShadowKitty sk)
    {
        return () =>
        {
            var filterUnit = GetFilterUnit();
            return GetUnitTypeId(filterUnit) == Constants.UNIT_KITTY_CIRCLE
                    && filterUnit.Owner != sk.Player // Not Same Player
                    && sk.Unit.Alive // Has to Be Alive
                    && Globals.ALL_KITTIES[filterUnit.Owner].TeamID == Globals.ALL_KITTIES[sk.Player].TeamID; // Must be same team

        };
    }

    private static Func<bool> CircleCollisionFilter(Kitty k)
    {

        return () =>
        {
            var kTeamID = k.TeamID;
            var kPlayer = k.Player;
            if (Gamemode.CurrentGameMode == GameMode.Solo) return false;
            if (!k.Alive) return false;
            var filterUnit = GetFilterUnit();
            if (filterUnit.UnitType != Constants.UNIT_KITTY_CIRCLE) return false;

            if (filterUnit.Owner == kPlayer) return false; // Not Same Player

            var filterTeamId = Globals.ALL_KITTIES[filterUnit.Owner].TeamID;
            return filterTeamId == kTeamID;
        };
    }

    public static void KittyRegisterCollisions(Kitty k)
    {
        var WOLF_COLL_RADIUS = k.CurrentStats.CollisonRadius;
        k.w_Collision ??= CreateTrigger();
        k.c_Collision ??= CreateTrigger();

        UnitWithinRange.RegisterUnitWithinRangeTrigger(k.Unit, WOLF_COLL_RADIUS, WolfCollisionFilter(k), WolfCollisionTrigger(k));
        UnitWithinRange.RegisterUnitWithinRangeTrigger(k.Unit, CIRCLE_COLLISION_RADIUS, CircleCollisionFilter(k), CircleCollisionTrigger(k));
    }

    public static void ShadowKittyRegisterCollision(ShadowKitty sk)
    {
        var WOLF_COLL_RADIUS = sk.Kitty.CurrentStats.CollisonRadius;
        sk.wCollision ??= CreateTrigger();
        sk.cCollision ??= CreateTrigger();

        UnitWithinRange.RegisterUnitWithinRangeTrigger(sk.Unit, WOLF_COLL_RADIUS, ShadowRelicWolvesFilter(sk), WolfCollisionShadowTrigger(sk));
        UnitWithinRange.RegisterUnitWithinRangeTrigger(sk.Unit, CIRCLE_COLLISION_RADIUS, ShadowRelicCircleFilter(sk), CircleCollisionShadowTrigger(sk));
    }

    private static trigger WolfCollisionTrigger(Kitty k)
    {
        TriggerAddAction(k.w_Collision, () =>
        {
            // While the stand-in effect stands in, contact is decided from the effect (see AsyncContact), not from the unit.
            if (k.AsyncEffect != null && k.AsyncEffect.IsActive) return;

            HandleWolfContact(k, GetFilterUnit());
        });
        return k.w_Collision;
    }

    /// <summary>
    /// A Kitty touched a wolf. Shared by the unit's range trigger and by the async contact packet
    /// (see AsyncContact), so a Kitty dies by the very same rules whichever of them caught it.
    /// Always runs on every machine at once.
    /// </summary>
    public static void HandleWolfContact(Kitty k, unit filterUnit)
    {
        try
        {
            if (!k.Unit.Alive) return;
            if (k.Invulnerable) return; // proc before rewind and logic wise

            if (!Globals.ALL_WOLVES.TryGetValue(filterUnit, out var wolf)) return;
            if (wolf.IsReviving) return; // bomber wolf
            if (NamedWolves.ExplodingWolfCollision(filterUnit, k)) return;
            if (ChronoSphere.RewindDeath(k)) return;
            OneOfNine.OneOfNineEffect(k);
            k.KillKitty();
        }
        catch (Exception e)
        {
            Logger.Warning($"WolfCollisionTrigger Error: {e.Message}");
            throw;
        }
    }

    private static trigger CircleCollisionTrigger(Kitty k)
    {
        TriggerAddAction(k.c_Collision, () =>
        {
            if (k.AsyncEffect != null && k.AsyncEffect.IsActive) return;

            HandleCircleContact(k, GetFilterUnit());
        });
        return k.c_Collision;
    }

    /// <summary>A Kitty touched the revive circle of a teammate. Shared with the async contact packet, like HandleWolfContact.</summary>
    public static void HandleCircleContact(Kitty k, unit circleUnit)
    {
        try
        {
            var circle = Globals.ALL_KITTIES[circleUnit.Owner];
            circle.ReviveKitty(k);
            (k.Relics.Find(IsBeaconOfUnitedLifeforce) as BeaconOfUnitedLifeforce)?.BeaconOfUnitedLifeforceEffect(k.Player);
        }
        catch (Exception e)
        {
            Logger.Warning($"CircleCollisionTrigger Error: {e.Message}");
            throw;
        }
    }

    private static trigger WolfCollisionShadowTrigger(ShadowKitty sk)
    {
        TriggerAddAction(sk.wCollision, () =>
        {
            if (NamedWolves.ExplodingWolfCollision(GetFilterUnit(), sk.Kitty, true)) return; // Floating text will appear on kitty instead of SK tho.
            sk.KillShadowKitty();
        });
        return sk.wCollision;
    }

    private static trigger CircleCollisionShadowTrigger(ShadowKitty sk)
    {
        TriggerAddAction(sk.cCollision, () =>
        {
            try
            {
                var circle = Globals.ALL_KITTIES[GetOwningPlayer(GetFilterUnit())];
                var saviorKitty = Globals.ALL_KITTIES[sk.Player];
                circle.ReviveKitty(saviorKitty);
            }
            catch (Exception e)
            {
                Logger.Warning($"CircleCollisionShadowTrigger Error: {e.Message}");
                throw;
            }
        });
        return sk.cCollision;
    }
}
