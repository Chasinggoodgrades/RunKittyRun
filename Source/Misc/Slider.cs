using System;
using System.Collections.Generic;
using System.Linq;
using WCSharp.Api;
using static WCSharp.Api.Common;

public class Slider
{
    private const float SLIDE_INTERVAL = 0.0075f;
    private const float SLIDE_ANGLE_PER_PERIOD = 0.3f;
    private const float ITEM_PICKUP_RADIUS = 48;

    private Kitty kitty;
    private timer SliderTimer;
    private bool enabled;

    private trigger ClickTrigger { get; set; }
    private trigger WidgetTrigger { get; set; }

    private float remainingDegreesToTurn = 0;
    private float slideCurrentTurnPerPeriod = 0;

    private bool isMirror = false;
    private bool wasSliding = false;
    private float? forcedSlideSpeed = null;
    private timer ForcedSlideTimer;

    // percentage of maximum speed
    private Dictionary<int, float> SPEED_AT_LEAST_THAN_50_DEGREES = new Dictionary<int, float>()
    {
    {51, 92.721f},
    {50, 91.655f},
    {49, 90.588f},
    {48, 89.522f},
    {47, 88.455f},
    {46, 87.389f},
    {45, 86.322f},
    {44, 85.255f},
    {43, 84.189f},
    {42, 83.646f},
    {41, 82.192f},
    {40, 80.737f},
    {39, 79.283f},
    {38, 77.828f},
    {37, 76.374f},
    {36, 74.919f},
    {35, 74.854f},
    {34, 73.439f},
    {33, 72.023f},
    {32, 70.607f},
    {31, 69.192f},
    {30, 67.776f},
    {29, 66.360f},
    {28, 66.357f},
    {27, 64.719f},
    {26, 63.081f},
    {25, 61.442f},
    {24, 59.804f},
    {23, 58.165f},
    {22, 58.165f},
    {21, 56.590f},
    {20, 55.015f},
    {19, 53.440f},
    {18, 51.866f},
    {17, 50.291f},
    {16, 48.783f},
    {15, 47.275f},
    {14, 45.767f},
    {13, 44.260f},
    {12, 42.750f},
    {11, 40.355f},
    {10, 37.960f},
    {9, 35.560f},
    {8, 31.698f},
    {7, 27.837f},
    {6, 23.975f},
    {5, 13.943f},
    {4, 9.091f},
    {3, 6.366f},
    {2, 2.800f},
    {1, 1.837f},
    {0, 1.5f},
    };

    public Slider(Kitty kitty)
    {
        this.kitty = kitty;
        SliderTimer = timer.Create();
        ForcedSlideTimer = timer.Create();
        enabled = false;
        RegisterClickEvent();
    }

    public bool IsEnabled()
    {
        return enabled;
    }

    public bool IsMirror()
    {
        return isMirror;
    }

    public void ToggleMirror()
    {
        isMirror = !isMirror;
    }

    public void StartSlider()
    {
        enabled = true;
        ResumeSlider(false);
    }

    public void ResumeSlider(bool isRevive)
    {
        if (!enabled)
        {
            return;
        }

        ClickTrigger.Enable();
        WidgetTrigger.Enable();

        if (isRevive)
        {
            this.forcedSlideSpeed = 0;
            this.kitty.Invulnerable = true;

            this.ForcedSlideTimer.Start(1.4f, false, ErrorHandler.Wrap(() =>
            {
                this.forcedSlideSpeed = null;

                this.ForcedSlideTimer.Start(0.6f, false, ErrorHandler.Wrap(() =>
                {
                    this.kitty.Invulnerable = false;
                }));
            }));
        }

        SliderTimer.Start(SLIDE_INTERVAL, true, ErrorHandler.Wrap(() =>
        {
            if (!IsOnSlideTerrain())
            {
                if (this.wasSliding && this.isMirror)
                {
                    // Reverse hero
                    BlzSetUnitFacingEx(kitty.Unit, GetUnitFacing(kitty.Unit) + 180);
                }

                this.wasSliding = false;
                return;
            }

            if (!this.wasSliding && this.isMirror)
            {
                // Reverse hero
                BlzSetUnitFacingEx(kitty.Unit, GetUnitFacing(kitty.Unit) + 180);
            }

            this.wasSliding = true;
            UpdateSlider();
        }));
    }

