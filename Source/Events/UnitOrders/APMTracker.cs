using WCSharp.Api;
using static WCSharp.Api.Common;
using System;

public class APMTracker
{
    private readonly Action _cachedPositions;
    private const float CAPTURE_INTERVAL = 0.1f;
    private trigger ClicksTrigger = CreateTrigger();
    private triggeraction ClicksAction;
    private timer PeriodicTimer;

    private int TotalActions;
    private float TimeOutsideSafeZones;

    // private (float X, float Y) LastPosition;
    private Kitty Kitty { get; set; }

    public APMTracker(Kitty kitty)
    {
        Kitty = kitty;
        _cachedPositions = () => CheckKittyPositions(); // cache the method for periodic timer use
        Init();
    }

    private void Init()
    {
        ClicksTrigger.RegisterUnitEvent(Kitty.Unit, EVENT_UNIT_ISSUED_POINT_ORDER);
        ClicksAction = ClicksTrigger.AddAction(CaptureActions);
        PeriodicTimer = PeriodicCheck();
    }

    private timer PeriodicCheck()
    {
        PeriodicTimer = CreateTimer();
        PeriodicTimer.Start(CAPTURE_INTERVAL, true, _cachedPositions);
        return PeriodicTimer;
    }

    private void CaptureActions()
    {
        if (!IsInSafeZone(Kitty))
            TotalActions += 1;
    }

    private void CheckKittyPositions()
    {
        try
        {
            if (IsInSafeZone(Kitty)) return;
            Kitty.APMTracker.TimeOutsideSafeZones += CAPTURE_INTERVAL;
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in APMTracker.CheckKittyPositions: {e.Message}");
            throw;
        }
    }

    private static bool IsInSafeZone(Kitty kitty)
    {
        return RegionList.SafeZones[kitty.CurrentSafeZone].Contains(kitty.Unit.X, kitty.Unit.Y);
    }

    private static float CalculateAPM(Kitty kitty)
    {
        var totalActions = kitty.APMTracker.TotalActions;
        var timeOutsideSafeZones = kitty.APMTracker.TimeOutsideSafeZones / 60.0f; // put in mins (APM)
        return timeOutsideSafeZones > 0.0f ? totalActions / timeOutsideSafeZones : 0.0f;
    }

    public static string CalculateAllAPM()
    {
        string apmString = "";
        for (int i = 0; i < Globals.ALL_PLAYERS.Count; i++)
        {
            var kitty = Globals.ALL_KITTIES[Globals.ALL_PLAYERS[i]];
            var apm = CalculateAPM(kitty);
            apmString += $"{Colors.PlayerNameColored(kitty.Player)}:  {(int)apm} Active APM\n";
        }
        return apmString;
    }

    public void Dispose()
    {
        PeriodicTimer.Pause();
        PeriodicTimer?.Dispose();
        ClicksTrigger.RemoveAction(ClicksAction);
        ClicksTrigger.Dispose();
    }

    /*    public static (float x, float y) GetLastOrderLocation(unit unit)
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
        }*/
}
