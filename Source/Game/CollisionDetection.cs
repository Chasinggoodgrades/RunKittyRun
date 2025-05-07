using System;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class CollisionDetection
{
    public const float DEFAULT_WOLF_COLLISION_RADIUS = 74.0f;
    private const float CIRCLE_COLLISION_RADIUS = 77.0f;

    private static Predicate<Relic> IsBeaconOfUnitedLifeforce = r => r is BeaconOfUnitedLifeforce;

    private static Func<bool> WolfCollisionFilter(Kitty k)
    {
        return () =>
        {
            return (GetFilterUnit().UnitType == Constants.UNIT_CUSTOM_DOG)
                    && k.Alive && GetFilterUnit().Alive; // wolf should be alive too (exploding / stan wolf)
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
            return GetUnitTypeId(GetFilterUnit()) == Constants.UNIT_KITTY_CIRCLE
                    && GetFilterUnit().Owner != sk.Player // Not Same Player
                    && sk.Unit.Alive; // Has to Be Alive
        };
    }

    private static Func<bool> CircleCollisionFilter(Kitty k)
    {
        return () =>
        {
            return GetFilterUnit().UnitType == Constants.UNIT_KITTY_CIRCLE
                    && GetFilterUnit().Owner != k.Player // Not Same Player
                    && k.Alive // Has to Be Alive
                    && Globals.ALL_KITTIES[GetFilterUnit().Owner].TeamID == Globals.ALL_KITTIES[k.Player].TeamID // Must be same team
                    && Gamemode.CurrentGameMode != Globals.GAME_MODES[1]; // Not Solo Mode
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
        sk.wCollision ??= CreateTrigger();
        sk.cCollision ??= CreateTrigger();

        UnitWithinRange.RegisterUnitWithinRangeTrigger(sk.Unit, DEFAULT_WOLF_COLLISION_RADIUS, ShadowRelicWolvesFilter(sk), WolfCollisionShadowTrigger(sk));
        UnitWithinRange.RegisterUnitWithinRangeTrigger(sk.Unit, CIRCLE_COLLISION_RADIUS, ShadowRelicCircleFilter(sk), CircleCollisionShadowTrigger(sk));
    }

    private static trigger WolfCollisionTrigger(Kitty k)
    {
        TriggerAddAction(k.w_Collision, () =>
        {
            try
            {
                if (!k.Unit.Alive) return;
                if (NamedWolves.ExplodingWolfCollision(GetFilterUnit(), k)) return;
                if (Globals.ALL_WOLVES[GetFilterUnit()].IsReviving) return; // bomber wolf
                if (ChronoSphere.RewindDeath(k)) return;
                if (k.Invulnerable) return;
                OneOfNine.OneOfNineEffect(k);
                k.KillKitty();
                TeamsUtil.CheckTeamDead(k);
            }
            catch (Exception e)
            {
                Logger.Warning($"WolfCollisionTrigger Error: {e.Message}");
                throw;
            }
        });
        return k.w_Collision;
    }

    private static trigger CircleCollisionTrigger(Kitty k)
    {
        TriggerAddAction(k.c_Collision, () =>
        {
            try
            {
                var circle = Globals.ALL_KITTIES[GetFilterUnit().Owner];
                circle.ReviveKitty(k);
                (k.Relics.Find(IsBeaconOfUnitedLifeforce) as BeaconOfUnitedLifeforce)?.BeaconOfUnitedLifeforceEffect(k.Player);
            }
            catch (Exception e)
            {
                Logger.Warning($"CircleCollisionTrigger Error: {e.Message}");
                throw;
            }
        });
        return k.c_Collision;
    }

    private static trigger WolfCollisionShadowTrigger(ShadowKitty sk)
    {
        TriggerAddAction(sk.wCollision, sk.KillShadowKitty);
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
