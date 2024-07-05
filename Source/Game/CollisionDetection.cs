using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Drawing;
using WCSharp.Api;
using WCSharp.Events;
using WCSharp.Shared;
using WCSharp.Shared.Data;
using WCSharp.Sync;
using static WCSharp.Api.Common;


public static class CollisionDetection
{
    private const float WOLF_COLLISION_RADIUS = 75.0f;
    private const float CIRCLE_COLLISION_RADIUS = 77.0f;

    private static Func<bool> WolfCollisionFilter(Kitty k)
    {
        return () => (GetUnitTypeId(GetFilterUnit()) == Constants.UNIT_CUSTOM_DOG);
    }

    private static Func<bool> CircleCollisionFilter(Kitty k)
    {
        return () =>
        {
            return (GetUnitTypeId(GetFilterUnit()) == Constants.UNIT_KITTY_CIRCLE
                    && GetOwningPlayer(GetFilterUnit()) != k.Player) && k.Alive
                    && Globals.ALL_KITTIES[GetOwningPlayer(GetFilterUnit())].TeamID == Globals.ALL_KITTIES[k.Player].TeamID
                    && Gamemode.CurrentGameMode != Globals.GAME_MODES[1];
        };
    }

    public static void KittyRegisterCollisions(Kitty k)
    {
        UnitWithinRange.RegisterUnitWithinRangeTrigger(k.Unit, WOLF_COLLISION_RADIUS, WolfCollisionFilter(k), WolfCollisionTrigger(k));
        UnitWithinRange.RegisterUnitWithinRangeTrigger(k.Unit, CIRCLE_COLLISION_RADIUS, CircleCollisionFilter(k), CircleCollisionTrigger(k));
    }

    private static trigger WolfCollisionTrigger(Kitty k)
    {
        TriggerAddAction(k.w_Collision, () =>
        {
            k.KillKitty();
        });
        return k.w_Collision;
    }

    private static trigger CircleCollisionTrigger(Kitty k)
    {
        TriggerAddAction(k.c_Collision, () =>
        {
            var circle = Globals.ALL_KITTIES[GetOwningPlayer(GetFilterUnit())];
            circle.ReviveKitty(k);
        });
        return k.c_Collision;
    }
}
