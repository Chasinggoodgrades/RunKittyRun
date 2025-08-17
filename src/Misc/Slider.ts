import { Kitty } from 'src/Game/Entities/Kitty/Kitty'
import { ItemSpatialGrid } from 'src/Game/Items/ItemSpatialGrid'
import { TerrainChanger } from 'src/Seasonal/Terrain/TerrainChanger'
import { getTriggerUnit } from 'src/Utility/w3tsUtils'
import { Timer, Trigger } from 'w3ts'

export class Slider {
    private SLIDE_INTERVAL = 0.0075
    private SLIDE_ANGLE_PER_PERIOD = 0.3
    private ITEM_PICKUP_RADIUS = 48

    private kitty: Kitty
    private SliderTimer: Timer
    private enabled = false

    private ClickTrigger: Trigger
    private WidgetTrigger: Trigger

    private remainingDegreesToTurn = 0
    private slideCurrentTurnPerPeriod = 0

    private wasSliding: boolean = false
    private forcedSlideSpeed: number | null = null
    public absoluteSlideSpeed: number | null = null
    private ForcedSlideTimer: Timer

    // percentage of maximum speed
    private SPEED_AT_LEAST_THAN_50_DEGREES: { [x: number]: number } = {
        51: 92.721,
        50: 91.655,
        49: 90.588,
        48: 89.522,
        47: 88.455,
        46: 87.389,
        45: 86.322,
        44: 85.255,
        43: 84.189,
        42: 83.646,
        41: 82.192,
        40: 80.737,
        39: 79.283,
        38: 77.828,
        37: 76.374,
        36: 74.919,
        35: 74.854,
        34: 73.439,
        33: 72.023,
        32: 70.607,
        31: 69.192,
        30: 67.776,
        29: 66.36,
        28: 66.357,
        27: 64.719,
        26: 63.081,
        25: 61.442,
        24: 59.804,
        23: 58.165,
        22: 58.165,
        21: 56.59,
        20: 55.015,
        19: 53.44,
        18: 51.866,
        17: 50.291,
        16: 48.783,
        15: 47.275,
        14: 45.767,
        13: 44.26,
        12: 42.75,
        11: 40.355,
        10: 37.96,
        9: 35.56,
        8: 31.698,
        7: 27.837,
        6: 23.975,
        5: 13.943,
        4: 9.091,
        3: 6.366,
        2: 2.8,
        1: 1.837,
        0: 1.5,
    }

    public constructor(kitty: Kitty) {
        this.kitty = kitty
        this.SliderTimer = Timer.create()
        this.ForcedSlideTimer = Timer.create()
        this.enabled = false
        this.RegisterClickEvent()
    }

    public IsEnabled(): boolean {
        return this.enabled
    }

    public StartSlider = () => {
        this.enabled = true
        this.ResumeSlider(false)
    }

    public ResumeSlider(isRevive: boolean) {
        if (!this.enabled) {
            return
        }

        this.ClickTrigger.enabled = true
        this.WidgetTrigger.enabled = true

        if (isRevive) {
            this.forcedSlideSpeed = 0
            this.kitty.Invulnerable = true

            this.ForcedSlideTimer.start(1.4, false, () => {
                this.forcedSlideSpeed = null

                this.ForcedSlideTimer.start(0.6, false, () => {
                    this.kitty.Invulnerable = false
                })
            })
        }

        this.SliderTimer.start(this.SLIDE_INTERVAL, true, () => {
            if (this.kitty.Unit.paused) {
                return
            }

            if (!this.IsOnSlideTerrain()) {
                if (this.wasSliding && this.kitty.IsMirror) {
                    // Reverse hero
                    this.kitty.Unit.setFacingEx(this.kitty.Unit.facing + 180)
                }

                this.wasSliding = false

                if (this.remainingDegreesToTurn !== 0) {
                    this.escaperTurnForOnePeriod()
                }

                return
            }

            if (!this.wasSliding && this.kitty.IsMirror) {
                // Reverse hero
                this.kitty.Unit.setFacingEx(this.kitty.Unit.facing + 180)
            }

            this.wasSliding = true
            this.UpdateSlider()
        })
    }

