﻿using WCSharp.Api;
using static WCSharp.Api.Common;

public class APMTracker
{
    private const float CAPTURE_INTERVAL = 0.1f;
    private trigger ClicksTrigger = trigger.Create();
    private triggeraction ClicksAction;
    private timer PeriodicTimer;

    private int TotalActions;
    private float TimeOutsideSafeZones;

    // private (float X, float Y) LastPosition;
    private Kitty Kitty { get; set; }

    public APMTracker(Kitty kitty)
    {
        Kitty = kitty;
        Init();
    }

    private void Init()
    {
        ClicksTrigger.RegisterUnitEvent(Kitty.Unit, unitevent.IssuedPointOrder);
        ClicksAction = ClicksTrigger.AddAction(ErrorHandler.Wrap(CaptureActions));
        PeriodicTimer = PeriodicCheck();
    }

    private timer PeriodicCheck()
    {
        PeriodicTimer = CreateTimer();
        PeriodicTimer.Start(CAPTURE_INTERVAL, true, ErrorHandler.Wrap(CheckKittyPositions));
        return PeriodicTimer;
    }

    private void CaptureActions()
    {
        if (!IsInSafeZone(Kitty))
            TotalActions++;
    }

    private void CheckKittyPositions()
    {
        if (!IsInSafeZone(Kitty)) return;
        Kitty.APMTracker.TimeOutsideSafeZones += CAPTURE_INTERVAL;
    }

    private static bool IsInSafeZone(Kitty kitty)
    {
        return RegionList.SafeZones[kitty.CurrentSafeZone].Contains(kitty.Unit.X, kitty.Unit.Y);
    }

    private static float CalculateAPM(Kitty kitty)
    {
        var totalActions = kitty.APMTracker.TotalActions;
        var timeOutsideSafeZones = kitty.APMTracker.TimeOutsideSafeZones / 60.0f; // put in mins (APM)
        return timeOutsideSafeZones == 0.0f ? 0.0f : totalActions / timeOutsideSafeZones;
    }

    public static string CalculateAllAPM()
    {
        string apmString = "";
        foreach (var kitty in Globals.ALL_KITTIES)
        {
            var apm = CalculateAPM(kitty.Value);
            apmString += $"{Colors.PlayerNameColored(kitty.Value.Player)}:  {(int)apm} Active APM\n";
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
