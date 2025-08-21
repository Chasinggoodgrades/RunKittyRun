import { Kitty } from 'src/Game/Entities/Kitty/Kitty'
import { ItemSpatialGrid } from 'src/Game/Items/ItemSpatialGrid'
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
    private hasTarget = false
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

    public StartRTR = () => {
        this.enabled = true
        this.kitty.CanEarnAwards = false
        this.ResumeRTR()
    }

    public ResumeRTR = () => {
        if (!this.enabled) {
            return
        }

        this.ClickTrigger.enabled = true
        this.WidgetTrigger.enabled = true

        this.RTRTimer.start(this.RTR_INTERVAL, true, this.UpdateRTR)
    }

    public PauseRTR = () => {
        if (!this.enabled) {
            return
        }
        this.ClickTrigger.enabled = false
        this.WidgetTrigger.enabled = false
        this.RTRTimer.pause()
        this.hasTarget = false
        if (this.lastUnitAnimation !== 'stand') {
            this.lastUnitAnimation = 'stand'
            this.kitty.Unit.setAnimation(0)
        }
    }

    public StopRTR = () => {
        this.enabled = false
        // kitty.CanEarnAwards = true;
        this.PauseRTR()
    }

    private UpdateRTR = () => {
        if (!this.hasTarget) {
            if (this.lastUnitAnimation !== 'stand') {
                this.lastUnitAnimation = 'stand'
                this.kitty.Unit.setAnimation(0)
            }
            return
        }

        const currentX = this.kitty.Unit.x
        const currentY = this.kitty.Unit.y

        const distanceToTarget = distanceBetweenXYPoints(currentX, currentY, this.targetX, this.targetY)

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

        const moveSpeed = this.absoluteMoveSpeed ?? this.kitty.Unit.moveSpeed
        const movePerTick = moveSpeed * this.RTR_INTERVAL

        const angle = Atan2(this.targetY - currentY, this.targetX - currentX)
        this.kitty.Unit.facing = angle * bj_RADTODEG

        let newX = currentX + movePerTick * Cos(angle)
        let newY = currentY + movePerTick * Sin(angle)

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

    private RegisterClickEvent = () => {
        this.ClickTrigger = Trigger.create()!
        this.ClickTrigger.registerUnitEvent(this.kitty.Unit, EVENT_UNIT_ISSUED_POINT_ORDER)
        this.ClickTrigger.addAction(() => this.HandleClick(true))

        this.WidgetTrigger = Trigger.create()!
        this.WidgetTrigger.registerUnitEvent(this.kitty.Unit, EVENT_UNIT_ISSUED_TARGET_ORDER)
        this.WidgetTrigger.addAction(() => this.HandleClick(false))

        this.ClickTrigger.enabled = false
        this.WidgetTrigger.enabled = false
    }

    private HandleClick = (isToLocation: boolean) => {
        if (!this.IsEnabled()) return

        getTriggerUnit().issueImmediateOrder('stop')

        if (isToLocation) {
            this.targetX = GetOrderPointX()
            this.targetY = GetOrderPointY()
        } else {
            const target = GetOrderTarget()!
            this.targetX = GetWidgetX(target)
            this.targetY = GetWidgetY(target)
        }

        this.hasTarget = true
    }

    private ItemPickup = () => {
        if (!this.enabled) return
        ItemSpatialGrid.KittyItemPickup(this.kitty)
    }
}
