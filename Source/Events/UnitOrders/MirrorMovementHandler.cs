using System;
using WCSharp.Api;
using static WCSharp.Api.Common;

public class MirrorMovementHandler
{
    private Kitty kitty;
    private trigger MovementTrigger { get; set; }
    private bool isProcessingMirror = false;

    public MirrorMovementHandler(Kitty kitty)
    {
        this.kitty = kitty;
        RegisterMovementEvents();
    }

    private void RegisterMovementEvents()
    {
        MovementTrigger = trigger.Create();
        MovementTrigger.RegisterUnitEvent(kitty.Unit, unitevent.IssuedPointOrder);
        MovementTrigger.RegisterUnitEvent(kitty.Unit, unitevent.IssuedTargetOrder);
        MovementTrigger.AddAction(HandleMovementOrder);
    }

    private void HandleMovementOrder()
    {
        if (!kitty.IsMirror) return;
        if (kitty.Slider.IsEnabled()) return; // Let slider handle its own mirror logic
        if (isProcessingMirror) return; // Prevent recursion

        var unit = @event.Unit;
        var unitX = GetUnitX(unit);
        var unitY = GetUnitY(unit);

        float orderX, orderY;

        // Check if it's a point order or target order
        var target = GetOrderTarget();
        if (target != null)
        {
            // Target order - get target position
            orderX = GetWidgetX(target);
            orderY = GetWidgetY(target);
        }
        else
        {
            // Point order - get order point
            orderX = GetOrderPointX();
            orderY = GetOrderPointY();
        }

        // Calculate the mirror position (opposite direction)
        var deltaX = orderX - unitX;
        var deltaY = orderY - unitY;
        var mirrorX = unitX - deltaX;
        var mirrorY = unitY - deltaY;

        // Issue the mirrored move order
        isProcessingMirror = true;
        unit.IssueOrder("move", mirrorX, mirrorY);
        isProcessingMirror = false;
    }

    public void Dispose()
    {
        MovementTrigger?.Dispose();
        MovementTrigger = null;
    }
}
