export class RTR {
    private RTR_INTERVAL: number = 0.001
    private ITEM_PICKUP_RADIUS: number = 48

    private kitty: Kitty
    private RTRTimer: Timer
    private enabled: boolean

    private ClickTrigger: trigger
    private WidgetTrigger: trigger

    private targetX: number = 0
    private targetY: number = 0
    private hasTarget: boolean = false
    private lastUnitAnimation: string
    public absoluteMoveSpeed: number

    public RTR(kitty: Kitty) {
        this.kitty = kitty
        RTRTimer = timer.Create()
        enabled = false
        RegisterClickEvent()
    }

    public IsEnabled(): boolean {
        return enabled
    }

    public StartRTR() {
        enabled = true
        kitty.CanEarnAwards = false
        ResumeRTR()
    }

    public ResumeRTR() {
        if (!enabled) {
            return
        }

        ClickTrigger.Enable()
        WidgetTrigger.Enable()

        RTRTimer.start(RTR_INTERVAL, true, ErrorHandler.Wrap(UpdateRTR))
    }

    public PauseRTR() {
        ClickTrigger.Disable()
        WidgetTrigger.Disable()
        RTRTimer.pause()
        hasTarget = false
        if (this.lastUnitAnimation != 'stand') {
            this.lastUnitAnimation = 'stand'
            kitty.Unit.SetAnimation(0)
        }
    }

    public StopRTR() {
        enabled = false
        // kitty.CanEarnAwards = true;
        this.PauseRTR()
    }

    private UpdateRTR() {
        if (!hasTarget) {
            if (this.lastUnitAnimation != 'stand') {
                this.lastUnitAnimation = 'stand'
                kitty.Unit.SetAnimation(0)
            }
            return
        }

        let currentX: number = kitty.Unit.X
        let currentY: number = kitty.unit.y

        let distanceToTarget: number = WCSharp.Shared.Util.DistanceBetweenPoints(currentX, currentY, targetX, targetY)

        if (distanceToTarget < 10) {
            hasTarget = false
            if (this.lastUnitAnimation != 'stand') {
                this.lastUnitAnimation = 'stand'
                kitty.Unit.SetAnimation(0)
            }
            return
        }

        if (this.lastUnitAnimation != 'walk') {
            this.lastUnitAnimation = 'walk'
            kitty.Unit.SetAnimation(6)
        }

        let moveSpeed: number = this.absoluteMoveSpeed ?? GetUnitMoveSpeed(kitty.Unit)
        let movePerTick: number = moveSpeed * RTR_INTERVAL

        let angle: number = Atan2(targetY - currentY, targetX - currentX)
        SetUnitFacing(kitty.Unit, angle * bj_RADTODEG)

        let newX: number = currentX + movePerTick * Cos(angle)
        let newY: number = currentY + movePerTick * Sin(angle)

        if (IsTerrainPathable(newX, currentY, PATHING_TYPE_WALKABILITY)) {
            newX = currentX
        }

        if (IsTerrainPathable(currentX, newY, PATHING_TYPE_WALKABILITY)) {
            newY = currentY
        }

        kitty.Unit.SetPathing(false)
        kitty.Unit.setPos(newX, newY)
        kitty.Unit.SetPathing(true)

        ItemPickup()
    }

    private RegisterClickEvent() {
        let ClickTrigger = CreateTrigger()
        ClickTrigger.RegisterUnitEvent(kitty.Unit, unitevent.IssuedPointOrder)
        ClickTrigger.AddAction(() => HandleClick(true))

        let WidgetTrigger = CreateTrigger()
        WidgetTrigger.RegisterUnitEvent(kitty.Unit, unitevent.IssuedTargetOrder)
        WidgetTrigger.AddAction(() => HandleClick(false))

        ClickTrigger.Disable()
        WidgetTrigger.Disable()
    }

    private HandleClick(isToLocation: boolean) {
        if (!IsEnabled()) return

        IssueImmediateOrder(GetTriggerUnit(), 'stop')

        if (isToLocation) {
            targetX = GetOrderPointX()
            targetY = GetOrderPointY()
        } else {
            let target = GetOrderTarget()
            targetX = GetWidgetX(target)
            targetY = GetWidgetY(target)
        }

        hasTarget = true
    }

    private ItemPickup() {
        if (!enabled) return
        ItemSpatialGrid.KittyItemPickup(kitty)
    }
}
