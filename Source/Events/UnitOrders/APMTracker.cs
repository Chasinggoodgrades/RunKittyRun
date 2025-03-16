using WCSharp.Api;
using static WCSharp.Api.Common;

public class APMTracker
{
    private const float CAPTURE_INTERVAL = 0.1f;
    private static trigger ClicksTrigger = trigger.Create();
    private static triggeraction ClicksAction;
    private static timer PeriodicTimer;

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
        ClicksAction ??= ClicksTrigger.AddAction(() => CaptureActions());
        PeriodicTimer ??= PeriodicCheck();
    }

    private timer PeriodicCheck()
    {
        PeriodicTimer = CreateTimer();
        PeriodicTimer.Start(CAPTURE_INTERVAL, true, CheckKittyPositions);
        return PeriodicTimer;
    }

    private void CaptureActions()
    {
        var orderID = @event.IssuedOrderId;

        /*        if (orderID == OrderId("move") || orderID == OrderId("smart"))
                    LastPosition = (@event.OrderPointX, @event.OrderPointY);*/

        if (!IsInSafeZone(Kitty))
            TotalActions++;
    }

    private static void CheckKittyPositions()
    {
        foreach (var kitty in Globals.ALL_KITTIES)
        {
            if (IsInSafeZone(kitty.Value)) continue;
            kitty.Value.APMTracker.TimeOutsideSafeZones += CAPTURE_INTERVAL;
        }
    }

    private static bool IsInSafeZone(Kitty kitty)
    {
        return RegionList.SafeZones[kitty.CurrentSafeZone.ID].Contains(kitty.Unit.X, kitty.Unit.Y);
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
