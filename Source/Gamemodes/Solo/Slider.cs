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

        ClickTrigger.Enable();
        WidgetTrigger.Enable();

        SliderTimer.Start(SLIDE_INTERVAL, true, () =>
        {
            if (!IsOnSlideTerrain()) return;
            UpdateSlider();
        });
    }

    public void StopSlider()
    {
        enabled = false;
        ClickTrigger.Disable();
        WidgetTrigger.Disable();
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

        float angle = Rad2Deg(kitty.Unit.Facing);

        float oldX = kitty.Unit.X;
        float oldY = kitty.Unit.Y;

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

        kitty.Unit.SetPosition(newX, newY);
    }

    private void RegisterClickEvent()
    {
        ClickTrigger = trigger.Create();
        Blizzard.TriggerRegisterAnyUnitEventBJ(ClickTrigger, EVENT_PLAYER_UNIT_ISSUED_POINT_ORDER);
        ClickTrigger.AddCondition(Condition(() => GetTriggerUnit() == kitty.Unit && IsEnabled()));
        ClickTrigger.AddAction(() => HandleTurn(true));

        WidgetTrigger = trigger.Create();
        Blizzard.TriggerRegisterAnyUnitEventBJ(WidgetTrigger, EVENT_PLAYER_UNIT_ISSUED_TARGET_ORDER);
        WidgetTrigger.AddCondition(Condition(() => GetTriggerUnit() == kitty.Unit && IsEnabled()));
        WidgetTrigger.AddAction(() => HandleTurn(false));

        ClickTrigger.Disable();
        WidgetTrigger.Disable();
    }

    private void HandleTurn(bool isToLocation)
    {
        var unit = @event.Unit;
        var angle = 0.0f;

        if (isToLocation)
        {
            var orderX = GetOrderPointX();
            var orderY = GetOrderPointY();
            angle = Atan2(orderY - unit.Y, orderX - unit.X) * Blizzard.bj_RADTODEG;
        }
        else
        {
            var target = GetOrderTarget();
            var orderX = GetWidgetX(target);
            var orderY = GetWidgetY(target);
            angle = Atan2(orderY - unit.Y, orderX - unit.X) * Blizzard.bj_RADTODEG;
        }

        // if (kitty.SlidingMode == "max")
        // {
        //     var currentAngle = GetUnitFacing(unit);
        //     var turnRate = AnglesDiff(angle, currentAngle);
        //     kitty.SetRemainingDegreesToTurn(turnRate);
        // }
        // else
        // {
        unit.Facing =  angle;
        // }
    }
}