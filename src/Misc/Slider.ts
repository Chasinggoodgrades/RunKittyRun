class Slider {
    private SLIDE_INTERVAL: number = 0.0075
    private SLIDE_ANGLE_PER_PERIOD: number = 0.3
    private ITEM_PICKUP_RADIUS: number = 48

    private kitty: Kitty
    private SliderTimer: timer
    private enabled: boolean

    private ClickTrigger: trigger
    private WidgetTrigger: trigger

    private remainingDegreesToTurn: number = 0
    private slideCurrentTurnPerPeriod: number = 0

    private wasSliding: boolean = false
    private forcedSlideSpeed: number | null = null
    public absoluteSlideSpeed: number | null = null
    private ForcedSlideTimer: timer

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

    public Slider(kitty: Kitty) {
        this.kitty = kitty
        SliderTimer = timer.Create()
        ForcedSlideTimer = timer.Create()
        enabled = false
        RegisterClickEvent()
    }

    public IsEnabled(): boolean {
        return enabled
    }

    public StartSlider() {
        enabled = true
        ResumeSlider(false)
    }

    public ResumeSlider(isRevive: boolean) {
        if (!enabled) {
            return
        }

        ClickTrigger.Enable()
        WidgetTrigger.Enable()

        if (isRevive) {
            this.forcedSlideSpeed = 0
            this.kitty.Invulnerable = true

            this.ForcedSlideTimer.Start(
                1.4,
                false,
                ErrorHandler.Wrap(() => {
                    this.forcedSlideSpeed = null

                    this.ForcedSlideTimer.Start(
                        0.6,
                        false,
                        ErrorHandler.Wrap(() => {
                            this.kitty.Invulnerable = false
                        })
                    )
                })
            )
        }

        SliderTimer.Start(
            SLIDE_INTERVAL,
            true,
            ErrorHandler.Wrap(() => {
                if (this.kitty.Unit.IsPaused) {
                    return
                }

                if (!IsOnSlideTerrain()) {
                    if (this.wasSliding && this.kitty.IsMirror) {
                        // Reverse hero
                        BlzSetUnitFacingEx(kitty.Unit, GetUnitFacing(kitty.Unit) + 180)
                    }

                    this.wasSliding = false

                    if (this.remainingDegreesToTurn != 0) {
                        escaperTurnForOnePeriod()
                    }

                    return
                }

                if (!this.wasSliding && this.kitty.IsMirror) {
                    // Reverse hero
                    BlzSetUnitFacingEx(kitty.Unit, GetUnitFacing(kitty.Unit) + 180)
                }

                this.wasSliding = true
                UpdateSlider()
            })
        )
    }

    public PauseSlider() {
        ClickTrigger.Disable()
        WidgetTrigger.Disable()
        SliderTimer.Pause()
        ForcedSlideTimer.Pause()
        this.forcedSlideSpeed = null
        this.kitty.Invulnerable = false
        remainingDegreesToTurn = 0
        slideCurrentTurnPerPeriod = 0
        this.wasSliding = false
    }

    public StopSlider() {
        enabled = false
        this.PauseSlider()
    }

    public IsOnSlideTerrain(): boolean {
        return !TerrainChanger.SafezoneTerrain.Contains(GetTerrainType(kitty.Unit.X, kitty.Unit.Y))
    }

    private UpdateSlider() {
        let slideSpeed: number =
            this.forcedSlideSpeed ??
            this.absoluteSlideSpeed ??
            (this.kitty.IsMirror ? -1 : 1) * GetUnitMoveSpeed(kitty.Unit)
        let slidePerTick: number = slideSpeed * SLIDE_INTERVAL

        let angle: number = Rad2Deg(kitty.Unit.Facing)

        let oldX: number = kitty.Unit.X
        let oldY: number = kitty.Unit.Y

        escaperTurnForOnePeriod()

        let newX: number = oldX + slidePerTick * Cos(angle)
        let newY: number = oldY + slidePerTick * Sin(angle)

        if (IsTerrainPathable(newX, oldY, PATHING_TYPE_WALKABILITY)) {
            newX = oldX
        }

        if (IsTerrainPathable(oldX, newY, PATHING_TYPE_WALKABILITY)) {
            newY = oldY
        }

        kitty.Unit.SetPathing(false)
        kitty.Unit.SetPosition(newX, newY)
        kitty.Unit.SetPathing(true)
        ItemPickup()
    }

    private RegisterClickEvent() {
        ClickTrigger = trigger.Create()
        ClickTrigger.RegisterUnitEvent(kitty.Unit, unitevent.IssuedPointOrder)
        ClickTrigger.AddAction(() => HandleTurn(true))

        WidgetTrigger = trigger.Create()
        WidgetTrigger.RegisterUnitEvent(kitty.Unit, unitevent.IssuedTargetOrder)
        WidgetTrigger.AddAction(() => HandleTurn(false))

        ClickTrigger.Disable()
        WidgetTrigger.Disable()
    }

    private HandleTurn(isToLocation: boolean) {
        if (!IsEnabled()) return
        if (!IsOnSlideTerrain()) return

        let unit = GetTriggerUnit()
        let angle: number
        if (isToLocation) {
            let orderX = GetOrderPointX()
            let orderY = GetOrderPointY()
            angle = Atan2(orderY - GetUnitY(unit), orderX - GetUnitX(unit)) * bj_RADTODEG
        } else {
            let target = GetOrderTarget()
            let orderX = GetWidgetX(target)
            let orderY = GetWidgetY(target)
            angle = Atan2(orderY - GetUnitY(unit), orderX - GetUnitX(unit)) * bj_RADTODEG
        }

        let currentAngle = GetUnitFacing(unit)
        this.setRemainingDegreesToTurn(AnglesDiff(angle, currentAngle))
    }

    public ForceAngleBetween0And360(angle: number) {
        while (angle < 0) angle += 360
        while (angle >= 360) angle -= 360
        return angle
    }

    private AnglesDiff(endAngle: number, startAngle: number) {
        endAngle = ForceAngleBetween0And360(endAngle)
        startAngle = ForceAngleBetween0And360(startAngle)

        let anglesDiff = endAngle - startAngle
        if (anglesDiff < -180) anglesDiff += 360
        if (anglesDiff > 180) anglesDiff -= 360

        return anglesDiff
    }

    private setRemainingDegreesToTurn(remainingDegreesToTurn: number) {
        if (RAbsBJ(remainingDegreesToTurn) < 0.01) remainingDegreesToTurn = 0
        this.remainingDegreesToTurn = remainingDegreesToTurn
    }

    private escaperTurnForOnePeriod() {
        let rotationSpeed: number = 1.3
        let maxSlideTurnPerPeriod: number = rotationSpeed * SLIDE_INTERVAL * 360
        let rotationTimeForMaximumSpeed: number = 0.11
        let MAX_DEGREE_ON_WHICH_SPEED_TABLE_TAKES_CONTROL: number = 51

        let remainingDegrees: number = this.remainingDegreesToTurn
        if (remainingDegrees != 0) {
            let currentAngle: number = GetUnitFacing(kitty.Unit)

            let diffToApplyAbs: number = Math.Min(Math.Abs(remainingDegrees), Math.Abs(maxSlideTurnPerPeriod))

            if (diffToApplyAbs > 0.05) {
                let sens: number = remainingDegrees * maxSlideTurnPerPeriod > 0 ? 1 : -1
                let maxIncreaseRotationSpeedPerPeriod: number = Math.Abs(
                    (maxSlideTurnPerPeriod * SLIDE_INTERVAL) / rotationTimeForMaximumSpeed
                )

                let newSlideTurn: number
                let curSlideTurn: number = slideCurrentTurnPerPeriod
                let increaseRotationSpeedPerPeriod: number = maxIncreaseRotationSpeedPerPeriod
                let diffToApply: number

                if (Math.Abs(remainingDegrees) <= MAX_DEGREE_ON_WHICH_SPEED_TABLE_TAKES_CONTROL) {
                    let tableInd: number = Math.Round(Math.Abs(remainingDegrees))
                    let aimedSpeedPercentage: number = SPEED_AT_LEAST_THAN_50_DEGREES[tableInd]
                    let aimedNewSpeedPerPeriod: number = (maxSlideTurnPerPeriod * aimedSpeedPercentage * sens) / 100
                    let diffSpeed: number = aimedNewSpeedPerPeriod - curSlideTurn
                    if (Math.Abs(diffSpeed) < maxIncreaseRotationSpeedPerPeriod) {
                        diffToApply = aimedNewSpeedPerPeriod
                    } else {
                        let sensDiffToApply: number = diffSpeed > 0 ? 1 : -1
                        diffToApply = curSlideTurn + sensDiffToApply * maxIncreaseRotationSpeedPerPeriod
                    }
                    slideCurrentTurnPerPeriod = diffToApply
                } else {
                    if (sens > 0) {
                        newSlideTurn = Math.Min(curSlideTurn + increaseRotationSpeedPerPeriod, maxSlideTurnPerPeriod)
                        diffToApply = Math.Min(newSlideTurn, diffToApplyAbs)
                        diffToApply = Math.Min(remainingDegrees, diffToApply)
                    } else {
                        newSlideTurn = Math.Max(curSlideTurn - increaseRotationSpeedPerPeriod, -maxSlideTurnPerPeriod)
                        diffToApply = Math.Max(newSlideTurn, -diffToApplyAbs)
                        diffToApply = Math.Max(remainingDegrees, diffToApply)
                    }
                    slideCurrentTurnPerPeriod = newSlideTurn
                }

                this.setRemainingDegreesToTurn(remainingDegrees - diffToApply)

                let newAngle: number = currentAngle + diffToApply
                BlzSetUnitFacingEx(kitty.Unit, newAngle)
            }
        }
    }

    private ItemPickup() {
        if (!enabled) return
        ItemSpatialGrid.KittyItemPickup(kitty)
    }
}
