using System;
using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public class AIController
{
    private Kitty kitty;
    private bool enabled;
    public float DODGE_RADIUS = 160.0f;
    public float REVIVE_RADIUS = 1024.0f;
    public float _timerInterval = 0.2f;
    public float timerInterval
    {
        get { return _timerInterval; }
        set
        {
            _timerInterval = value;
            if (this.IsEnabled())
            {
                this.PauseAi();
                this.ResumeAi();
            }
        }
    }

    private string lastCommand = "";
    private float lastX;
    private float lastY;
    private bool hasLastOrder = false;
    private float lastOrderTime = 0f;
    private float elapsedTime = 0f;

    private timer moveTimer;
    private List<Wolf> wolvesInRange = new List<Wolf>();
    private lightning lastLightning;

    public AIController(Kitty kitty)
    {
        this.kitty = kitty;
        enabled = false;
    }

    public void StartAi()
    {
        enabled = true;
        ResumeAi();
    }

    public void ResumeAi()
    {
        if (!enabled)
            return;

        if (moveTimer == null)
        {
            moveTimer = CreateTimer();
            TimerStart(moveTimer, this.timerInterval, true, PollMovement);
        }
    }

    public void StopAi()
    {
        enabled = false;
        PauseAi();
    }

    public void PauseAi()
    {
        lastCommand = "";
        lastX = 0;
        lastY = 0;
        hasLastOrder = false;
        lastOrderTime = 0f;
        elapsedTime = 0f;

        if (moveTimer != null)
        {
            PauseTimer(moveTimer);
            DestroyTimer(moveTimer);
            moveTimer = null;
        }

        DestroyLightning(lastLightning);
        lastLightning = null;
    }

    public bool IsEnabled()
    {
        return enabled;
    }

    private void MoveKittyToPosition()
    {
        var currentSafezoneId = Globals.PLAYERS_CURRENT_SAFEZONE[this.kitty.Player];

        var nextSafezone = Globals.SAFE_ZONES[Globals.PLAYERS_CURRENT_SAFEZONE[this.kitty.Player] + 1];
        var targetPosition = GetCenterPositionInSafezone(nextSafezone);

        // Check for nearby circles to revive allies.
        foreach (var circle in Globals.ALL_CIRCLES)
        {
            var deadKitty = Globals.ALL_KITTIES[circle.Value.Player];
            var deadKittySafezoneId = Globals.PLAYERS_CURRENT_SAFEZONE[deadKitty.Player];

            if (deadKittySafezoneId != currentSafezoneId)
                continue;

            if (!deadKitty.Alive && IsWithinRadius(kitty.Unit.X, kitty.Unit.Y, circle.Value.Unit.X, circle.Value.Unit.Y, REVIVE_RADIUS))
            {
                targetPosition = (circle.Value.Unit.X, circle.Value.Unit.Y);
                break;
            }
        }

        var wolvesInLane = WolfArea.WolfAreas[currentSafezoneId].Wolves;

        wolvesInRange.Clear();
        foreach (var wolf in wolvesInLane)
        {
            if (IsWithinRadius(kitty.Unit.X, kitty.Unit.Y, wolf.Unit.X, wolf.Unit.Y, DODGE_RADIUS))
            {
                wolvesInRange.Add(wolf);
            }
        }

        var forwardDirection = (X: targetPosition.X - kitty.Unit.X, Y: targetPosition.Y - kitty.Unit.Y);

        // If any wolves are in range, calculate a dodge position using the combined forward direction.
        if (wolvesInRange.Count > 0)
        {
            var dodgePosition = GetCompositeDodgePosition(wolvesInRange, forwardDirection);
            IssueOrder("move", dodgePosition.X, dodgePosition.Y);
            return;
        }

        // Otherwise, move toward the target safezone center
        var deltaX = targetPosition.X - kitty.Unit.X;
        var deltaY = targetPosition.Y - kitty.Unit.Y;
        var distance = (float)Math.Sqrt(deltaX * deltaX + deltaY * deltaY);
        if (distance > 256)
        {
            var scale = 256 / distance;
            var moveX = kitty.Unit.X + deltaX * scale;
            var moveY = kitty.Unit.Y + deltaY * scale;
            IssueOrder("move", moveX, moveY);
        }
        else
        {
            IssueOrder("move", targetPosition.X, targetPosition.Y);
        }
    }

    // Helper to check if a given point is within the lane bounds.
    private bool IsWithinLaneBounds(float x, float y)
    {
        var currentSafezoneId = Globals.PLAYERS_CURRENT_SAFEZONE[this.kitty.Player];
        var laneBounds = WolfArea.WolfAreas[currentSafezoneId].Rectangle;
        return laneBounds.Contains(x, y);
    }

    // IssueOrder now clamps the target point to lane bounds before sending the order.
    private void IssueOrder(string command, float x, float y)
    {
        if (command == "move")
        {
            if (lastLightning != null)
            {
                MoveLightning(lastLightning, false, this.kitty.Unit.X, this.kitty.Unit.Y, x, y);
            }
            else
            {
                lastLightning = AddLightning("DRAM", false, this.kitty.Unit.X, this.kitty.Unit.Y, x, y);
            }
        }

        if (hasLastOrder && lastCommand == command && lastX == x && lastY == y)
        {
            if ((elapsedTime - lastOrderTime) < 4f)
            {
                return;
            }
        }

        lastCommand = command;
        lastX = x;
        lastY = y;
        lastOrderTime = elapsedTime;
        hasLastOrder = true;
        kitty.Unit.IssueOrder(command, x, y);
    }

    private void IssueOrderBasic(string command)
    {
        lastCommand = command;
        lastX = -1;
        lastY = -1;
        lastOrderTime = elapsedTime;
        hasLastOrder = true;
        kitty.Unit.IssueOrder(command);
    }

    private (float X, float Y) GetCenterPositionInSafezone(Safezone safezone)
    {
        var centerX = (safezone.Rect_.MinX + safezone.Rect_.MaxX) / 2;
        var centerY = (safezone.Rect_.MinY + safezone.Rect_.MaxY) / 2;
        return (centerX, centerY);
    }

    // Computes a composite dodge position based on all wolves in range.
    private (float X, float Y) GetCompositeDodgePosition(List<Wolf> wolves, (float X, float Y) forwardDirection)
    {
        float compositeX = 0f;
        float compositeY = 0f;
        int count = 0;
        foreach (var wolf in wolves)
        {
            float dx = kitty.Unit.X - wolf.Unit.X;
            float dy = kitty.Unit.Y - wolf.Unit.Y;
            float dist = (float)Math.Sqrt((dx * dx) + (dy * dy));
            if (dist > 0)
            {
                // Weight by the inverse of distance so that nearer wolves contribute more
                float weight = 1f / dist;
                // Sum the normalized direction away from each wolf, scaled by weight
                compositeX += (dx / dist) * weight;
                compositeY += (dy / dist) * weight;
                count++;
            }
        }

        // If no wolves are nearby, simply move forward.
        if (count == 0)
        {
            return (kitty.Unit.X + (forwardDirection.X * DODGE_RADIUS),
                    kitty.Unit.Y + (forwardDirection.Y * DODGE_RADIUS));
        }

        // Normalize the dodge direction vector.
        float dodgeMagnitude = (float)Math.Sqrt((compositeX * compositeX) + (compositeY * compositeY));
        if (dodgeMagnitude == 0)
        {
            // Rare case: perfect cancellation. Default to an arbitrary direction.
            compositeX = 1;
            compositeY = 0;
            dodgeMagnitude = 1;
        }
        compositeX /= dodgeMagnitude;
        compositeY /= dodgeMagnitude;

        // Ensure the forwardDirection is normalized.
        float forwardMagnitude = (float)Math.Sqrt((forwardDirection.X * forwardDirection.X) + (forwardDirection.Y * forwardDirection.Y));
        if (forwardMagnitude == 0)
        {
            forwardDirection = (1, 0);
            forwardMagnitude = 1;
        }
        var normForward = (X: forwardDirection.X / forwardMagnitude, Y: forwardDirection.Y / forwardMagnitude);

        // Blend the dodge vector and the forward direction.
        float dodgeWeight = 0.7f;
        float forwardWeight = 0.3f;
        float combinedX = (dodgeWeight * compositeX) + (forwardWeight * normForward.X);
        float combinedY = (dodgeWeight * compositeY) + (forwardWeight * normForward.Y);

        // Normalize the combined direction.
        float combinedMagnitude = (float)Math.Sqrt((combinedX * combinedX) + (combinedY * combinedY));
        if (combinedMagnitude == 0)
        {
            combinedX = 1;
            combinedY = 0;
            combinedMagnitude = 1;
        }
        combinedX /= combinedMagnitude;
        combinedY /= combinedMagnitude;

        // Calculate and return the final position by moving along the combined direction.
        float resultX = kitty.Unit.X + (combinedX * DODGE_RADIUS);
        float resultY = kitty.Unit.Y + (combinedY * DODGE_RADIUS);
        return (resultX, resultY);
    }

    private bool IsWithinRadius(float x1, float y1, float x2, float y2, float radius)
    {
        var distance = Math.Sqrt(((x2 - x1) * (x2 - x1)) + ((y2 - y1) * (y2 - y1)));
        return distance <= radius;
    }

    private void PollMovement()
    {
        try
        {
            if (!enabled) return;
            elapsedTime += timerInterval;
            LearnSkills();
            UseWindWalkIfAvailable();
            MoveKittyToPosition();
        }
        catch (Exception e)
        {
            Console.WriteLine(e.Message);
        }
    }

    private void LearnSkills()
    {
        if (kitty.Unit.SkillPoints > 0)
        {
            kitty.Unit.SelectHeroSkill(Constants.ABILITY_WIND_WALK);
            kitty.Unit.SelectHeroSkill(Constants.ABILITY_AGILITY_AURA);
            kitty.Unit.SelectHeroSkill(Constants.ABILITY_ENERGY_AURA);
        }
    }

    private void UseWindWalkIfAvailable()
    {
        var wwLvl = GetUnitAbilityLevel(kitty.Unit, Constants.ABILITY_WIND_WALK);

        if (wwLvl == 0 || (wwLvl == 1 && kitty.Unit.Mana < 75) || (wwLvl == 2 && kitty.Unit.Mana < 60) || (wwLvl == 3 && kitty.Unit.Mana < 45))
        {
            return;
        }

        if (!Blizzard.UnitHasBuffBJ(kitty.Unit, FourCC("BOwk"))) // Wind Walk
        {
            IssueOrderBasic("windwalk");
            MoveKittyToPosition();
        }
    }
}
