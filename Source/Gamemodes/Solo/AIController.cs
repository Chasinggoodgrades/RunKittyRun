using Source;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Numerics;
using WCSharp.Api;
using static WCSharp.Api.Common;

public class AIController
{
    private Kitty kitty;
    private bool enabled;
    public float DODGE_RADIUS = 160.0f;
    public float REVIVE_RADIUS = 1024.0f;
    public float _timerInterval = 0.1f;
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
    public bool laser = Program.Debug;

    private string lastCommand = "";
    private float lastX;
    private float lastY;
    private bool hasLastOrder = false;
    private float lastOrderTime = 0f;
    private float elapsedTime = 0f;

    private timer moveTimer;
    private List<Wolf> wolvesInRange = new List<Wolf>();
    private lightning lastLightning;

    private int lastSafezoneIndexId = -1;
    private bool reachedLastSafezoneCenter = false;
    private List<lightning> availableLightnings = new List<lightning>();
    private List<lightning> usedLightnings = new List<lightning>();

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

        _ = DestroyLightning(lastLightning);
        lastLightning = null;

        HideAllLightnings();
    }

    public bool IsEnabled()
    {
        return enabled;
    }

    private void MoveKittyToPosition()
    {
        var currentSafezoneId = Globals.PLAYERS_CURRENT_SAFEZONE[this.kitty.Player];
        var currentSafezone = Globals.SAFE_ZONES[currentSafezoneId];
        var nextSafezone = (currentSafezoneId + 1 < Globals.SAFE_ZONES.Count - 1) ? Globals.SAFE_ZONES[currentSafezoneId + 1] : Globals.SAFE_ZONES[currentSafezoneId];
        var currentSafezoneCenter = GetCenterPositionInSafezone(currentSafezone);
        var nextSafezoneCenter = GetCenterPositionInSafezone(nextSafezone);

        if (currentSafezoneId != lastSafezoneIndexId)
        {
            reachedLastSafezoneCenter = false;
            lastSafezoneIndexId = currentSafezoneId;
        }

        var distanceToCurrentCenter = Math.Sqrt(Math.Pow(kitty.Unit.X - currentSafezoneCenter.X, 2) + Math.Pow(kitty.Unit.Y - currentSafezoneCenter.Y, 2));
        const float SAFEZONE_THRESHOLD = 128.0f;

        if (distanceToCurrentCenter <= SAFEZONE_THRESHOLD)
        {
            reachedLastSafezoneCenter = true;
        }

        var targetPosition = reachedLastSafezoneCenter ? nextSafezoneCenter : currentSafezoneCenter;

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

        if (wolvesInRange.Count > 0)
        {
            var dodgePosition = GetCompositeDodgePosition(wolvesInRange, ref forwardDirection);
            IssueOrder("move", dodgePosition.X, dodgePosition.Y, true);
            return;
        }
        else
        {
            HideAllLightnings();
        }

        var deltaX = targetPosition.X - kitty.Unit.X;
        var deltaY = targetPosition.Y - kitty.Unit.Y;
        var distance = (float)Math.Sqrt((deltaX * deltaX) + (deltaY * deltaY));
        if (distance > 256)
        {
            var scale = 256 / distance;
            var moveX = kitty.Unit.X + (deltaX * scale);
            var moveY = kitty.Unit.Y + (deltaY * scale);
            IssueOrder("move", moveX, moveY, false);
        }
        else
        {
            IssueOrder("move", targetPosition.X, targetPosition.Y, false);
        }
    }

    private bool IsWithinLaneBounds(float x, float y)
    {
        var currentSafezoneId = Globals.PLAYERS_CURRENT_SAFEZONE[this.kitty.Player];
        var laneBounds = WolfArea.WolfAreas[currentSafezoneId].Rectangle;
        return laneBounds.Contains(x, y);
    }

    private void IssueOrder(string command, float x, float y, bool isDodge)
    {
        float MIN_MOVE_DISTANCE = isDodge ? 16.0f : 64.0f;

        if (command == "move")
        {
            if (lastLightning != null)
            {
                _ = MoveLightning(lastLightning, false, this.kitty.Unit.X, this.kitty.Unit.Y, x, y);
            }
            else
            {
                if (this.laser)
                {
                    lastLightning = AddLightning("DRAM", false, this.kitty.Unit.X, this.kitty.Unit.Y, x, y);
                }
            }
        }

        float deltaX = x - lastX;
        float deltaY = y - lastY;
        float distanceSquared = (deltaX * deltaX) + (deltaY * deltaY);

        if (hasLastOrder && lastCommand == command && distanceSquared < MIN_MOVE_DISTANCE * MIN_MOVE_DISTANCE)
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
        _ = kitty.Unit.IssueOrder(command, x, y);
    }

    private void IssueOrderBasic(string command)
    {
        lastCommand = command;
        lastX = -1;
        lastY = -1;
        lastOrderTime = elapsedTime;
        hasLastOrder = true;
        _ = kitty.Unit.IssueOrder(command);
    }

    private (float X, float Y) GetCenterPositionInSafezone(Safezone safezone)
    {
        var centerX = (safezone.Rect_.MinX + safezone.Rect_.MaxX) / 2;
        var centerY = (safezone.Rect_.MinY + safezone.Rect_.MaxY) / 2;
        return (centerX, centerY);
    }

    private const float DODGE_DISTANCE = 128f;

    // Rewritten GetCompositeDodgePosition using a reusable struct array instead of creating new objects.
    private Vector2 GetCompositeDodgePosition(List<Wolf> wolves, ref (float X, float Y) forwardDirection)
    {
        float forwardAngle = MathF.Atan2(forwardDirection.Y, forwardDirection.X);
        List<AngleInterval> blockedIntervals = new List<AngleInterval>();

        // Calculate the angle interval that each wolf “blocks.”
        foreach (Wolf wolf in wolves)
        {
            float MIN_TOTAL_BLOCKED_ANGLE = MathF.PI / 4f;  // 45° total
            float MAX_TOTAL_BLOCKED_ANGLE = MathF.PI / 2f;  // 90° total

            if (!wolf.IsWalking)
            {
                MIN_TOTAL_BLOCKED_ANGLE = MathF.PI / 8f;  // 22.5° total
                MAX_TOTAL_BLOCKED_ANGLE = MathF.PI / 4f;  // 45° total
            }

            Vector2 toWolf = new Vector2(wolf.Unit.X - this.kitty.Unit.X, wolf.Unit.Y - this.kitty.Unit.Y);
            float distance = toWolf.Length();
            if (distance < 1)
                continue; // Skip if the wolf is at the same position to avoid division by zero

            float centerAngle = MathF.Atan2(toWolf.Y, toWolf.X);
            float combinedRadius = DODGE_RADIUS;
            float ratio = combinedRadius / distance;

            // Calculate the angle that would be blocked based solely on distance.
            float calculatedHalfAngle = MathF.Asin(ratio);

            // Normally the total blocked angle would be 2 * calculatedHalfAngle.
            // We clamp that value between our min and max, and then recompute the half-angle.
            float totalBlockedAngle = Math.Clamp(2 * calculatedHalfAngle, MIN_TOTAL_BLOCKED_ANGLE, MAX_TOTAL_BLOCKED_ANGLE);
            float halfAngle = totalBlockedAngle / 2f;

            // Create the interval [centerAngle - halfAngle, centerAngle + halfAngle]
            float start = NormalizeAngle(centerAngle - halfAngle);
            float end = NormalizeAngle(centerAngle + halfAngle);

            // If the interval wraps around 0, split it into two parts.
            if (start > end)
            {
                blockedIntervals.Add(new AngleInterval(start, 2f * MathF.PI));
                blockedIntervals.Add(new AngleInterval(0, end));
            }
            else
            {
                blockedIntervals.Add(new AngleInterval(start, end));
            }
        }

        // Merge any overlapping blocked intervals.
        List<AngleInterval> mergedIntervals = MergeIntervals(blockedIntervals);

        // Visualize the blocked intervals
        HideAllLightnings();
        foreach (var interval in mergedIntervals)
        {
            VisualizeBlockedInterval(interval);
        }

        // Determine free angular gaps on the circle.
        List<AngleInterval> freeGaps = new List<AngleInterval>();
        if (mergedIntervals.Count == 0)
        {
            // No wolves blocking any direction; entire circle is free.
            freeGaps.Add(new AngleInterval(0, 2f * MathF.PI));
        }
        else
        {
            // Ensure the merged intervals are sorted by their start angle.
            mergedIntervals.Sort((a, b) => a.Start.CompareTo(b.Start));

            // The gap between the end of the last interval and the start of the first (accounting for wrap-around).
            float wrapGap = (mergedIntervals[0].Start + 2f * MathF.PI) - mergedIntervals[mergedIntervals.Count - 1].End;
            if (wrapGap > 0)
            {
                freeGaps.Add(new AngleInterval(mergedIntervals[mergedIntervals.Count - 1].End, mergedIntervals[0].Start + 2f * MathF.PI));
            }
            // Gaps between consecutive intervals.
            for (int i = 0; i < mergedIntervals.Count - 1; i++)
            {
                float gapSize = mergedIntervals[i + 1].Start - mergedIntervals[i].End;
                if (gapSize > 0)
                    freeGaps.Add(new AngleInterval(mergedIntervals[i].End, mergedIntervals[i + 1].Start));
            }
        }

        // Pick the free gap whose center is closest to the forward angle.
        float bestScore = float.MaxValue;
        float bestAngle = forwardAngle; // Default to the forward direction.
        foreach (AngleInterval gap in freeGaps)
        {
            // Compute the center of the gap.
            float center = gap.Start + (gap.End - gap.Start) / 2f;
            center = NormalizeAngle(center);
            float diff = AngleDifference(center, forwardAngle);
            if (diff < bestScore)
            {
                bestScore = diff;
                bestAngle = center;
            }
        }

        // Update the forward direction to the chosen dodge direction.
        var forwardDirection2 = new Vector2(MathF.Cos(bestAngle), MathF.Sin(bestAngle));

        // Return the target dodge position (kitty's position plus 128f in the chosen direction).
        return new Vector2(kitty.Unit.X, kitty.Unit.Y) + forwardDirection2 * DODGE_DISTANCE;
    }

    private void VisualizeBlockedInterval(AngleInterval interval)
    {
        if (!laser)
        {
            return;
        }

        float radius = DODGE_RADIUS;
        float step = 0.1f; // Adjust step size for smoother lines
        for (float angle = interval.Start; angle < interval.End; angle += step)
        {
            float x1 = kitty.Unit.X + radius * MathF.Cos(angle);
            float y1 = kitty.Unit.Y + radius * MathF.Sin(angle);
            float x2 = kitty.Unit.X + radius * MathF.Cos(angle + step);
            float y2 = kitty.Unit.Y + radius * MathF.Sin(angle + step);

            //
            lightning freeLightning = null;

            if (availableLightnings.Count > 0)
            {
                freeLightning = availableLightnings[availableLightnings.Count - 1];
                availableLightnings.RemoveAt(availableLightnings.Count - 1);
            }

            if (freeLightning == null)
            {
                freeLightning = AddLightning("DRAM", false, x1, y1, x2, y2);
            }

            usedLightnings.Add(freeLightning);
            MoveLightning(freeLightning, false, x1, y1, x2, y2);
        }
    }

    private void HideAllLightnings()
    {
        foreach (var lightning in usedLightnings)
        {
            MoveLightning(lightning, false, 0.0f, 0.0f, 0.0f, 0.0f);
            availableLightnings.Add(lightning);
        }

        usedLightnings.Clear();
    }

    /// <summary>
    /// Normalizes an angle (in radians) to the range [0, 2π).
    /// </summary>
    private float NormalizeAngle(float angle)
    {
        while (angle < 0)
            angle += 2f * MathF.PI;
        while (angle >= 2f * MathF.PI)
            angle -= 2f * MathF.PI;
        return angle;
    }

    /// <summary>
    /// Returns the smallest difference (in radians) between two angles.
    /// </summary>
    private float AngleDifference(float a, float b)
    {
        float diff = MathF.Abs(a - b);
        if (diff > MathF.PI)
            diff = 2f * MathF.PI - diff;
        return diff;
    }

    /// <summary>
    /// Merges overlapping angular intervals.
    /// </summary>
    private List<AngleInterval> MergeIntervals(List<AngleInterval> intervals)
    {
        if (intervals.Count == 0)
            return intervals;

        intervals.Sort((a, b) => a.Start.CompareTo(b.Start));
        List<AngleInterval> merged = new List<AngleInterval>();
        AngleInterval current = intervals[0];

        for (int i = 1; i < intervals.Count; i++)
        {
            if (intervals[i].Start <= current.End)
            {
                // Extend the current interval if needed.
                current.End = MathF.Max(current.End, intervals[i].End);
            }
            else
            {
                merged.Add(current);
                current = intervals[i];
            }
        }
        merged.Add(current);
        return merged;
    }

    /// <summary>
    /// Helper class representing an angular interval [Start, End] in radians.
    /// </summary>
    private class AngleInterval
    {
        public float Start;
        public float End;

        public AngleInterval(float start, float end)
        {
            Start = start;
            End = end;
        }
    }

    private void AddWallRepulsionStruct(float distance, float nx, float ny, ClusterData[] clusters, float binSize)
    {
        float wallThreshold = 20f;
        float wallRepulsionConstant = 1000f;

        if (distance < wallThreshold && distance > 0)
        {
            float weight = (float)Math.Sqrt(wallRepulsionConstant / distance);
            float angle = (float)Math.Atan2(ny, nx);
            int bin = (int)Math.Round(angle / binSize);
            int index = bin + 4;
            if (!clusters[index].Exists || weight > clusters[index].Weight)
            {
                clusters[index].Exists = true;
                clusters[index].DirX = nx;
                clusters[index].DirY = ny;
                clusters[index].Weight = weight;
            }
        }
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

        if (!Blizzard.UnitHasBuffBJ(kitty.Unit, FourCC("BOwk")))
        {
            IssueOrderBasic("windwalk");
        }
    }
}

// Define a struct for cluster data to avoid per-call allocations.
public class ClusterData : IDestroyable
{
    public float DirX;
    public float DirY;
    public float Weight;
    public bool Exists;

    public ClusterData()
    {
        DirX = 0f;
        DirY = 0f;
        Weight = 0f;
        Exists = false;
    }

    public void __destroy(bool recursive = false)
    {
        MemoryHandler.DestroyObject(this);
    }
}
