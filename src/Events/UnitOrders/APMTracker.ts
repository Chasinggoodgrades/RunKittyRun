import { Kitty } from 'src/Game/Entities/Kitty/Kitty'
import { Globals } from 'src/Global/Globals'
import { RegionList } from 'src/Global/RegionList'
import { ColorUtils } from 'src/Utility/Colors/ColorUtils'
import { Action } from 'src/Utility/CSUtils'
import { Timer, Trigger } from 'w3ts'
import { Logger } from '../Logger/Logger'

export class APMTracker {
    private readonly _cachedPositions: Action
    private CAPTURE_INTERVAL = 0.1
    private ClicksTrigger: Trigger = Trigger.create()!
    private ClicksAction: triggeraction
    private PeriodicTimer: Timer
    public LastX = 0
    public LastY = 0

    private TotalActions = 0
    private TimeOutsideSafeZones = 0

    // private (number X, number Y) LastPosition;
    private Kitty: Kitty

    public constructor(kitty: Kitty) {
        this.Kitty = kitty
        this._cachedPositions = () => this.CheckKittyPositions() // cache the method for periodic timer use
        this.Init()
    }

    private Init() {
        this.ClicksTrigger.registerUnitEvent(this.Kitty.Unit, EVENT_UNIT_ISSUED_POINT_ORDER)
        this.ClicksAction = this.ClicksTrigger.addAction(() => this.CaptureActions())
        this.PeriodicTimer = this.PeriodicCheck()
    }

    private PeriodicCheck(): Timer {
        this.PeriodicTimer = Timer.create()
        this.PeriodicTimer.start(this.CAPTURE_INTERVAL, true, this._cachedPositions)
        return this.PeriodicTimer
    }

    private CaptureActions() {
        if (!APMTracker.IsInSafeZone(this.Kitty)) {
            this.TotalActions += 1

            this.LastX = GetOrderPointX()
            this.LastY = GetOrderPointY()
        }
    }

    private CheckKittyPositions() {
        try {
            if (APMTracker.IsInSafeZone(this.Kitty)) return
            this.Kitty.APMTracker.TimeOutsideSafeZones += this.CAPTURE_INTERVAL
        } catch (e: any) {
            Logger.Warning(`Error in APMTracker.CheckKittyPositions: ${e}`)
            throw e
        }
    }

    private static IsInSafeZone(kitty: Kitty) {
        return RegionList.SafeZones[kitty.CurrentSafeZone].includes(kitty.Unit.x, kitty.Unit.y)
    }

    private static CalculateAPM(kitty: Kitty) {
        let totalActions = kitty.APMTracker.TotalActions
        let timeOutsideSafeZones = kitty.APMTracker.TimeOutsideSafeZones / 60.0 // put in mins (APM)
        return timeOutsideSafeZones > 0.0 ? totalActions / timeOutsideSafeZones : 0.0
    }

    public static CalculateAllAPM(): string {
        let apmString: string = ''
        for (let i = 0; i < Globals.ALL_PLAYERS.length; i++) {
            let kitty = Globals.ALL_KITTIES.get(Globals.ALL_PLAYERS[i])!
            let apm = APMTracker.CalculateAPM(kitty)
            apmString += `${ColorUtils.PlayerNameColored(kitty.Player)}:  ${apm} APM Active\n`
        }
        return apmString
    }

    public dispose() {
        this.PeriodicTimer.pause()
        this.PeriodicTimer?.destroy()
        this.ClicksTrigger.removeAction(this.ClicksAction)
        this.ClicksTrigger.destroy()
    }

    /*    public static (x: number, y: number) GetLastOrderLocation(unit: Unit)
        {
            if (unit === null)
            {
                Logger.Warning("Unit is null in GetLastOrderLocation.");
                return (0.0, 0.0);
            }

            if (!LastOrderLocation.has(unit))
            {
                Logger.Warning(`Unit ${unit} found: not in LastOrderLocation.`);
                return (0.0, 0.0);
            }

            return LastOrderLocation[unit];
        }*/
}
