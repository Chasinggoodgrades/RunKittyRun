using System;
using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class UnitOrders
{
    private static Dictionary<player, int> ActionsPerMinute = new Dictionary<player, int>();
    private static Dictionary<unit, (float, float)> LastOrderLocation = new Dictionary<unit, (float, float)>();
    private static trigger ActionsCapture = trigger.Create();

    public static void Initialize()
    {
        RegisterDicts();
        RegisterTriggers();
    }

    private static void RegisterTriggers()
    {
        foreach (var player in Globals.ALL_KITTIES.Values)
            ActionsCapture.RegisterUnitEvent(player.Unit, unitevent.IssuedPointOrder, null);
        ActionsCapture.AddAction(CaptureActions);
    }

    private static void RegisterDicts()
    {
        foreach (var kitty in Globals.ALL_KITTIES.Values)
        {
            ActionsPerMinute[kitty.Player] = 0;
            LastOrderLocation[kitty.Unit] = (0.0f, 0.0f);
        }
    }

    private static void CaptureActions()
    {
        var x = @event.OrderPointX;
        var y = @event.OrderPointY;
        var unit = @event.OrderedUnit;

        var orderId = @event.IssuedOrderId;
        if (orderId == OrderId("move") || orderId == OrderId("smart"))
        {
            LastOrderLocation[unit] = (x, y);
            Console.WriteLine($"Captured Loc, {x}, {y}");
        }
    }

    public static (float x, float y) GetLastOrderLocation(unit unit)
    {
        if (unit == null)
        {
            Console.WriteLine("Unit is null.");
            return (0.0f, 0.0f);
        }

        if (!LastOrderLocation.ContainsKey(unit))
        {
            Console.WriteLine("Unit not found in LastOrderLocation.");
            return (0.0f, 0.0f);
        }

        return LastOrderLocation[unit];
    }

}
