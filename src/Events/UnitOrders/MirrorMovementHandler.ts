class MirrorMovementHandler {
    private kitty: Kitty
    private MovementTrigger: trigger
    private isProcessingMirror: boolean = false

    public MirrorMovementHandler(kitty: Kitty) {
        this.kitty = kitty
        RegisterMovementEvents()
    }

    private RegisterMovementEvents() {
        MovementTrigger = trigger.Create()
        MovementTrigger.RegisterUnitEvent(kitty.Unit, unitevent.IssuedPointOrder)
        MovementTrigger.RegisterUnitEvent(kitty.Unit, unitevent.IssuedTargetOrder)
        MovementTrigger.AddAction(HandleMovementOrder)
    }

    private HandleMovementOrder() {
        if (!kitty.IsMirror) return
        if (kitty.Slider.IsEnabled()) return // Let slider handle its own mirror logic
        if (isProcessingMirror) return // Prevent recursion

        let unit = GetTriggerUnit()
        let unitX = GetUnitX(unit)
        let unitY = GetUnitY(unit)

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
        isProcessingMirror = true
        unit.IssueOrder('move', mirrorX, mirrorY)
        isProcessingMirror = false
    }

    public Dispose() {
        MovementTrigger?.Dispose()
        MovementTrigger = null
    }
}
