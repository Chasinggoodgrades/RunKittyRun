using System;
using System.Linq;
using WCSharp.Api;
using static WCSharp.Api.Common;

public class Slider
{
    private const float SLIDE_INTERVAL = 0.0075f;
    private const float SLIDE_ANGLE_PER_PERIOD = 0.3f;

    private Kitty kitty;
    private timer SliderTimer;
    private bool enabled;

    private trigger ClickTrigger { get; set; }
    private trigger WidgetTrigger { get; set; }

    public Slider(Kitty kitty)
    {
        this.kitty = kitty;
        SliderTimer = timer.Create();
        enabled = false;
        RegisterClickEvent();
    }

    public bool IsEnabled()
    {
        return enabled;
    }

    public void StartSlider()
    {
        enabled = true;
        ResumeSlider();
    }

    public void ResumeSlider()
    {
        if (!enabled)
        {
            return;
        }

        EnableTrigger(ClickTrigger);
        EnableTrigger(WidgetTrigger);

        SliderTimer.Start(SLIDE_INTERVAL, true, () =>
        {
            if (!IsOnSlideTerrain()) return;
            UpdateSlider();
        });
    }

    public void StopSlider()
    {
        enabled = false;
        DisableTrigger(ClickTrigger);
        DisableTrigger(WidgetTrigger);
        SliderTimer.Pause();
    }

    private bool IsOnSlideTerrain()
    {
        return !TerrainChanger.SafezoneTerrain.Contains(GetTerrainType(kitty.Unit.X, kitty.Unit.Y));
    }

    private void UpdateSlider()
    {
        float moveSpeed = GetUnitMoveSpeed(kitty.Unit);
        float movePerTick = moveSpeed * SLIDE_INTERVAL;

        float angle = Rad2Deg(GetUnitFacing(kitty.Unit));

        float oldX = GetUnitX(kitty.Unit);
        float oldY = GetUnitY(kitty.Unit);

        float newX = oldX + movePerTick * Cos(angle);
        float newY = oldY + movePerTick * Sin(angle);

        if (IsTerrainPathable(newX, oldY, PATHING_TYPE_WALKABILITY))
        {
            newX = oldX;
        }

        if (IsTerrainPathable(oldX, newY, PATHING_TYPE_WALKABILITY))
        {
            newY = oldY;
        }

        SetUnitX(kitty.Unit, newX);
        SetUnitY(kitty.Unit, newY);
    }

    private void RegisterClickEvent()
    {
        ClickTrigger = CreateTrigger();
        Blizzard.TriggerRegisterAnyUnitEventBJ(ClickTrigger, EVENT_PLAYER_UNIT_ISSUED_POINT_ORDER);
        TriggerAddCondition(ClickTrigger, Condition(() => GetTriggerUnit() == kitty.Unit && IsEnabled()));
        TriggerAddAction(ClickTrigger, () => HandleTurn(true));

        WidgetTrigger = CreateTrigger();
        Blizzard.TriggerRegisterAnyUnitEventBJ(WidgetTrigger, EVENT_PLAYER_UNIT_ISSUED_TARGET_ORDER);
        TriggerAddCondition(WidgetTrigger, Condition(() => GetTriggerUnit() == kitty.Unit && IsEnabled()));
        TriggerAddAction(WidgetTrigger, () => HandleTurn(false));

        DisableTrigger(ClickTrigger);
        DisableTrigger(WidgetTrigger);
    }

    private void StopUnit(unit unit)
    {
        PauseUnit(unit, true);
        IssueImmediateOrder(unit, "stop");
        PauseUnit(unit, false);
    }

    private void HandleTurn(bool isToLocation)
    {
        var unit = GetTriggerUnit();
        var angle = 0.0f;

        if (isToLocation)
        {
            var orderX = GetOrderPointX();
            var orderY = GetOrderPointY();
            angle = Atan2(orderY - GetUnitY(unit), orderX - GetUnitX(unit)) * Blizzard.bj_RADTODEG;
        }
        else
        {
            var target = GetOrderTarget();
            var orderX = GetWidgetX(target);
            var orderY = GetWidgetY(target);
            angle = Atan2(orderY - GetUnitY(unit), orderX - GetUnitX(unit)) * Blizzard.bj_RADTODEG;
        }

        StopUnit(unit);

        // if (kitty.SlidingMode == "max")
        // {
        //     var currentAngle = GetUnitFacing(unit);
        //     var turnRate = AnglesDiff(angle, currentAngle);
        //     kitty.SetRemainingDegreesToTurn(turnRate);
        // }
        // else
        // {
        SetUnitFacing(unit, angle);
        // }
    }
}