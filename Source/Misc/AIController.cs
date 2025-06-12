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
    public float DODGE_RADIUS = 192.0f;
    public float DODGE_RADIUS_STILL = 128.0f;
    private const float DODGE_DISTANCE = 128f; // Amount to walk away
    public static string FREE_LASER_COLOR = "GRSB";
    public static string BLOCKED_LASER_COLOR = "RESB";
    private static int WindwalkID = FourCC("BOwk");
    private static float[] offsets = { -90f, -45f, 0.0f, 45f, 90f };
    public float _timerInterval = 0.1f;
    public float timerInterval
    {
        get { return _timerInterval; }
        set
        {
            _timerInterval = Math.Max(value, 0.01f);

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

    private int? lastSafeZoneIndexId = null;
    private bool reachedLastProgressZoneCenter = false;
    private List<lightning> availableBlockedLightnings = new List<lightning>();
    private List<lightning> availableClearLightnings = new List<lightning>();
    private List<lightning> usedBlockedLightnings = new List<lightning>();
    private List<lightning> usedClearLightnings = new List<lightning>();
    private List<AngleInterval> blockedIntervals = new List<AngleInterval>();
    private List<AngleInterval> freeGaps = new List<AngleInterval>();
    private List<AngleInterval> mergedIntervals = new List<AngleInterval>();
    private static Dictionary<Kitty, Kitty> claimedKitties = new Dictionary<Kitty, Kitty>();
    private List<Point> wallPoints = new List<Point>();


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
            TimerStart(moveTimer, this.timerInterval, true, ErrorHandler.Wrap(PollMovement));
        }

        // If I revive release me from the claimedKitties
        if (claimedKitties.ContainsKey(this.kitty))
        {
            claimedKitties.Remove(claimedKitties.FirstOrDefault(x => x.Key == this.kitty).Key);
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

        HideAllLightnings();
        HideAllFreeLightnings();

        // If I die release my target from the claimedKitties
        if (claimedKitties.ContainsValue(this.kitty))
        {
            claimedKitties.Remove(claimedKitties.FirstOrDefault(x => x.Value == this.kitty).Key);
        }
    }

    public bool IsEnabled()
    {
        return enabled;
    }

    private int CalcProgressZone(Kitty kitty)
    {
        var currentProgressZoneId = kitty.ProgressZone;

        if (IsInSafeZone(kitty.Unit.X, kitty.Unit.Y, currentProgressZoneId + 1))
        {
            currentProgressZoneId++;
        }

        return currentProgressZoneId;
    }

    private void MoveKittyToPosition()
    {
        var currentProgressZoneId = CalcProgressZone(this.kitty);
        var currentSafezone = Globals.SAFE_ZONES[currentProgressZoneId];
        var nextSafezone = (currentProgressZoneId + 1 < Globals.SAFE_ZONES.Count - 1) ? Globals.SAFE_ZONES[currentProgressZoneId + 1] : currentSafezone;
        var currentSafezoneCenter = GetCenterPositionInSafezone(currentSafezone);
        var nextSafezoneCenter = GetCenterPositionInSafezone(nextSafezone);

        int? currentSafeZoneId = IsInSafeZone(this.kitty.Unit.X, this.kitty.Unit.Y, currentProgressZoneId) ? currentProgressZoneId : null;

        if (currentSafeZoneId != lastSafeZoneIndexId)
        {
            reachedLastProgressZoneCenter = currentSafeZoneId == null;
            lastSafeZoneIndexId = currentSafeZoneId;
        }

        var distanceToCurrentCenter = Math.Sqrt(Math.Pow(kitty.Unit.X - currentSafezoneCenter.X, 2) + Math.Pow(kitty.Unit.Y - currentSafezoneCenter.Y, 2));
        const float SAFEZONE_THRESHOLD = 128.0f;

        if (distanceToCurrentCenter <= SAFEZONE_THRESHOLD)
        {
            reachedLastProgressZoneCenter = true;
        }

        bool allKittiesAtSameOrHigherSafezone = true; // IEnumberable is dog shit for C# -> Lua conversion, this should -help-
        foreach (var k in Globals.ALL_KITTIES)
        {
            if (Program.Debug && k.Value.Player == Player(0))
            {
                continue;
            }

            if (CalcProgressZone(k.Value) < currentProgressZoneId)
            {
                allKittiesAtSameOrHigherSafezone = false;
                break;
            }
        }

        var targetPosition = reachedLastProgressZoneCenter && allKittiesAtSameOrHigherSafezone ? nextSafezoneCenter : currentSafezoneCenter;

        foreach (var circle in Globals.ALL_CIRCLES)
        {
            var deadKitty = Globals.ALL_KITTIES[circle.Value.Player];
            var deadKittyProgressZoneId = CalcProgressZone(deadKitty);

            if (deadKittyProgressZoneId > currentProgressZoneId)
            {
                continue;
            }

            if (deadKitty == this.kitty)
            {
                continue;
            }

            if (!deadKitty.Alive)
            {
                if (!claimedKitties.ContainsKey(deadKitty))
                {
                    double thisDistance = Math.Sqrt(Math.Pow(this.kitty.Unit.X - deadKitty.Unit.X, 2) + Math.Pow(this.kitty.Unit.Y - deadKitty.Unit.Y, 2));
                    int thisLaneDiff = Math.Abs(currentProgressZoneId - deadKittyProgressZoneId);

                    bool isNearest = true;

                    foreach (var otherKitty in Globals.ALL_KITTIES)
                    {
                        if (Program.Debug && otherKitty.Value.Player == Player(0))
                        {
                            continue;
                        }

                        if (otherKitty.Value != this.kitty && otherKitty.Value.Alive)
                        {
                            double otherDistance = Math.Sqrt(Math.Pow(otherKitty.Value.Unit.X - deadKitty.Unit.X, 2) + Math.Pow(otherKitty.Value.Unit.Y - deadKitty.Unit.Y, 2));
                            int otherLaneDiff = Math.Abs(CalcProgressZone(otherKitty.Value) - deadKittyProgressZoneId);

                            // Prioritize by lane difference first, then by distance.
                            // Don't think this works for some reason..
                            if (otherLaneDiff < thisLaneDiff || (otherLaneDiff == thisLaneDiff && otherDistance < thisDistance))
                            {
                                isNearest = false;
                                break;
                            }
                        }
                    }

                    if (isNearest)
                    {
                        claimedKitties[deadKitty] = this.kitty;
                    }
                }

                if (claimedKitties.ContainsKey(deadKitty) && claimedKitties[deadKitty] == this.kitty)
                {
                    if (deadKittyProgressZoneId != currentProgressZoneId)
                    {
                        if (IsInSafeZone(this.kitty.Unit.X, this.kitty.Unit.Y, currentProgressZoneId) && reachedLastProgressZoneCenter)
                        {
                            targetPosition = (currentProgressZoneId - 1 >= 0) ? GetCenterPositionInSafezone(Globals.SAFE_ZONES[currentProgressZoneId - 1]) : currentSafezoneCenter;
                        }
                        else
                        {
                            targetPosition = currentSafezoneCenter;
                        }

                        break;
                    }

                    targetPosition = (circle.Value.Unit.X, circle.Value.Unit.Y);
                    break;
                }
            }
        }

        var wolvesInLane = WolfArea.WolfAreas[currentProgressZoneId].Wolves;

        wolvesInRange.Clear();
        for (int i = 0; i < wolvesInLane.Count; i++)
        {
            var wolf = wolvesInLane[i];
            if (IsWithinRadius(kitty.Unit.X, kitty.Unit.Y, wolf.Unit.X, wolf.Unit.Y, wolf.IsWalking ? DODGE_RADIUS : DODGE_RADIUS_STILL))
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
            HideAllFreeLightnings();
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
        var currentProgressZoneId = this.kitty.ProgressZone;
        var laneBounds = WolfArea.WolfAreas[currentProgressZoneId].Rectangle;

        // Assume a vertical lane if its width is less than its height.
        if (laneBounds.Width < laneBounds.Height)
        {
            // Vertical lane: check only the y coordinate.
            return (x >= laneBounds.Left) && (x <= laneBounds.Right);
        }
        else
        {
            // Horizontal lane: check only the x coordinate.
            return (y >= laneBounds.Bottom) && (y <= laneBounds.Top);
        }
    }

    private bool IsInSafeZone(float x, float y, int safeZoneId)
    {
        if (safeZoneId < 0 || safeZoneId >= Globals.SAFE_ZONES.Count)
        {
            return false; // prevent out of bounds errors xd
        }
        var safezone = Globals.SAFE_ZONES[safeZoneId];

        return x >= safezone.Rect_.MinX && x <= safezone.Rect_.MaxX && y >= safezone.Rect_.MinY && y <= safezone.Rect_.MaxY;
    }

    private void IssueOrder(string command, float x, float y, bool isDodge)
    {
        float MIN_MOVE_DISTANCE = isDodge ? 16.0f : 64.0f;

        if (command == "move")
        {
            if (lastLightning != null)
            {
                MoveLightning(lastLightning, false, this.kitty.Unit.X, this.kitty.Unit.Y, x, y);
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

    /**
	* For the wall to be within range of the kitty, basically what has to happen is that a line passes through the circle at two points. 
	* Using the mathematical formula for a line passing through two points on a circle, this can be calculated.
	*/
    void CalcCrossingPoints()
    {
        for (int i = 0; i < wallPoints.Count; i++)
        {
            var point = wallPoints[i];
            point.Dispose();
        }

        wallPoints.Clear();

        var dodgeRange = (DODGE_DISTANCE * (timerInterval + 0.2f));
        var currentProgressZoneId = this.kitty.ProgressZone;
        var laneBounds = WolfArea.WolfAreas[currentProgressZoneId].Rectangle;
        bool isVertical = laneBounds.Width < laneBounds.Height;

        if (isVertical)
        {
            // Handle vertical walls (left/right) as before.
            float constant = float.NaN;
            if (this.kitty.Unit.X - dodgeRange < laneBounds.Left)
                constant = laneBounds.Left;
            else if (this.kitty.Unit.X + dodgeRange > laneBounds.Right)
                constant = laneBounds.Right;
            else
                return;

            float relativeY = (float)Math.Sqrt((dodgeRange * dodgeRange) - Math.Pow(this.kitty.Unit.X - constant, 2));
            if (!float.IsNaN(relativeY) && relativeY != 0)
            {
                var a = ObjectPool.GetEmptyObject<Point>();
                a.X = constant;
                a.Y = relativeY + this.kitty.Unit.Y;
                wallPoints.Add(a);

                var b = ObjectPool.GetEmptyObject<Point>();
                b.X = constant;
                b.Y = -relativeY + this.kitty.Unit.Y;
                wallPoints.Add(b);
            }
        }
        else
        {
            float constant = float.NaN;
            if (this.kitty.Unit.Y + dodgeRange > laneBounds.Top)
                constant = laneBounds.Top;
            else if (this.kitty.Unit.Y - dodgeRange < laneBounds.Bottom)
                constant = laneBounds.Bottom;
            else
                return;

            float relativeX = (float)Math.Sqrt((dodgeRange * dodgeRange) - Math.Pow(this.kitty.Unit.Y - constant, 2));
            if (!float.IsNaN(relativeX) && relativeX != 0)
            {
                var a = ObjectPool.GetEmptyObject<Point>();
                a.X = relativeX + this.kitty.Unit.X;
                a.Y = constant;
                wallPoints.Add(a);

                var b = ObjectPool.GetEmptyObject<Point>();
                b.X = -relativeX + this.kitty.Unit.X;
                b.Y = constant;
                wallPoints.Add(b);
            }
        }

        return;
    }


    /**
	* This function find the angle formed among two points of the circumference
	* and the center on the X axis
	*/
    (float, float) AnglesFromCenter((float X, float Y) pointA, (float X, float Y) pointB)
    {
        float angleA = AngleOf(pointA, (this.kitty.Unit.X, this.kitty.Unit.Y));
        float angleB = AngleOf(pointB, (this.kitty.Unit.X, this.kitty.Unit.Y));
        return (angleA, angleB);
    }

    float AngleOf((float X, float Y) point, (float X, float Y) center)
    {
        float deltaX = point.X - center.X;
        float deltaY = point.Y - center.Y;
        float radians = (float)Math.Atan2(deltaY, deltaX);
        return NormalizeAngle(radians);
    }

    // Rewritten GetCompositeDodgePosition using a reusable struct array instead of creating new objects.
    private (float X, float Y) GetCompositeDodgePosition(List<Wolf> wolves, ref (float X, float Y) forwardDirection)
    {
        float forwardAngle = NormalizeAngle(MathF.Atan2(forwardDirection.Y, forwardDirection.X));
        float requiredClearance = 22.5f * (MathF.PI / 180);

        // Calculate the angle interval that each wolf “blocks.”
        for (int i = 0; i < wolves.Count; i++)
        {
            Wolf wolf = wolves[i];

            float MIN_TOTAL_BLOCKED_ANGLE = 45.0f * (MathF.PI / 180);
            float MAX_TOTAL_BLOCKED_ANGLE = 270.0f * (MathF.PI / 180);

            if (!wolf.IsWalking)
            {
                MIN_TOTAL_BLOCKED_ANGLE = 30.0f * (MathF.PI / 180);
                MAX_TOTAL_BLOCKED_ANGLE = 150.0f * (MathF.PI / 180);
            }

            float dx = wolf.Unit.X - this.kitty.Unit.X;
            float dy = wolf.Unit.Y - this.kitty.Unit.Y;
            float distance = (float)Math.Sqrt(dx * dx + dy * dy);

            if (distance < 1)
                continue; // Skip if the wolf is at the same position to avoid division by zero

            float centerAngle = MathF.Atan2(wolf.Unit.Y - this.kitty.Unit.Y, wolf.Unit.X - this.kitty.Unit.X);
            float clampedDistance = Math.Clamp(distance, CollisionDetection.DEFAULT_WOLF_COLLISION_RADIUS, DODGE_RADIUS);
            float ratio = (clampedDistance - CollisionDetection.DEFAULT_WOLF_COLLISION_RADIUS) / (DODGE_RADIUS - CollisionDetection.DEFAULT_WOLF_COLLISION_RADIUS);

            float totalBlockedAngle = MIN_TOTAL_BLOCKED_ANGLE + (MAX_TOTAL_BLOCKED_ANGLE - MIN_TOTAL_BLOCKED_ANGLE) * (1 - ratio);
            float halfAngle = totalBlockedAngle / 2f;

            // Create the interval [centerAngle - halfAngle, centerAngle + halfAngle]
            float start = NormalizeAngle(centerAngle - halfAngle);
            float end = NormalizeAngle(centerAngle + halfAngle);

            // If the interval wraps around 0, split it into two parts.
            if (start > end)
            {
                var a = ObjectPool.GetEmptyObject<AngleInterval>();
                a.Start = start;
                a.End = 2f * MathF.PI;
                blockedIntervals.Add(a);

                var b = ObjectPool.GetEmptyObject<AngleInterval>();
                b.Start = 0;
                b.End = end;
                blockedIntervals.Add(b);
            }
            else
            {
                var a = ObjectPool.GetEmptyObject<AngleInterval>();
                a.Start = start;
                a.End = end;
                blockedIntervals.Add(a);
            }
        }

        CalcCrossingPoints();

        if (wallPoints.Count == 2)
        {
            var (angleA, angleB) = AnglesFromCenter((wallPoints[0].X, wallPoints[0].Y), (wallPoints[1].X, wallPoints[1].Y));

            if (angleA > angleB)
            {
                float temp = angleA;
                angleA = angleB;
                angleB = temp;
            }

            float start;
            float end;

            if (angleB - angleA > 180.0f * (MathF.PI / 180))
            {
                start = angleB;
                end = angleA;
            }
            else
            {
                start = angleA;
                end = angleB;
            }

            // If the interval wraps around 0, split it into two parts.
            if (start > end)
            {
                var a = ObjectPool.GetEmptyObject<AngleInterval>();
                a.Start = start;
                a.End = 2f * MathF.PI;
                blockedIntervals.Add(a);

                var b = ObjectPool.GetEmptyObject<AngleInterval>();
                b.Start = 0;
                b.End = end;
                blockedIntervals.Add(b);
            }
            else
            {
                var a = ObjectPool.GetEmptyObject<AngleInterval>();
                a.Start = start;
                a.End = end;
                blockedIntervals.Add(a);
            }
        }

        // Merge any overlapping blocked intervals.
        MergeIntervals(blockedIntervals);

        // Visualize the blocked intervals
        HideAllLightnings();
        for (int i = 0; i < mergedIntervals.Count; i++)
        {
            VisualizeBlockedInterval(mergedIntervals[i]);
        }

        // Determine free angular gaps on the circle.
        if (mergedIntervals.Count == 0)
        {
            // No wolves blocking any direction; entire circle is free.
            var a = ObjectPool.GetEmptyObject<AngleInterval>();
            a.Start = 0;
            a.End = 2f * MathF.PI;
            freeGaps.Add(a);
        }
        else
        {
            // Ensure the merged intervals are sorted by their start angle.
            //mergedIntervals.Sort((a, b) => a.Start.CompareTo(b.Start));
            SortAngleIntervals(mergedIntervals);

            // The gap between the end of the last interval and the start of the first (accounting for wrap-around).
            float wrapGap = (mergedIntervals[0].Start + 2f * MathF.PI) - mergedIntervals[mergedIntervals.Count - 1].End;
            if (wrapGap > 0)
            {
                var a = ObjectPool.GetEmptyObject<AngleInterval>();
                a.Start = mergedIntervals[mergedIntervals.Count - 1].End;
                a.End = mergedIntervals[0].Start + 2f * MathF.PI;
                freeGaps.Add(a);
            }
            // Gaps between consecutive intervals.
            for (int i = 0; i < mergedIntervals.Count - 1; i++)
            {
                float gapSize = mergedIntervals[i + 1].Start - mergedIntervals[i].End;
                if (gapSize > 0)
                {
                    var a = ObjectPool.GetEmptyObject<AngleInterval>();
                    a.Start = mergedIntervals[i].End;
                    a.End = mergedIntervals[i + 1].Start;
                    freeGaps.Add(a);
                }
            }
        }

        // Visualize the free intervals
        HideAllFreeLightnings();
        for (int i = 0; i < freeGaps.Count; i++)
        {
            var interval = freeGaps[i];
            VisualizeFreeInterval(interval);
        }

        float targetX = kitty.Unit.X + MathF.Cos(forwardAngle) * DODGE_DISTANCE;
        float targetY = kitty.Unit.Y + MathF.Sin(forwardAngle) * DODGE_DISTANCE;

        float bestCandidateScore = float.MaxValue;
        float bestCandidateAngle = -500f; // Default to the original forward angle

        for (int i = 0; i < offsets.Length; i++)
        {
            float offset = offsets[i];
            float candidateAngle = NormalizeAngle(forwardAngle + offset);

            float bestAngle = calcAngle(candidateAngle, requiredClearance);

            if (bestAngle == -500f)
            {
                continue;
            }

            float candX = kitty.Unit.X + MathF.Cos(bestAngle) * DODGE_DISTANCE;
            float candY = kitty.Unit.Y + MathF.Sin(bestAngle) * DODGE_DISTANCE;

            float dx = Math.Abs(candX - targetX);
            float dy = Math.Abs(candY - targetY);
            float score = dx * dx + dy * dy;

            if (score < bestCandidateScore)
            {
                bestCandidateScore = score;
                bestCandidateAngle = bestAngle;
            }
        }

        if (bestCandidateAngle == -500f)
        {
            cleanArrays();
            return (kitty.Unit.X, kitty.Unit.Y);
        }

        // Update the forward direction to the chosen dodge direction.
        (float X, float Y) forwardDirection2 = (MathF.Cos(bestCandidateAngle), MathF.Sin(bestCandidateAngle));

        cleanArrays();

        // Return the target dodge position (kitty's position plus 128f in the chosen direction).
        return (kitty.Unit.X + forwardDirection2.X * DODGE_DISTANCE, kitty.Unit.Y + forwardDirection2.Y * DODGE_DISTANCE);
    }

    private float calcAngle(float forwardAngle, float requiredClearance)
    {
        // Initialize bestAngle to the original forward direction
        float bestAngle = -500f;
        bool foundGapContainingForward = false;

        // First, check if forwardAngle falls within any free gap.
        for (int i = 0; i < freeGaps.Count; i++)
        {
            AngleInterval gap = freeGaps[i];

            if (gap.End - gap.Start < requiredClearance)
            {
                continue;
            }

            if (IsAngleInInterval(forwardAngle, gap))
            {
                foundGapContainingForward = true;
                // Calculate the distance from forwardAngle to the gap boundaries.
                float diffToStart = AngleDifference(forwardAngle, gap.Start);
                float diffToEnd = AngleDifference(gap.End, forwardAngle);

                // If too close to the start boundary, adjust forwardAngle to be 45° inside.
                if (diffToStart < requiredClearance)
                {
                    bestAngle = gap.Start + requiredClearance;
                }
                // If too close to the end boundary, adjust forwardAngle to be 45° inside.
                else
                {
                    if (diffToEnd < requiredClearance)
                    {
                        bestAngle = gap.End - requiredClearance;
                    }
                    else
                    {
                        bestAngle = forwardAngle; // It’s safely in the middle.
                    }
                }
                break;
            }
        }

        // If forwardAngle isn't within any free gap, find the candidate edge closest to forwardAngle.
        if (!foundGapContainingForward)
        {
            float bestScore = float.MaxValue;
            for (int i = 0; i < freeGaps.Count; i++) // Replacing foreach with for loop
            {
                AngleInterval gap = freeGaps[i]; // Accessing the element by index

                if (gap.End - gap.Start < requiredClearance)
                {
                    continue;
                }

                // Calculate candidate angles from each gap’s boundaries (adjusted by required clearance).
                float candidateFromStart = NormalizeAngle(gap.Start + requiredClearance);
                float candidateFromEnd = NormalizeAngle(gap.End - requiredClearance);

                float diffStart = AngleDifference(forwardAngle, candidateFromStart);
                float diffEnd = AngleDifference(candidateFromEnd, forwardAngle);

                if (diffStart < bestScore)
                {
                    bestScore = diffStart;
                    bestAngle = candidateFromStart;
                }

                if (diffEnd < bestScore)
                {
                    bestScore = diffEnd;
                    bestAngle = candidateFromEnd;
                }
            }
        }

        return bestAngle;
    }

    private bool IsAngleInInterval(float angle, AngleInterval interval)
    {
        // Normalize the angle and interval boundaries to [0, 2π)
        angle = NormalizeAngle(angle);
        float start = NormalizeAngle(interval.Start);
        float end = NormalizeAngle(interval.End);

        // Check if the interval does not wrap around.
        if (start <= end)
        {
            return angle >= start && angle <= end;
        }
        // If the interval wraps around 0 (e.g., 350° to 10°), the angle is within the interval 
        // if it's greater than or equal to the start OR less than or equal to the end.
        return angle >= start || angle <= end;
    }

    private void cleanArrays()
    {
        for (int i = 0; i < blockedIntervals.Count; i++)
        {
            blockedIntervals[i].Dispose();
        }
        blockedIntervals.Clear();

        for (int i = 0; i < freeGaps.Count; i++)
        {
            freeGaps[i].Dispose();
        }
        freeGaps.Clear();

        // Clear mergedIntervals without destroying references
        mergedIntervals.Clear();
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

            if (availableBlockedLightnings.Count > 0)
            {
                freeLightning = availableBlockedLightnings[availableBlockedLightnings.Count - 1];
                availableBlockedLightnings.RemoveAt(availableBlockedLightnings.Count - 1);
            }

            if (freeLightning == null)
            {
                freeLightning = AddLightning(BLOCKED_LASER_COLOR, false, x1, y1, x2, y2); // "AFOD" is finger of death code
            }

            usedBlockedLightnings.Add(freeLightning);
            MoveLightning(freeLightning, false, x1, y1, x2, y2);
        }
    }

    private void VisualizeFreeInterval(AngleInterval interval)
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

            if (availableClearLightnings.Count > 0)
            {
                freeLightning = availableClearLightnings[availableClearLightnings.Count - 1];
                availableClearLightnings.RemoveAt(availableClearLightnings.Count - 1);
            }

            if (freeLightning == null)
            {
                freeLightning = AddLightning(FREE_LASER_COLOR, false, x1, y1, x2, y2);
            }

            usedClearLightnings.Add(freeLightning);
            MoveLightning(freeLightning, false, x1, y1, x2, y2);
        }
    }

    private void HideAllLightnings()
    {
        for (int i = 0; i < usedBlockedLightnings.Count; i++)
        {
            var lightning = usedBlockedLightnings[i];
            MoveLightning(lightning, false, 0.0f, 0.0f, 0.0f, 0.0f);
            availableBlockedLightnings.Add(lightning);
        }

        usedBlockedLightnings.Clear();
    }

    private void HideAllFreeLightnings()
    {
        for (int i = 0; i < usedClearLightnings.Count; i++)
        {
            var lightning = usedClearLightnings[i];
            MoveLightning(lightning, false, 0.0f, 0.0f, 0.0f, 0.0f);
            availableClearLightnings.Add(lightning);
        }

        usedClearLightnings.Clear();
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
        float diff = (a - b + (float)Math.PI) % (2 * (float)Math.PI) - (float)Math.PI;
        return Math.Abs(diff);
    }

    private void SortAngleIntervals(List<AngleInterval> intervals)
    {
        for (int i = 0; i < intervals.Count - 1; i++)
        {
            for (int j = 0; j < intervals.Count - i - 1; j++)
            {
                if (intervals[j].Start > intervals[j + 1].Start)
                {
                    // Swap intervals[j] and intervals[j + 1]
                    var temp = intervals[j];
                    intervals[j] = intervals[j + 1];
                    intervals[j + 1] = temp;
                }
            }
        }
    }


    /// <summary>
    /// Merges overlapping angular intervals.
    /// </summary>
    private void MergeIntervals(List<AngleInterval> intervals)
    {
        SortAngleIntervals(intervals);

        AngleInterval current = intervals[0];

        for (int i = 1; i < intervals.Count; i++)
        {
            if (IsAngleInInterval(intervals[i].Start, current))
            {
                // Extend the current interval if needed.
                current.End = MathF.Max(current.End, intervals[i].End);
            }
            else
            {
                mergedIntervals.Add(current);
                current = intervals[i];
            }
        }

        mergedIntervals.Add(current);
    }

    /// <summary>
    /// Helper class representing an angular interval [Start, End] in radians.
    /// </summary>
    private class AngleInterval : IDisposable
    {
        public float Start;
        public float End;

        public AngleInterval()
        {
        }

        public void Dispose()
        {
            ObjectPool.ReturnObject(this);
        }
    }

    private class Point : IDisposable
    {
        public float X;
        public float Y;

        public Point()
        {
        }

        public void Dispose()
        {
            ObjectPool.ReturnObject(this);
        }
    }

    private bool IsWithinRadius(float x1, float y1, float x2, float y2, float radius)
    {
        var distance = Math.Sqrt(((x2 - x1) * (x2 - x1)) + ((y2 - y1) * (y2 - y1)));
        return distance <= radius;
    }

    private void PollMovement()
    {
        if (!enabled) return;
        elapsedTime += timerInterval;
        LearnSkills();
        UseWindWalkIfAvailable();
        MoveKittyToPosition();
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

        if (Blizzard.UnitHasBuffBJ(kitty.Unit, WindwalkID)) return;

        IssueOrderBasic("windwalk");
    }
}
