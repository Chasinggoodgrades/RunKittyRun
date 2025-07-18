using System;
using WCSharp.Api;
using static WCSharp.Api.Common;

public class RTR
{
    private const float RTR_INTERVAL = 0.001f;
    private const float ITEM_PICKUP_RADIUS = 48;

    private Kitty kitty;
    private timer RTRTimer;
    private bool enabled;

    private trigger ClickTrigger { get; set; }
    private trigger WidgetTrigger { get; set; }

    private float targetX = 0;
    private float targetY = 0;
    private bool hasTarget = false;
    private string lastUnitAnimation;
    public float? absoluteMoveSpeed = null;

    public RTR(Kitty kitty)
    {
        this.kitty = kitty;
        RTRTimer = timer.Create();
        enabled = false;
        RegisterClickEvent();
    }

    public bool IsEnabled()
    {
        return enabled;
    }

    public void StartRTR()
    {
        enabled = true;
        kitty.CanEarnAwards = false;
        ResumeRTR();
    }

    public void ResumeRTR()
    {
        if (!enabled)
        {
            return;
        }

        ClickTrigger.Enable();
        WidgetTrigger.Enable();

        RTRTimer.Start(RTR_INTERVAL, true, ErrorHandler.Wrap(UpdateRTR));
    }

    public void PauseRTR()
    {
        ClickTrigger.Disable();
        WidgetTrigger.Disable();
        RTRTimer.Pause();
        hasTarget = false;
        if (this.lastUnitAnimation != "stand")
        {
            this.lastUnitAnimation = "stand";
            kitty.Unit.SetAnimation(0);
        }
    }

    public void StopRTR()
    {
        enabled = false;
        kitty.CanEarnAwards = true;
        this.PauseRTR();
    }

    private void UpdateRTR()
    {
        if (!hasTarget)
        {
            if (this.lastUnitAnimation != "stand")
            {
                this.lastUnitAnimation = "stand";
                kitty.Unit.SetAnimation(0);
            }
            return;
        }

        float currentX = kitty.Unit.X;
        float currentY = kitty.Unit.Y;

        float distanceToTarget = WCSharp.Shared.Util.DistanceBetweenPoints(currentX, currentY, targetX, targetY);

        if (distanceToTarget < 10)
        {
            hasTarget = false;
            if (this.lastUnitAnimation != "stand")
            {
                this.lastUnitAnimation = "stand";
                kitty.Unit.SetAnimation(0);
            }
            return;
        }

        if (this.lastUnitAnimation != "walk")
        {
            this.lastUnitAnimation = "walk";
            kitty.Unit.SetAnimation(6);
        }

        float moveSpeed = this.absoluteMoveSpeed ?? GetUnitMoveSpeed(kitty.Unit);
        float movePerTick = moveSpeed * RTR_INTERVAL;

        float angle = Atan2(targetY - currentY, targetX - currentX);
        SetUnitFacing(kitty.Unit, angle * Blizzard.bj_RADTODEG);

        float newX = currentX + (movePerTick * Cos(angle));
        float newY = currentY + (movePerTick * Sin(angle));

        if (IsTerrainPathable(newX, currentY, PATHING_TYPE_WALKABILITY))
        {
            newX = currentX;
        }

        if (IsTerrainPathable(currentX, newY, PATHING_TYPE_WALKABILITY))
        {
            newY = currentY;
        }

        kitty.Unit.SetPosition(newX, newY);
        ItemPickup();
    }

    private void RegisterClickEvent()
    {
        ClickTrigger = trigger.Create();
        ClickTrigger.RegisterUnitEvent(kitty.Unit, unitevent.IssuedPointOrder);
        ClickTrigger.AddAction(() => HandleClick(true));

        WidgetTrigger = trigger.Create();
        WidgetTrigger.RegisterUnitEvent(kitty.Unit, unitevent.IssuedTargetOrder);
        WidgetTrigger.AddAction(() => HandleClick(false));

        ClickTrigger.Disable();
        WidgetTrigger.Disable();
    }

    private void HandleClick(bool isToLocation)
    {
        if (!IsEnabled()) return;

        IssueImmediateOrder(@event.Unit, "stop");

        if (isToLocation)
        {
            targetX = GetOrderPointX();
            targetY = GetOrderPointY();
        }
        else
        {
            var target = GetOrderTarget();
            targetX = GetWidgetX(target);
            targetY = GetWidgetY(target);
        }

        hasTarget = true;
    }

    private void ItemPickup()
    {
        if (!enabled) return;

        var kibbleList = ItemSpatialGrid.GetNearbyKibbles(kitty.Unit.X, kitty.Unit.Y);
        var itemList = ItemSpatialGrid.GetNearbyItems(kitty.Unit.X, kitty.Unit.Y);

        if (kibbleList != null && kibbleList.Count > 0)
        {
            for (int i = 0; i < kibbleList.Count; i++)
            {
                var k = kibbleList[i];
                if (k == null) continue;
                kitty.Unit.AddItem(k.Item);
            }
        }

        if (itemList != null && itemList.Count > 0)
        {
            for (int i = 0; i < itemList.Count; i++)
            {
                var item = itemList[i];
                if (item == null) continue;
                if (item.IsOwned) continue;
                kitty.Unit.AddItem(item);
                break;
            }
        }
    }
}