    public void PauseSlider()
    {
        ClickTrigger.Disable();
        WidgetTrigger.Disable();
        SliderTimer.Pause();
        ForcedSlideTimer.Pause();
        this.forcedSlideSpeed = null;
        this.kitty.Invulnerable = false;
        remainingDegreesToTurn = 0;
        slideCurrentTurnPerPeriod = 0;
        this.wasSliding = false;
    }

    public void StopSlider()
    {
        enabled = false;
        this.PauseSlider();
    }

    public bool IsOnSlideTerrain()
    {
        return !TerrainChanger.SafezoneTerrain.Contains(GetTerrainType(kitty.Unit.X, kitty.Unit.Y));
    }

    private void UpdateSlider()
    {
        float slideSpeed = this.forcedSlideSpeed ?? ((this.isMirror ? -1 : 1) * GetUnitMoveSpeed(kitty.Unit));
        float slidePerTick = slideSpeed * SLIDE_INTERVAL;

        float angle = Rad2Deg(kitty.Unit.Facing);

        float oldX = kitty.Unit.X;
        float oldY = kitty.Unit.Y;

        escaperTurnForOnePeriod();

        float newX = oldX + (slidePerTick * Cos(angle));
        float newY = oldY + (slidePerTick * Sin(angle));

        if (IsTerrainPathable(newX, oldY, PATHING_TYPE_WALKABILITY))
        {
            newX = oldX;
        }

        if (IsTerrainPathable(oldX, newY, PATHING_TYPE_WALKABILITY))
        {
            newY = oldY;
        }

        kitty.Unit.SetPosition(newX, newY);
        ItemPickup();
    }

    private void RegisterClickEvent()
    {
        ClickTrigger = trigger.Create();
        ClickTrigger.RegisterUnitEvent(kitty.Unit, unitevent.IssuedPointOrder);
        ClickTrigger.AddAction(ErrorHandler.Wrap(() => HandleTurn(true)));

        WidgetTrigger = trigger.Create();
        WidgetTrigger.RegisterUnitEvent(kitty.Unit, unitevent.IssuedTargetOrder);
        WidgetTrigger.AddAction(ErrorHandler.Wrap(() => HandleTurn(false)));

        ClickTrigger.Disable();
        WidgetTrigger.Disable();
    }

    private void HandleTurn(bool isToLocation)
    {
        if (!IsEnabled()) return;
        var unit = @event.Unit;
        float angle;
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

        // if (kitty.SlidingMode == "max")
        // {
        var currentAngle = GetUnitFacing(unit);
        this.setRemainingDegreesToTurn(AnglesDiff(angle, currentAngle));
        // }
        // else
        // {
        // SetUnitFacing(unit, angle);
        // }
    }

    public float ForceAngleBetween0And360(float angle)
    {
        while (angle < 0) angle += 360;
        while (angle >= 360) angle -= 360;
        return angle;
    }

    private int AnglesDiff(float endAngle, float startAngle)
    {
        endAngle = ForceAngleBetween0And360(endAngle);
        startAngle = ForceAngleBetween0And360(startAngle);

        var anglesDiff = endAngle - startAngle;
        if (anglesDiff < -180) anglesDiff += 360;
        if (anglesDiff > 180) anglesDiff -= 360;

        return (int)anglesDiff;
    }

    private void setRemainingDegreesToTurn(float remainingDegreesToTurn)
    {
        if (Blizzard.RAbsBJ(remainingDegreesToTurn) < 0.01) remainingDegreesToTurn = 0;
        this.remainingDegreesToTurn = remainingDegreesToTurn;
    }

