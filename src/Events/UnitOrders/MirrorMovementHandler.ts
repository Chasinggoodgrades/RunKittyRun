import { Kitty } from 'src/Game/Entities/Kitty/Kitty'
import { getTriggerUnit } from 'src/Utility/w3tsUtils'
import { Trigger } from 'w3ts'

export class MirrorMovementHandler {
    private kitty: Kitty
    private MovementTrigger: Trigger | undefined
    private isProcessingMirror = false

    public constructor(kitty: Kitty) {
        this.kitty = kitty
        this.RegisterMovementEvents()
    }

    private RegisterMovementEvents = () => {
        this.MovementTrigger = Trigger.create()!
        this.MovementTrigger.registerUnitEvent(this.kitty.Unit, EVENT_UNIT_ISSUED_POINT_ORDER)
        this.MovementTrigger.registerUnitEvent(this.kitty.Unit, EVENT_UNIT_ISSUED_TARGET_ORDER)
        this.MovementTrigger.addAction(() => this.HandleMovementOrder())
    }

    private HandleMovementOrder = () => {
        if (!this.kitty.IsMirror) return
        if (this.kitty.Slider.IsEnabled()) return // Let slider handle its own mirror logic
        if (this.isProcessingMirror) return // Prevent recursion

        const unit = getTriggerUnit()
        const unitX = unit.x
        const unitY = unit.y

        let orderX: number, orderY

        // Check if it's a point order or target order
        const target = GetOrderTarget()
        if (target) {
            // Target order - get target position
            orderX = GetWidgetX(target)
            orderY = GetWidgetY(target)
        } else {
            // Point order - get order point
            orderX = GetOrderPointX()
            orderY = GetOrderPointY()
        }

        // Calculate the mirror position (opposite direction)
        const deltaX = orderX - unitX
        const deltaY = orderY - unitY
        const mirrorX = unitX - deltaX
        const mirrorY = unitY - deltaY

        // Issue the mirrored move order
        this.isProcessingMirror = true
        unit.issueOrderAt('move', mirrorX, mirrorY)
        this.isProcessingMirror = false
    }

    public dispose = () => {
        this.MovementTrigger?.destroy()
    }
}
