using System;
using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class UnitOrders
{
    private static Dictionary<player, int> TotalActions = new Dictionary<player, int>();
    private static Dictionary<unit, (float, float)> LastOrderLocation = new Dictionary<unit, (float, float)>();
    private static Dictionary<player, float> TimeOutsideSafeZones = new Dictionary<player, float>();
    private static trigger ActionsCapture = trigger.Create();
    private static timer PeriodicTimer = CreateTimer();

    public static void Initialize()
    {
        RegisterDicts();
        RegisterTriggers();
        StartPeriodicCheck();
    }

    private static void RegisterTriggers()
    {
        foreach (var player in Globals.ALL_KITTIES.Values)
        {
            ActionsCapture.RegisterUnitEvent(player.Unit, unitevent.IssuedPointOrder, null);
        }

        ActionsCapture.AddAction(CaptureActions);
    }

    private static void RegisterDicts()
    {
        foreach (var kitty in Globals.ALL_KITTIES.Values)
        {
            TotalActions[kitty.Player] = 0;
            LastOrderLocation[kitty.Unit] = (0.0f, 0.0f);
            TimeOutsideSafeZones[kitty.Player] = 0.0f;
        }
    }

    private static void StartPeriodicCheck()
    {
        TimerStart(PeriodicTimer, 1.0f, true, CheckKittyPositions);
    }

    private static void CheckKittyPositions()
    {
        foreach (var kitty in Globals.ALL_KITTIES.Values)
        {
            var unit = kitty.Unit;
            var player = kitty.Player;
            if (!IsInSafeZone(unit))
            {
                TimeOutsideSafeZones[player] += 1.0f;
            }
        }
    }

    private static bool IsInSafeZone(unit unit)
    {
        foreach (var safeZone in RegionList.SafeZones)
        {
            if (IsUnitInRegion(safeZone.Region, unit))
            {
                return true;
            }
        }
        return false;
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
        }

        if (IsInSafeZone(unit))
        {
            return;
        }

        var player = GetOwningPlayer(unit);
        if (TotalActions.ContainsKey(player))
        {
            TotalActions[player]++;
        }
    }

    public static float CalculateAPM(player player)
    {
        if (!TotalActions.ContainsKey(player))
        {
            Logger.Warning($"Player {player} not found in TotalActions.");
            return 0.0f;
        }

        var totalActions = TotalActions[player];
        var timeOutsideSafeZones = TimeOutsideSafeZones[player] / 60.0f; // put in mins (APM)
        if (timeOutsideSafeZones == 0.0f) return 0.0f;
        return totalActions / timeOutsideSafeZones;
    }

    public static string CalculateAllAPM()
    {
        string apmString = "";
        foreach (var player in Globals.ALL_PLAYERS)
        {
            var apm = CalculateAPM(player);
            apmString += $"{Colors.PlayerNameColored(player)}:  {(int)apm} Active APM\n"; 
        }
        return apmString;
    }

    public static (float x, float y) GetLastOrderLocation(unit unit)
    {
        if (unit == null)
        {
            Logger.Warning("Unit is null in GetLastOrderLocation.");
            return (0.0f, 0.0f);
        }

        if (!LastOrderLocation.ContainsKey(unit))
        {
            Logger.Warning($"Unit {unit} not found in LastOrderLocation.");
            return (0.0f, 0.0f);
        }

        return LastOrderLocation[unit];
    }
}