    public PauseSlider = () => {
        this.ClickTrigger.enabled = false
        this.WidgetTrigger.enabled = false
        this.SliderTimer.pause()
        this.ForcedSlideTimer.pause()
        this.forcedSlideSpeed = null
        this.kitty.Invulnerable = false
        this.remainingDegreesToTurn = 0
        this.slideCurrentTurnPerPeriod = 0
        this.wasSliding = false
    }

    public StopSlider = () => {
        this.enabled = false
        this.PauseSlider()
    }

    public IsOnSlideTerrain(): boolean {
        return !TerrainChanger.SafezoneTerrain.includes(GetTerrainType(this.kitty.Unit.x, this.kitty.Unit.y))
    }

    private UpdateSlider = () => {
        const slideSpeed: number =
            this.forcedSlideSpeed ??
            this.absoluteSlideSpeed ??
            (this.kitty.IsMirror ? -1 : 1) * this.kitty.Unit.moveSpeed
        const slidePerTick: number = slideSpeed * this.SLIDE_INTERVAL

        const angle: number = Rad2Deg(this.kitty.Unit.facing)

        const oldX: number = this.kitty.Unit.x
        const oldY: number = this.kitty.Unit.y

        this.escaperTurnForOnePeriod()

        let newX: number = oldX + slidePerTick * Cos(angle)
        let newY: number = oldY + slidePerTick * Sin(angle)

        if (IsTerrainPathable(newX, oldY, PATHING_TYPE_WALKABILITY)) {
            newX = oldX
        }

        if (IsTerrainPathable(oldX, newY, PATHING_TYPE_WALKABILITY)) {
            newY = oldY
        }

        this.kitty.Unit.setPathing(false)
        this.kitty.Unit.setPosition(newX, newY)
        this.kitty.Unit.setPathing(true)
        this.ItemPickup()
    }

    private RegisterClickEvent = () => {
        this.ClickTrigger = Trigger.create()!
        this.ClickTrigger.registerUnitEvent(this.kitty.Unit, EVENT_UNIT_ISSUED_POINT_ORDER)
        this.ClickTrigger.addAction(() => this.HandleTurn(true))

        this.WidgetTrigger = Trigger.create()!
        this.WidgetTrigger.registerUnitEvent(this.kitty.Unit, EVENT_UNIT_ISSUED_TARGET_ORDER)
        this.WidgetTrigger.addAction(() => this.HandleTurn(false))

        this.ClickTrigger.enabled = false
        this.WidgetTrigger.enabled = false
    }

    private HandleTurn(isToLocation: boolean) {
        if (!this.IsEnabled()) return
        if (!this.IsOnSlideTerrain()) return

        const unit = getTriggerUnit()
        let angle: number
        if (isToLocation) {
            const orderX = GetOrderPointX()
            const orderY = GetOrderPointY()
            angle = Atan2(orderY - unit.y, orderX - unit.x) * bj_RADTODEG
        } else {
            const target = GetOrderTarget()!
            const orderX = GetWidgetX(target)
            const orderY = GetWidgetY(target)
            angle = Atan2(orderY - unit.y, orderX - unit.x) * bj_RADTODEG
        }

        const currentAngle = GetUnitFacing(unit.handle)
        this.setRemainingDegreesToTurn(this.AnglesDiff(angle, currentAngle))
    }

    public ForceAngleBetween0And360(angle: number) {
        while (angle < 0) angle += 360
        while (angle >= 360) angle -= 360
        return angle
    }

    private AnglesDiff(endAngle: number, startAngle: number) {
        endAngle = this.ForceAngleBetween0And360(endAngle)
        startAngle = this.ForceAngleBetween0And360(startAngle)

        let anglesDiff = endAngle - startAngle
        if (anglesDiff < -180) anglesDiff += 360
        if (anglesDiff > 180) anglesDiff -= 360

        return anglesDiff
    }

