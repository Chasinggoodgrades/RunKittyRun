import { Kitty } from 'src/Game/Entities/Kitty/Kitty'
import { Trigger } from 'w3ts'

export class MirrorMovementHandler {
    private kitty: Kitty
    private MovementTrigger: Trigger
    private isProcessingMirror: boolean = false

    public constructor(kitty: Kitty) {
        this.kitty = kitty
        this.RegisterMovementEvents()
    }

    private RegisterMovementEvents() {
        this.MovementTrigger = Trigger.create()!
        this.MovementTrigger.registerUnitEvent(this.kitty.Unit, unitevent.IssuedPointOrder)
        this.MovementTrigger.registerUnitEvent(this.kitty.Unit, unitevent.IssuedTargetOrder)
        this.MovementTrigger.addAction(this.HandleMovementOrder)
    }

    private HandleMovementOrder() {
        if (!this.kitty.IsMirror) return
        if (this.kitty.Slider.IsEnabled()) return // Let slider handle its own mirror logic
        if (this.isProcessingMirror) return // Prevent recursion

        let unit = getTriggerUnit()
        let unitX = unit.x
        let unitY = unit.y

        let orderX: number, orderY

        // Check if it's a point order or target order
        let target = GetOrderTarget()
        if (target != null) {
            // Target order - get target position
            orderX = GetWidgetX(target)
            orderY = GetWidgetY(target)
        } else {
            // Point order - get order point
            orderX = GetOrderPointX()
            orderY = GetOrderPointY()
        }

        // Calculate the mirror position (opposite direction)
        let deltaX = orderX - unitX
        let deltaY = orderY - unitY
        let mirrorX = unitX - deltaX
        let mirrorY = unitY - deltaY

        // Issue the mirrored move order
        this.isProcessingMirror = true
        unit.IssueOrder('move', mirrorX, mirrorY)
        this.isProcessingMirror = false
    }

    public dispose() {
        this.MovementTrigger?.dispose()
        this.MovementTrigger = null
    }
}
