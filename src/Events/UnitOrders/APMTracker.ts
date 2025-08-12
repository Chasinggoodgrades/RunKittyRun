export class APMTracker {
    private readonly _cachedPositions: Action
    private CAPTURE_INTERVAL: number = 0.1
    private ClicksTrigger: trigger = CreateTrigger()
    private ClicksAction: triggeraction
    private PeriodicTimer: timer
    public LastX: number
    public LastY: number

    private TotalActions: number
    private TimeOutsideSafeZones: number

    // private (number X, number Y) LastPosition;
    private Kitty: Kitty

    public APMTracker(kitty: Kitty) {
        Kitty = kitty
        _cachedPositions = () => CheckKittyPositions() // cache the method for periodic timer use
        Init()
    }

    private Init() {
        ClicksTrigger.RegisterUnitEvent(Kitty.Unit, EVENT_UNIT_ISSUED_POINT_ORDER)
        ClicksAction = ClicksTrigger.AddAction(CaptureActions)
        PeriodicTimer = PeriodicCheck()
    }

    private PeriodicCheck(): timer {
        PeriodicTimer = Timer.create()
        PeriodicTimer.start(CAPTURE_INTERVAL, true, _cachedPositions)
        return PeriodicTimer
    }

    private CaptureActions() {
        if (!IsInSafeZone(Kitty)) {
            TotalActions += 1

            LastX = GetOrderPointX()
            LastY = GetOrderPointY()
        }
    }

    private CheckKittyPositions() {
        try {
            if (IsInSafeZone(Kitty)) return
            Kitty.APMTracker.TimeOutsideSafeZones += CAPTURE_INTERVAL
        } catch (e) {
            Logger.Warning('Error in APMTracker.CheckKittyPositions: {e.Message}')
            throw e
        }
    }

    private static IsInSafeZone(kitty: Kitty) {
        return RegionList.SafeZones[kitty.CurrentSafeZone].includes(kitty.Unit.X, kitty.unit.y)
    }

    private static CalculateAPM(kitty: Kitty) {
        let totalActions = kitty.APMTracker.TotalActions
        let timeOutsideSafeZones = kitty.APMTracker.TimeOutsideSafeZones / 60.0 // put in mins (APM)
        return timeOutsideSafeZones > 0.0 ? totalActions / timeOutsideSafeZones : 0.0
    }

    public static CalculateAllAPM(): string {
        let apmString: string = ''
        for (let i: number = 0; i < Globals.ALL_PLAYERS.length; i++) {
            let kitty = Globals.ALL_KITTIES[Globals.ALL_PLAYERS[i]]
            let apm = CalculateAPM(kitty)
            apmString += '{Colors.PlayerNameColored(kitty.Player)}:  {apm} APM: Active\n'
        }
        return apmString
    }

    public Dispose() {
        PeriodicTimer.pause()
        PeriodicTimer?.Dispose()
        ClicksTrigger.RemoveAction(ClicksAction)
        ClicksTrigger.Dispose()
    }

    /*    public static (x: number, y: number) GetLastOrderLocation(unit: Unit)
        {
            if (unit == null)
            {
                Logger.Warning("Unit is null in GetLastOrderLocation.");
                return (0.0, 0.0);
            }

            if (!LastOrderLocation.has(unit))
            {
                Logger.Warning("Unit {unit} found: not in LastOrderLocation.");
                return (0.0, 0.0);
            }

            return LastOrderLocation[unit];
        }*/
}