    private setRemainingDegreesToTurn(remainingDegreesToTurn: number) {
        if (RAbsBJ(remainingDegreesToTurn) < 0.01) remainingDegreesToTurn = 0
        this.remainingDegreesToTurn = remainingDegreesToTurn
    }

    private escaperTurnForOnePeriod = () => {
        const rotationSpeed = 1.3
        const maxSlideTurnPerPeriod: number = rotationSpeed * this.SLIDE_INTERVAL * 360
        const rotationTimeForMaximumSpeed = 0.11
        const MAX_DEGREE_ON_WHICH_SPEED_TABLE_TAKES_CONTROL = 51

        const remainingDegrees: number = this.remainingDegreesToTurn
        if (remainingDegrees !== 0) {
            const currentAngle: number = GetUnitFacing(this.kitty.Unit.handle)

            const diffToApplyAbs: number = Math.min(Math.abs(remainingDegrees), Math.abs(maxSlideTurnPerPeriod))

            if (diffToApplyAbs > 0.05) {
                const sens: number = remainingDegrees * maxSlideTurnPerPeriod > 0 ? 1 : -1
                const maxIncreaseRotationSpeedPerPeriod: number = Math.abs(
                    (maxSlideTurnPerPeriod * this.SLIDE_INTERVAL) / rotationTimeForMaximumSpeed
                )

                let newSlideTurn: number
                const curSlideTurn: number = this.slideCurrentTurnPerPeriod
                const increaseRotationSpeedPerPeriod: number = maxIncreaseRotationSpeedPerPeriod
                let diffToApply: number

                if (Math.abs(remainingDegrees) <= MAX_DEGREE_ON_WHICH_SPEED_TABLE_TAKES_CONTROL) {
                    const tableInd: number = Math.round(Math.abs(remainingDegrees))
                    const aimedSpeedPercentage: number = this.SPEED_AT_LEAST_THAN_50_DEGREES[tableInd]
                    const aimedNewSpeedPerPeriod: number = (maxSlideTurnPerPeriod * aimedSpeedPercentage * sens) / 100
                    const diffSpeed: number = aimedNewSpeedPerPeriod - curSlideTurn
                    if (Math.abs(diffSpeed) < maxIncreaseRotationSpeedPerPeriod) {
                        diffToApply = aimedNewSpeedPerPeriod
                    } else {
                        const sensDiffToApply: number = diffSpeed > 0 ? 1 : -1
                        diffToApply = curSlideTurn + sensDiffToApply * maxIncreaseRotationSpeedPerPeriod
                    }
                    this.slideCurrentTurnPerPeriod = diffToApply
                } else {
                    if (sens > 0) {
                        newSlideTurn = Math.min(curSlideTurn + increaseRotationSpeedPerPeriod, maxSlideTurnPerPeriod)
                        diffToApply = Math.min(newSlideTurn, diffToApplyAbs)
                        diffToApply = Math.min(remainingDegrees, diffToApply)
                    } else {
                        newSlideTurn = Math.max(curSlideTurn - increaseRotationSpeedPerPeriod, -maxSlideTurnPerPeriod)
                        diffToApply = Math.max(newSlideTurn, -diffToApplyAbs)
                        diffToApply = Math.max(remainingDegrees, diffToApply)
                    }
                    this.slideCurrentTurnPerPeriod = newSlideTurn
                }

                this.setRemainingDegreesToTurn(remainingDegrees - diffToApply)

                const newAngle: number = currentAngle + diffToApply
                BlzSetUnitFacingEx(this.kitty.Unit.handle, newAngle)
            }
        }
    }

    private ItemPickup = () => {
        if (!this.enabled) return
        ItemSpatialGrid.KittyItemPickup(this.kitty)
    }
}
