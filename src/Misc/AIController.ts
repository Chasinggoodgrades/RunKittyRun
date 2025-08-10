

class AIController
{
    private kitty: Kitty;
    private enabled: boolean;
    public DODGE_RADIUS: number = 192.0;
    public DODGE_RADIUS_STILL: number = 128.0;
    private DODGE_DISTANCE: number = 128; // Amount to walk away
    public static FREE_LASER_COLOR: string = "GRSB";
    public static BLOCKED_LASER_COLOR: string = "RESB";
    private static WindwalkID: number = FourCC("BOwk");
    private static number[] offsets = [-90, -45, 0.0, 45, 90]
    public _timerInterval: number = 0.1;
    public timerInterval: number
    {
        get { return _timerInterval; }
        set
        {
            _timerInterval = Math.Max(value, 0.01);

            if (this.IsEnabled())
            {
                this.PauseAi();
                this.ResumeAi();
            }
        }
    }
    public laser: boolean = Program.Debug;

    private lastCommand: string = "";
    private lastX: number;
    private lastY: number;
    private hasLastOrder: boolean = false;
    private lastOrderTime: number = 0;
    private elapsedTime: number = 0;

    private moveTimer: timer;
    private List<Wolf> wolvesInRange = new List<Wolf>();
    private lastLightning: lightning;

    private int? lastSafeZoneIndexId = null;
    private reachedLastProgressZoneCenter: boolean = false;
    private List<lightning> availableBlockedLightnings = new List<lightning>();
    private List<lightning> availableClearLightnings = new List<lightning>();
    private List<lightning> usedBlockedLightnings = new List<lightning>();
    private List<lightning> usedClearLightnings = new List<lightning>();
    private List<AngleInterval> blockedIntervals = new List<AngleInterval>();
    private List<AngleInterval> freeGaps = new List<AngleInterval>();
    private List<AngleInterval> mergedIntervals = new List<AngleInterval>();
    private static Dictionary<Kitty, Kitty> claimedKitties = new Dictionary<Kitty, Kitty>();
    private List<Point> wallPoints = new List<Point>();

    public AIController(kitty: Kitty)
    {
        this.kitty = kitty;
        enabled = false;
    }

    public StartAi()
    {
        enabled = true;
        ResumeAi();
    }

    public ResumeAi()
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

    public StopAi()
    {
        enabled = false;
        PauseAi();
    }