    private void escaperTurnForOnePeriod()
    {
        float rotationSpeed = 1.3f;
        float maxSlideTurnPerPeriod = rotationSpeed * SLIDE_INTERVAL * 360;
        float rotationTimeForMaximumSpeed = 0.11f;
        int MAX_DEGREE_ON_WHICH_SPEED_TABLE_TAKES_CONTROL = 51;

        float remainingDegrees = this.remainingDegreesToTurn;
        if (remainingDegrees != 0)
        {
            float currentAngle = GetUnitFacing(kitty.Unit);

            float diffToApplyAbs = Math.Min(Math.Abs(remainingDegrees), Math.Abs(maxSlideTurnPerPeriod));

            if (diffToApplyAbs > 0.05f)
            {
                int sens = remainingDegrees * maxSlideTurnPerPeriod > 0 ? 1 : -1;
                float maxIncreaseRotationSpeedPerPeriod = Math.Abs(maxSlideTurnPerPeriod * SLIDE_INTERVAL / rotationTimeForMaximumSpeed);

                float newSlideTurn;
                float curSlideTurn = slideCurrentTurnPerPeriod;
                float increaseRotationSpeedPerPeriod = maxIncreaseRotationSpeedPerPeriod;
                float diffToApply;

                if (Math.Abs(remainingDegrees) <= MAX_DEGREE_ON_WHICH_SPEED_TABLE_TAKES_CONTROL)
                {
                    int tableInd = (int)Math.Round((float)Math.Abs(remainingDegrees));
                    float aimedSpeedPercentage = SPEED_AT_LEAST_THAN_50_DEGREES[tableInd];
                    float aimedNewSpeedPerPeriod = maxSlideTurnPerPeriod * aimedSpeedPercentage * sens / 100;
                    float diffSpeed = aimedNewSpeedPerPeriod - curSlideTurn;
                    if (Math.Abs(diffSpeed) < maxIncreaseRotationSpeedPerPeriod)
                    {
                        diffToApply = aimedNewSpeedPerPeriod;
                    }
                    else
                    {
                        int sensDiffToApply = diffSpeed > 0 ? 1 : -1;
                        diffToApply = curSlideTurn + (sensDiffToApply * maxIncreaseRotationSpeedPerPeriod);
                    }
                    slideCurrentTurnPerPeriod = diffToApply;
                }
                else
                {
                    if (sens > 0)
                    {
                        newSlideTurn = Math.Min(curSlideTurn + increaseRotationSpeedPerPeriod, maxSlideTurnPerPeriod);
                        diffToApply = Math.Min(newSlideTurn, diffToApplyAbs);
                        diffToApply = Math.Min(remainingDegrees, diffToApply);
                    }
                    else
                    {
                        newSlideTurn = Math.Max(curSlideTurn - increaseRotationSpeedPerPeriod, -maxSlideTurnPerPeriod);
                        diffToApply = Math.Max(newSlideTurn, -diffToApplyAbs);
                        diffToApply = Math.Max(remainingDegrees, diffToApply);
                    }
                    slideCurrentTurnPerPeriod = newSlideTurn;
                }

                this.setRemainingDegreesToTurn(remainingDegrees - diffToApply);

                float newAngle = currentAngle + diffToApply;
                BlzSetUnitFacingEx(kitty.Unit, newAngle);
            }
        }
    }

    private void ItemPickup()
    {
        if (!enabled) return;

        foreach (var i in ItemSpawner.TrackKibbles)
        {
            if (i.Item == null) continue;
            if (WCSharp.Shared.Util.DistanceBetweenPoints(i.Item.X, i.Item.Y, kitty.Unit.X, kitty.Unit.Y) > ITEM_PICKUP_RADIUS) continue;
            kitty.Unit.AddItem(i.Item);
            break;
        }
        foreach (var item in ItemSpawner.TrackItems)
        {
            if (item == null) continue;
            if (item.IsOwned) continue;
            if (WCSharp.Shared.Util.DistanceBetweenPoints(item.X, item.Y, kitty.Unit.X, kitty.Unit.Y) > ITEM_PICKUP_RADIUS) continue;
            kitty.Unit.AddItem(item);
            break;
        }
    }
}
