import { Kitty } from 'src/Game/Entities/Kitty/Kitty'
import { ItemSpatialGrid } from 'src/Game/Items/ItemSpatialGrid'
import { ErrorHandler } from 'src/Utility/ErrorHandler'
import { distanceBetweenXYPoints } from 'src/Utility/Utility'
import { getTriggerUnit } from 'src/Utility/w3tsUtils'
import { Timer, Trigger } from 'w3ts'

export class RTR {
    private RTR_INTERVAL = 0.001
    private ITEM_PICKUP_RADIUS = 48

    private kitty: Kitty
    private RTRTimer: Timer
    private enabled = false

    private ClickTrigger: Trigger
    private WidgetTrigger: Trigger

    private targetX = 0
    private targetY = 0
    private hasTarget: boolean = false
    private lastUnitAnimation: string
    public absoluteMoveSpeed = 0

    public constructor(kitty: Kitty) {
        this.kitty = kitty
        this.RTRTimer = Timer.create()
        this.enabled = false
        this.RegisterClickEvent()
    }

    public IsEnabled(): boolean {
        return this.enabled
    }

    public StartRTR() {
        this.enabled = true
        this.kitty.CanEarnAwards = false
        this.ResumeRTR()
    }

    public ResumeRTR() {
        if (!this.enabled) {
            return
        }

        this.ClickTrigger.enabled = true
        this.WidgetTrigger.enabled = true

        this.RTRTimer.start(
            this.RTR_INTERVAL,
            true,
            ErrorHandler.Wrap(() => this.UpdateRTR())
        )
    }

    public PauseRTR() {
        this.ClickTrigger.enabled = false
        this.WidgetTrigger.enabled = false
        this.RTRTimer.pause()
        this.hasTarget = false
        if (this.lastUnitAnimation !== 'stand') {
            this.lastUnitAnimation = 'stand'
            this.kitty.Unit.setAnimation(0)
        }
    }

    public StopRTR() {
        this.enabled = false
        // kitty.CanEarnAwards = true;
        this.PauseRTR()
    }

    private UpdateRTR() {
        if (!this.hasTarget) {
            if (this.lastUnitAnimation !== 'stand') {
                this.lastUnitAnimation = 'stand'
                this.kitty.Unit.setAnimation(0)
            }
            return
        }

        let currentX: number = this.kitty.Unit.x
        let currentY: number = this.kitty.Unit.y

        let distanceToTarget: number = distanceBetweenXYPoints(currentX, currentY, this.targetX, this.targetY)

        if (distanceToTarget < 10) {
            this.hasTarget = false
            if (this.lastUnitAnimation !== 'stand') {
                this.lastUnitAnimation = 'stand'
                this.kitty.Unit.setAnimation(0)
            }
            return
        }

        if (this.lastUnitAnimation !== 'walk') {
            this.lastUnitAnimation = 'walk'
            this.kitty.Unit.setAnimation(6)
        }

        let moveSpeed: number = this.absoluteMoveSpeed ?? this.kitty.Unit.moveSpeed
        let movePerTick: number = moveSpeed * this.RTR_INTERVAL

        let angle: number = Atan2(this.targetY - currentY, this.targetX - currentX)
        this.kitty.Unit.facing = angle * bj_RADTODEG

        let newX: number = currentX + movePerTick * Cos(angle)
        let newY: number = currentY + movePerTick * Sin(angle)

        if (IsTerrainPathable(newX, currentY, PATHING_TYPE_WALKABILITY)) {
            newX = currentX
        }

        if (IsTerrainPathable(currentX, newY, PATHING_TYPE_WALKABILITY)) {
            newY = currentY
        }

        this.kitty.Unit.setPathing(false)
        this.kitty.Unit.setPosition(newX, newY)
        this.kitty.Unit.setPathing(true)

        this.ItemPickup()
    }

    private RegisterClickEvent() {
        let ClickTrigger = Trigger.create()!
        ClickTrigger.registerUnitEvent(this.kitty.Unit, EVENT_UNIT_ISSUED_POINT_ORDER)
        ClickTrigger.addAction(() => this.HandleClick(true))

        let WidgetTrigger = Trigger.create()!
        WidgetTrigger.registerUnitEvent(this.kitty.Unit, EVENT_UNIT_ISSUED_TARGET_ORDER)
        WidgetTrigger.addAction(() => this.HandleClick(false))

        ClickTrigger.enabled = false
        WidgetTrigger.enabled = false
    }

    private HandleClick(isToLocation: boolean) {
        if (!this.IsEnabled()) return

        getTriggerUnit().issueImmediateOrder('stop')

        if (isToLocation) {
            this.targetX = GetOrderPointX()
            this.targetY = GetOrderPointY()
        } else {
            let target = GetOrderTarget()!
            this.targetX = GetWidgetX(target)
            this.targetY = GetWidgetY(target)
        }

        this.hasTarget = true
    }

    private ItemPickup() {
        if (!this.enabled) return
        ItemSpatialGrid.KittyItemPickup(this.kitty)
    }
}