    public PauseAi()
    {
        lastCommand = "";
        lastX = 0;
        lastY = 0;
        hasLastOrder = false;
        lastOrderTime = 0;
        elapsedTime = 0;

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

    public IsEnabled(): boolean
    {
        return enabled;
    }

    private CalcProgressZone(kitty: Kitty)
    {
        let currentProgressZoneId = kitty.ProgressZone;

        if (IsInSafeZone(kitty.Unit.X, kitty.Unit.Y, currentProgressZoneId + 1))
        {
            currentProgressZoneId++;
        }

        return currentProgressZoneId;
    }

    private MoveKittyToPosition()
    {
        let currentProgressZoneId = CalcProgressZone(this.kitty);
        let currentSafezone = Globals.SAFE_ZONES[currentProgressZoneId];
        let nextSafezone = (currentProgressZoneId + 1 < Globals.SAFE_ZONES.Count - 1) ? Globals.SAFE_ZONES[currentProgressZoneId + 1] : currentSafezone;
        let currentSafezoneCenter = GetCenterPositionInSafezone(currentSafezone);
        let nextSafezoneCenter = GetCenterPositionInSafezone(nextSafezone);

        int? currentSafeZoneId = IsInSafeZone(this.kitty.Unit.X, this.kitty.Unit.Y, currentProgressZoneId) ? currentProgressZoneId : null;

        if (currentSafeZoneId != lastSafeZoneIndexId)
        {
            reachedLastProgressZoneCenter = currentSafeZoneId == null;
            lastSafeZoneIndexId = currentSafeZoneId;
        }

        let distanceToCurrentCenter = Math.Sqrt(Math.Pow(kitty.Unit.X - currentSafezoneCenter.X, 2) + Math.Pow(kitty.Unit.Y - currentSafezoneCenter.Y, 2));
        let SAFEZONE_THRESHOLD: number = 128.0;

        if (distanceToCurrentCenter <= SAFEZONE_THRESHOLD)
        {
            reachedLastProgressZoneCenter = true;
        }

        let allKittiesAtSameOrHigherSafezone: boolean = true; // IEnumberable is dog shit for C# -> Lua conversion, this should -help-
        for (let i: number = 0; i < Globals.ALL_KITTIES_LIST.Count; i++)
        {
            let k = Globals.ALL_KITTIES_LIST[i];
            if (Program.Debug && k.Player == Player(0))
            {
                continue;
            }

            if (CalcProgressZone(k) < currentProgressZoneId)
            {
                allKittiesAtSameOrHigherSafezone = false;
                break;
            }
        }

        let targetPosition = reachedLastProgressZoneCenter && allKittiesAtSameOrHigherSafezone ? nextSafezoneCenter : currentSafezoneCenter;

        for (let circle in Globals.ALL_CIRCLES)
        {
            let deadKitty = Globals.ALL_KITTIES[circle.Value.Player];
            let deadKittyProgressZoneId = CalcProgressZone(deadKitty);

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
                    let thisDistance: number = Math.Sqrt(Math.Pow(this.kitty.Unit.X - deadKitty.Unit.X, 2) + Math.Pow(this.kitty.Unit.Y - deadKitty.Unit.Y, 2));
                    let thisLaneDiff: number = Math.Abs(currentProgressZoneId - deadKittyProgressZoneId);

                    let isNearest: boolean = true;

                    for (let i: number = 0; i < Globals.ALL_KITTIES_LIST.Count; i++)
                    {
                        let otherKitty = Globals.ALL_KITTIES_LIST[i];
                        if (Program.Debug && otherKitty.Player == Player(0))
                        {
                            continue;
                        }

                        if (otherKitty != this.kitty && otherKitty.Alive)
                        {
                            let otherDistance: number = Math.Sqrt(Math.Pow(otherKitty.Unit.X - deadKitty.Unit.X, 2) + Math.Pow(otherKitty.Unit.Y - deadKitty.Unit.Y, 2));
                            let otherLaneDiff: number = Math.Abs(CalcProgressZone(otherKitty) - deadKittyProgressZoneId);

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

        let wolvesInLane = WolfArea.WolfAreas[currentProgressZoneId].Wolves;

        wolvesInRange.Clear();
        for (let i: number = 0; i < wolvesInLane.Count; i++)
        {
            let wolf = wolvesInLane[i];
            if (IsWithinRadius(kitty.Unit.X, kitty.Unit.Y, wolf.Unit.X, wolf.Unit.Y, wolf.IsWalking ? DODGE_RADIUS : DODGE_RADIUS_STILL))
            {
                wolvesInRange.Add(wolf);
            }
        }

        let forwardDirection = (X: targetPosition.X - kitty.Unit.X, Y: targetPosition.Y - kitty.Unit.Y);

        if (wolvesInRange.Count > 0)
        {
            let dodgePosition = GetCompositeDodgePosition(wolvesInRange,  forwardDirection); // TODO; Cleanup:             let dodgePosition = GetCompositeDodgePosition(wolvesInRange, ref forwardDirection);
            IssueOrder("move", dodgePosition.X, dodgePosition.Y, true);
            return;
        }
        else
        {
            HideAllLightnings();
            HideAllFreeLightnings();
        }

        let deltaX = targetPosition.X - kitty.Unit.X;
        let deltaY = targetPosition.Y - kitty.Unit.Y;
        let distance = Math.Sqrt((deltaX * deltaX) + (deltaY * deltaY));
        if (distance > 256)
        {
            let scale = 256 / distance;
            let moveX = kitty.Unit.X + (deltaX * scale);
            let moveY = kitty.Unit.Y + (deltaY * scale);
            IssueOrder("move", moveX, moveY, false);
        }
        else
        {
            IssueOrder("move", targetPosition.X, targetPosition.Y, false);
        }
    }

    private IsWithinLaneBounds(x: number, y: number)
    {
        let currentProgressZoneId = this.kitty.ProgressZone;
        let laneBounds = WolfArea.WolfAreas[currentProgressZoneId].Rectangle;

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

    private IsInSafeZone(x: number, y: number, safeZoneId: number)
    {
        if (safeZoneId < 0 || safeZoneId >= Globals.SAFE_ZONES.Count)
        {
            return false; // prevent out of bounds errors xd
        }
        let safezone = Globals.SAFE_ZONES[safeZoneId];

        return x >= safezone.Rect_.MinX && x <= safezone.Rect_.MaxX && y >= safezone.Rect_.MinY && y <= safezone.Rect_.MaxY;
    }

    private IssueOrder(command: string, x: number, y: number, isDodge: boolean)
    {
        let MIN_MOVE_DISTANCE: number = isDodge ? 16.0 : 64.0;

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

        let deltaX: number = x - lastX;
        let deltaY: number = y - lastY;
        let distanceSquared: number = (deltaX * deltaX) + (deltaY * deltaY);

        if (hasLastOrder && lastCommand == command && distanceSquared < MIN_MOVE_DISTANCE * MIN_MOVE_DISTANCE)
        {
            if ((elapsedTime - lastOrderTime) < 4)
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

    private IssueOrderBasic(command: string)
    {
        lastCommand = command;
        lastX = -1;
        lastY = -1;
        lastOrderTime = elapsedTime;
        hasLastOrder = true;
        kitty.Unit.IssueOrder(command);
    }

    private (X: number, Y: number) GetCenterPositionInSafezone(safezone: Safezone)
    {
        let centerX = (safezone.Rect_.MinX + safezone.Rect_.MaxX) / 2;
        let centerY = (safezone.Rect_.MinY + safezone.Rect_.MaxY) / 2;
        return (centerX, centerY);
    }

    /**
	* the: wall: to: be: within: range: For of kitty: the, what: has: to: basically happen is that a line passes through the circle at two points. 
	* the: mathematical: formula: for: a: line: passing: through: two: points: Using on a circle, this can be calculated.
	*/
    CalcCrossingPoints()
    {
        for (let i: number = 0; i < wallPoints.Count; i++)
        {
            let point = wallPoints[i];
            point.Dispose();
        }

        wallPoints.Clear();

        let dodgeRange = (DODGE_DISTANCE * (timerInterval + 0.2));
        let currentProgressZoneId = this.kitty.ProgressZone;
        let laneBounds = WolfArea.WolfAreas[currentProgressZoneId].Rectangle;
        let isVertical: boolean = laneBounds.Width < laneBounds.Height;

        if (isVertical)
        {
            // Handle vertical walls (left/right) as before.
            let constant: number = float.NaN;
            if (this.kitty.Unit.X - dodgeRange < laneBounds.Left)
                constant = laneBounds.Left;
            else if (this.kitty.Unit.X + dodgeRange > laneBounds.Right)
                constant = laneBounds.Right;
            else
                return;

            let relativeY: number = Math.Sqrt((dodgeRange * dodgeRange) - Math.Pow(this.kitty.Unit.X - constant, 2));
            if (!float.IsNaN(relativeY) && relativeY != 0)
            {
                let a = ObjectPool.GetEmptyObject<Point>();
                a.X = constant;
                a.Y = relativeY + this.kitty.Unit.Y;
                wallPoints.Add(a);

                let b = ObjectPool.GetEmptyObject<Point>();
                b.X = constant;
                b.Y = -relativeY + this.kitty.Unit.Y;
                wallPoints.Add(b);
            }
        }
        else
        {
            let constant: number = float.NaN;
            if (this.kitty.Unit.Y + dodgeRange > laneBounds.Top)
                constant = laneBounds.Top;
            else if (this.kitty.Unit.Y - dodgeRange < laneBounds.Bottom)
                constant = laneBounds.Bottom;
            else
                return;

            let relativeX: number = Math.Sqrt((dodgeRange * dodgeRange) - Math.Pow(this.kitty.Unit.Y - constant, 2));
            if (!float.IsNaN(relativeX) && relativeX != 0)
            {
                let a = ObjectPool.GetEmptyObject<Point>();
                a.X = relativeX + this.kitty.Unit.X;
                a.Y = constant;
                wallPoints.Add(a);

                let b = ObjectPool.GetEmptyObject<Point>();
                b.X = -relativeX + this.kitty.Unit.X;
                b.Y = constant;
                wallPoints.Add(b);
            }
        }

        return;
    }

    /**
	* function: find: the: angle: formed: among: two: points: This of circumference: the
	* the: center: on: the: X: axis: and
	*/
    (float, float) AnglesFromCenter((X: number, Y: number) pointA, (X: number, Y: number) pointB)
    {
        let angleA: number = AngleOf(pointA, (this.kitty.Unit.X, this.kitty.Unit.Y));
        let angleB: number = AngleOf(pointB, (this.kitty.Unit.X, this.kitty.Unit.Y));
        return (angleA, angleB);
    }

    let AngleOf((X: number, Y: number) point, (X: number, Y: number) center)
    {
        let deltaX: number = point.X - center.X;
        let deltaY: number = point.Y - center.Y;
        let radians: number = Math.Atan2(deltaY, deltaX);
        return NormalizeAngle(radians);
    }

    // Rewritten GetCompositeDodgePosition using a reusable struct array instead of creating new objects.
    private (X: number, Y: number) GetCompositeDodgePosition(List<Wolf> wolves,  (X: number, Y: number) forwardDirection) // TODO; Cleanup:     private (number X, number Y) GetCompositeDodgePosition(List<Wolf> wolves, ref (number X, number Y) forwardDirection)
    {
        let forwardAngle: number = NormalizeAngle(MathF.Atan2(forwardDirection.Y, forwardDirection.X));
        let requiredClearance: number = 22.5 * (MathF.PI / 180);

        // Calculate the angle interval that each wolf “blocks.”
        for (let i: number = 0; i < wolves.Count; i++)
        {
            let wolf: Wolf = wolves[i];

            let MIN_TOTAL_BLOCKED_ANGLE: number = 45.0 * (MathF.PI / 180);
            let MAX_TOTAL_BLOCKED_ANGLE: number = 270.0 * (MathF.PI / 180);

            if (!wolf.IsWalking)
            {
                MIN_TOTAL_BLOCKED_ANGLE = 30.0 * (MathF.PI / 180);
                MAX_TOTAL_BLOCKED_ANGLE = 150.0 * (MathF.PI / 180);
            }

            let dx: number = wolf.Unit.X - this.kitty.Unit.X;
            let dy: number = wolf.Unit.Y - this.kitty.Unit.Y;
            let distance: number = Math.Sqrt(dx * dx + dy * dy);

            if (distance < 1)
                continue; // Skip if the wolf is at the same position to avoid division by zero

            let centerAngle: number = MathF.Atan2(wolf.Unit.Y - this.kitty.Unit.Y, wolf.Unit.X - this.kitty.Unit.X);
            let clampedDistance: number = Math.Clamp(distance, CollisionDetection.DEFAULT_WOLF_COLLISION_RADIUS, DODGE_RADIUS);
            let ratio: number = (clampedDistance - CollisionDetection.DEFAULT_WOLF_COLLISION_RADIUS) / (DODGE_RADIUS - CollisionDetection.DEFAULT_WOLF_COLLISION_RADIUS);

            let totalBlockedAngle: number = MIN_TOTAL_BLOCKED_ANGLE + (MAX_TOTAL_BLOCKED_ANGLE - MIN_TOTAL_BLOCKED_ANGLE) * (1 - ratio);
            let halfAngle: number = totalBlockedAngle / 2;

            // Create the interval [centerAngle - halfAngle, centerAngle + halfAngle]
            let start: number = NormalizeAngle(centerAngle - halfAngle);
            let end: number = NormalizeAngle(centerAngle + halfAngle);

            // If the interval wraps around 0, split it into two parts.
            if (start > end)
            {
                let a = ObjectPool.GetEmptyObject<AngleInterval>();
                a.Start = start;
                a.End = 2 * MathF.PI;
                blockedIntervals.Add(a);

                let b = ObjectPool.GetEmptyObject<AngleInterval>();
                b.Start = 0;
                b.End = end;
                blockedIntervals.Add(b);
            }
            else
            {
                let a = ObjectPool.GetEmptyObject<AngleInterval>();
                a.Start = start;
                a.End = end;
                blockedIntervals.Add(a);
            }
        }

        CalcCrossingPoints();

        if (wallPoints.Count == 2)
        {
            let (angleA, angleB) = AnglesFromCenter((wallPoints[0].X, wallPoints[0].Y), (wallPoints[1].X, wallPoints[1].Y));

            if (angleA > angleB)
            {
                let temp: number = angleA;
                angleA = angleB;
                angleB = temp;
            }

            let start: number;
            let end: number;

            if (angleB - angleA > 180.0 * (MathF.PI / 180))
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
                let a = ObjectPool.GetEmptyObject<AngleInterval>();
                a.Start = start;
                a.End = 2 * MathF.PI;
                blockedIntervals.Add(a);

                let b = ObjectPool.GetEmptyObject<AngleInterval>();
                b.Start = 0;
                b.End = end;
                blockedIntervals.Add(b);
            }
            else
            {
                let a = ObjectPool.GetEmptyObject<AngleInterval>();
                a.Start = start;
                a.End = end;
                blockedIntervals.Add(a);
            }
        }

        // Merge any overlapping blocked intervals.
        MergeIntervals(blockedIntervals);

        // Visualize the blocked intervals
        HideAllLightnings();
        for (let i: number = 0; i < mergedIntervals.Count; i++)
        {
            VisualizeBlockedInterval(mergedIntervals[i]);
        }

        // Determine free angular gaps on the circle.
        if (mergedIntervals.Count == 0)
        {
            // No wolves blocking any direction; entire circle is free.
            let a = ObjectPool.GetEmptyObject<AngleInterval>();
            a.Start = 0;
            a.End = 2 * MathF.PI;
            freeGaps.Add(a);
        }
        else
        {
            // Ensure the merged intervals are sorted by their start angle.
            //mergedIntervals.Sort((a, b) => a.Start.CompareTo(b.Start));
            SortAngleIntervals(mergedIntervals);

            // The gap between the end of the last interval and the start of the first (accounting for wrap-around).
            let wrapGap: number = (mergedIntervals[0].Start + 2 * MathF.PI) - mergedIntervals[mergedIntervals.Count - 1].End;
            if (wrapGap > 0)
            {
                let a = ObjectPool.GetEmptyObject<AngleInterval>();
                a.Start = mergedIntervals[mergedIntervals.Count - 1].End;
                a.End = mergedIntervals[0].Start + 2 * MathF.PI;
                freeGaps.Add(a);
            }
            // Gaps between consecutive intervals.
            for (let i: number = 0; i < mergedIntervals.Count - 1; i++)
            {
                let gapSize: number = mergedIntervals[i + 1].Start - mergedIntervals[i].End;
                if (gapSize > 0)
                {
                    let a = ObjectPool.GetEmptyObject<AngleInterval>();
                    a.Start = mergedIntervals[i].End;
                    a.End = mergedIntervals[i + 1].Start;
                    freeGaps.Add(a);
                }
            }
        }

        // Visualize the free intervals
        HideAllFreeLightnings();
        for (let i: number = 0; i < freeGaps.Count; i++)
        {
            let interval = freeGaps[i];
            VisualizeFreeInterval(interval);
        }

        let targetX: number = kitty.Unit.X + MathF.Cos(forwardAngle) * DODGE_DISTANCE;
        let targetY: number = kitty.Unit.Y + MathF.Sin(forwardAngle) * DODGE_DISTANCE;

        let bestCandidateScore: number = float.MaxValue;
        let bestCandidateAngle: number = -500; // Default to the original forward angle

        for (let i: number = 0; i < offsets.Length; i++)
        {
            let offset: number = offsets[i];
            let candidateAngle: number = NormalizeAngle(forwardAngle + offset);

            let bestAngle: number = calcAngle(candidateAngle, requiredClearance);

            if (bestAngle == -500)
            {
                continue;
            }

            let candX: number = kitty.Unit.X + MathF.Cos(bestAngle) * DODGE_DISTANCE;
            let candY: number = kitty.Unit.Y + MathF.Sin(bestAngle) * DODGE_DISTANCE;

            let dx: number = Math.Abs(candX - targetX);
            let dy: number = Math.Abs(candY - targetY);
            let score: number = dx * dx + dy * dy;

            if (score < bestCandidateScore)
            {
                bestCandidateScore = score;
                bestCandidateAngle = bestAngle;
            }
        }

        if (bestCandidateAngle == -500)
        {
            cleanArrays();
            return (kitty.Unit.X, kitty.Unit.Y);
        }

        // Update the forward direction to the chosen dodge direction.
        (X: number, Y: number) forwardDirection2 = (MathF.Cos(bestCandidateAngle), MathF.Sin(bestCandidateAngle));

        cleanArrays();

        // Return the target dodge position (kitty's position plus 128 in the chosen direction).
        return (kitty.Unit.X + forwardDirection2.X * DODGE_DISTANCE, kitty.Unit.Y + forwardDirection2.Y * DODGE_DISTANCE);
    }

    private calcAngle(forwardAngle: number, requiredClearance: number)
    {
        // Initialize bestAngle to the original forward direction
        let bestAngle: number = -500;
        let foundGapContainingForward: boolean = false;

        // First, check if forwardAngle falls within any free gap.
        for (let i: number = 0; i < freeGaps.Count; i++)
        {
            let gap: AngleInterval = freeGaps[i];

            if (gap.End - gap.Start < requiredClearance)
            {
                continue;
            }

            if (IsAngleInInterval(forwardAngle, gap))
            {
                foundGapContainingForward = true;
                // Calculate the distance from forwardAngle to the gap boundaries.
                let diffToStart: number = AngleDifference(forwardAngle, gap.Start);
                let diffToEnd: number = AngleDifference(gap.End, forwardAngle);

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
            let bestScore: number = float.MaxValue;
            for (let i: number = 0; i < freeGaps.Count; i++) // Replacing for with for loop
            {
                let gap: AngleInterval = freeGaps[i]; // Accessing the element by index

                if (gap.End - gap.Start < requiredClearance)
                {
                    continue;
                }

                // Calculate candidate angles from each gap’s boundaries (adjusted by required clearance).
                let candidateFromStart: number = NormalizeAngle(gap.Start + requiredClearance);
                let candidateFromEnd: number = NormalizeAngle(gap.End - requiredClearance);

                let diffStart: number = AngleDifference(forwardAngle, candidateFromStart);
                let diffEnd: number = AngleDifference(candidateFromEnd, forwardAngle);

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

    private IsAngleInInterval(angle: number, interval: AngleInterval)
    {
        // Normalize the angle and interval boundaries to [0, 2π)
        angle = NormalizeAngle(angle);
        let start: number = NormalizeAngle(interval.Start);
        let end: number = NormalizeAngle(interval.End);

        // Check if the interval does not wrap around.
        if (start <= end)
        {
            return angle >= start && angle <= end;
        }
        // If the interval wraps around 0 (e.g., 350° to 10°), the angle is within the interval 
        // if it's greater than or equal to the start OR less than or equal to the end.
        return angle >= start || angle <= end;
    }

    private cleanArrays()
    {
        for (let i: number = 0; i < blockedIntervals.Count; i++)
        {
            blockedIntervals[i].Dispose();
        }
        blockedIntervals.Clear();

        for (let i: number = 0; i < freeGaps.Count; i++)
        {
            freeGaps[i].Dispose();
        }
        freeGaps.Clear();

        // Clear mergedIntervals without destroying references
        mergedIntervals.Clear();
    }

    private VisualizeBlockedInterval(interval: AngleInterval)
    {
        if (!laser)
        {
            return;
        }

        let radius: number = DODGE_RADIUS;
        let step: number = 0.1; // Adjust step size for smoother lines
        for (let angle: number = interval.Start; angle < interval.End; angle += step)
        {
            let x1: number = kitty.Unit.X + radius * MathF.Cos(angle);
            let y1: number = kitty.Unit.Y + radius * MathF.Sin(angle);
            let x2: number = kitty.Unit.X + radius * MathF.Cos(angle + step);
            let y2: number = kitty.Unit.Y + radius * MathF.Sin(angle + step);

            //
            let freeLightning: lightning = null;

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

    private VisualizeFreeInterval(interval: AngleInterval)
    {
        if (!laser)
        {
            return;
        }

        let radius: number = DODGE_RADIUS;
        let step: number = 0.1; // Adjust step size for smoother lines
        for (let angle: number = interval.Start; angle < interval.End; angle += step)
        {
            let x1: number = kitty.Unit.X + radius * MathF.Cos(angle);
            let y1: number = kitty.Unit.Y + radius * MathF.Sin(angle);
            let x2: number = kitty.Unit.X + radius * MathF.Cos(angle + step);
            let y2: number = kitty.Unit.Y + radius * MathF.Sin(angle + step);

            //
            let freeLightning: lightning = null;

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

    private HideAllLightnings()
    {
        for (let i: number = 0; i < usedBlockedLightnings.Count; i++)
        {
            let lightning = usedBlockedLightnings[i];
            MoveLightning(lightning, false, 0.0, 0.0, 0.0, 0.0);
            availableBlockedLightnings.Add(lightning);
        }

        usedBlockedLightnings.Clear();
    }

    private HideAllFreeLightnings()
    {
        for (let i: number = 0; i < usedClearLightnings.Count; i++)
        {
            let lightning = usedClearLightnings[i];
            MoveLightning(lightning, false, 0.0, 0.0, 0.0, 0.0);
            availableClearLightnings.Add(lightning);
        }

        usedClearLightnings.Clear();
    }

    /// <summary>
    /// Normalizes an angle (in radians) to the range [0, 2π).
    /// </summary>
    private NormalizeAngle(angle: number)
    {
        while (angle < 0)
            angle += 2 * MathF.PI;
        while (angle >= 2 * MathF.PI)
            angle -= 2 * MathF.PI;
        return angle;
    }

    /// <summary>
    /// Returns the smallest difference (in radians) between two angles.
    /// </summary>
    private AngleDifference(a: number, b: number)
    {
        let diff: number = (a - b + Math.PI) % (2 * Math.PI) - Math.PI;
        return Math.Abs(diff);
    }

    private SortAngleIntervals(List<AngleInterval> intervals)
    {
        for (let i: number = 0; i < intervals.Count - 1; i++)
        {
            for (let j: number = 0; j < intervals.Count - i - 1; j++)
            {
                if (intervals[j].Start > intervals[j + 1].Start)
                {
                    // Swap intervals[j] and intervals[j + 1]
                    let temp = intervals[j];
                    intervals[j] = intervals[j + 1];
                    intervals[j + 1] = temp;
                }
            }
        }
    }

    /// <summary>
    /// Merges overlapping angular intervals.
    /// </summary>
    private MergeIntervals(List<AngleInterval> intervals)
    {
        SortAngleIntervals(intervals);

        let current: AngleInterval = intervals[0];

        for (let i: number = 1; i < intervals.Count; i++)
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
    private class AngleInterval extends IDisposable
    {
        public Start: number;
        public End: number;

        public AngleInterval()
        {
        }

        public Dispose()
        {
            ObjectPool<AngleInterval>.ReturnObject(this);
        }
    }

    private class Point extends IDisposable
    {
        public X: number;
        public Y: number;

        public Point()
        {
        }

        public Dispose()
        {
            ObjectPool<Point>.ReturnObject(this);
        }
    }

    private IsWithinRadius(x1: number, y1: number, x2: number, y2: number, radius: number)
    {
        let distance = Math.Sqrt(((x2 - x1) * (x2 - x1)) + ((y2 - y1) * (y2 - y1)));
        return distance <= radius;
    }

    private PollMovement()
    {
        if (!enabled) return;
        elapsedTime += timerInterval;
        LearnSkills();
        UseWindWalkIfAvailable();
        MoveKittyToPosition();
    }

    private LearnSkills()
    {
        if (kitty.Unit.SkillPoints > 0)
        {
            kitty.Unit.SelectHeroSkill(Constants.ABILITY_WIND_WALK);
            kitty.Unit.SelectHeroSkill(Constants.ABILITY_AGILITY_AURA);
            kitty.Unit.SelectHeroSkill(Constants.ABILITY_ENERGY_AURA);
        }
    }

    private UseWindWalkIfAvailable()
    {
        let wwLvl = GetUnitAbilityLevel(kitty.Unit, Constants.ABILITY_WIND_WALK);

        if (wwLvl == 0 || (wwLvl == 1 && kitty.Unit.Mana < 75) || (wwLvl == 2 && kitty.Unit.Mana < 60) || (wwLvl == 3 && kitty.Unit.Mana < 45))
        {
            return;
        }

        if (Blizzard.UnitHasBuffBJ(kitty.Unit, WindwalkID)) return;

        IssueOrderBasic("windwalk");
    }
}
