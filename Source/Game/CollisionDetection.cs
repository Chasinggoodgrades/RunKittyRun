using System;
using System.Collections.Generic;
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

    private static bool WolfCollisionFilter()
    {
        if (GetUnitTypeId(GetFilterUnit()) != Constants.UNIT_KITTY)
            return false;
        return true;
    }

    private static bool CircleCollisionFilter()
    {
        if (GetUnitTypeId(GetFilterUnit()) != Constants.UNIT_KITTY)
            return false;
        // if unit not on same team return false as well
        return true;
    }

    public static void WolfCollision(Wolf wolf)
    {
        TriggerRegisterTimerEvent(wolf.Collision, 0.10f, true);
        TriggerAddAction(wolf.Collision, () =>
        {
            var g = CreateGroup();
            GroupEnumUnitsInRange(g, GetUnitX(wolf.Unit), GetUnitY(wolf.Unit), WOLF_COLLISION_RADIUS,
                Filter(() => WolfCollisionFilter() && Globals.ALL_KITTIES[GetOwningPlayer(GetFilterUnit())].Alive));
            while (FirstOfGroup(g) != null)
            {
                var kitty = Globals.ALL_KITTIES[GetOwningPlayer(FirstOfGroup(g))];
                kitty.KillKitty();
                GroupRemoveUnit(g, FirstOfGroup(g));
            }
            DestroyGroup(g);
            g.Dispose();
        });
    }

    public static void CircleCollision(Circle circle)
    {
        TriggerRegisterUnitInRange(circle.Collision, circle.Unit, CIRCLE_COLLISION_RADIUS, Filter(() => CircleCollisionFilter()));
        TriggerAddCondition(circle.Collision, Condition(() => !Globals.ALL_KITTIES[circle.Player].Alive && circle.Player != GetOwningPlayer(GetFilterUnit())));
        TriggerAddAction(circle.Collision, () =>
        {
            var savior = Globals.ALL_KITTIES[GetOwningPlayer(GetFilterUnit())];
            var circleKitty = Globals.ALL_KITTIES[circle.Player];

            circleKitty.ReviveKitty(savior);
        });
    }
}
