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
    public bool laser = false;

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

    // Reusable dodge clusters array (9 bins for angles -4 to 4).

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

    // Rewritten GetCompositeDodgePosition using a reusable struct array instead of creating new objects.
    private (float X, float Y) GetCompositeDodgePosition(List<Wolf> wolves, ref (float X, float Y) forwardDirection)
    {
        float binSize = (float)(Math.PI / 4);
        var dodgeClusters = MemoryHandler.GetEmptyArray<ClusterData>("null", 9);

        for (int i = 0; i < dodgeClusters.Length; i++)
        {
            dodgeClusters[i] = MemoryHandler.GetEmptyObject<ClusterData>("null");
        }

        // Process each wolf.
        foreach (var wolf in wolves)
        {
            float dx = kitty.Unit.X - wolf.Unit.X;
            float dy = kitty.Unit.Y - wolf.Unit.Y;
            float dist = (float)Math.Sqrt(dx * dx + dy * dy);
            if (dist > 0)
            {
                float weight = (float)Math.Sqrt(1f / dist);
                float nx = dx / dist;
                float ny = dy / dist;
                float angle = (float)Math.Atan2(ny, nx);
                int bin = (int)Math.Round(angle / binSize);
                int index = bin + 4; // Map bin [-4,4] to array index [0,8]
                if (!dodgeClusters[index].Exists || weight > dodgeClusters[index].Weight)
                {
                    dodgeClusters[index].Exists = true;
                    dodgeClusters[index].DirX = nx;
                    dodgeClusters[index].DirY = ny;
                    dodgeClusters[index].Weight = weight;
                }
            }
        }

        // --- Incorporate Wall Repulsion ---
        var currentSafezoneId = Globals.PLAYERS_CURRENT_SAFEZONE[this.kitty.Player];
        var laneBounds = WolfArea.WolfAreas[currentSafezoneId].Rectangle;
        float laneLeft = laneBounds.Left;
        float laneRight = laneBounds.Right;
        float laneBottom = laneBounds.Bottom;
        float laneTop = laneBounds.Top;

        AddWallRepulsionStruct(kitty.Unit.X - laneLeft, 1f, 0f, dodgeClusters, binSize);
        AddWallRepulsionStruct(laneRight - kitty.Unit.X, -1f, 0f, dodgeClusters, binSize);
        AddWallRepulsionStruct(kitty.Unit.Y - laneBottom, 0f, 1f, dodgeClusters, binSize);
        AddWallRepulsionStruct(laneTop - kitty.Unit.Y, 0f, -1f, dodgeClusters, binSize);
        // --- End Wall Repulsion ---

        // If no clusters are found, default to moving forward.
        bool anyCluster = false;
        for (int i = 0; i < dodgeClusters.Length; i++)
        {
            if (dodgeClusters[i].Exists)
            {
                anyCluster = true;
                break;
            }
        }
        if (!anyCluster)
        {
            return (kitty.Unit.X + (forwardDirection.X * DODGE_RADIUS),
                    kitty.Unit.Y + (forwardDirection.Y * DODGE_RADIUS));
        }

        // Sum cluster contributions.
        float compositeX = 0f, compositeY = 0f;
        for (int i = 0; i < dodgeClusters.Length; i++)
        {
            if (dodgeClusters[i].Exists)
            {
                compositeX += dodgeClusters[i].DirX * dodgeClusters[i].Weight;
                compositeY += dodgeClusters[i].DirY * dodgeClusters[i].Weight;
            }
        }

        // Normalize the composite vector.
        float compositeMagnitude = (float)Math.Sqrt(compositeX * compositeX + compositeY * compositeY);
        if (compositeMagnitude == 0)
        {
            compositeX = 1;
            compositeY = 0;
            compositeMagnitude = 1;
        }
        compositeX /= compositeMagnitude;
        compositeY /= compositeMagnitude;

        // Normalize the forward direction.
        float forwardMagnitude = (float)Math.Sqrt(forwardDirection.X * forwardDirection.X +
                                                    forwardDirection.Y * forwardDirection.Y);
        if (forwardMagnitude == 0)
        {
            forwardDirection = (1, 0);
            forwardMagnitude = 1;
        }
        var normForward = (X: forwardDirection.X / forwardMagnitude, Y: forwardDirection.Y / forwardMagnitude);

        // Blend the composite dodge vector with the forward direction.
        float alpha = 0.7f; // 70% dodge, 30% forward
        float desiredX = compositeX * alpha + normForward.X * (1 - alpha);
        float desiredY = compositeY * alpha + normForward.Y * (1 - alpha);
        float desiredMagnitude = (float)Math.Sqrt(desiredX * desiredX + desiredY * desiredY);
        desiredX /= desiredMagnitude;
        desiredY /= desiredMagnitude;

        // Evaluate candidate dodge directions.
        float[] angles = { -30f, -15f, 0f, 15f, 30f };
        (float X, float Y)? bestCandidate = null;
        float bestDot = float.MinValue;

        foreach (var angle in angles)
        {
            float rad = angle * (float)Math.PI / 180f;
            float candX = desiredX * (float)Math.Cos(rad) - desiredY * (float)Math.Sin(rad);
            float candY = desiredX * (float)Math.Sin(rad) + desiredY * (float)Math.Cos(rad);

            float candidatePosX = kitty.Unit.X + (candX * DODGE_RADIUS);
            float candidatePosY = kitty.Unit.Y + (candY * DODGE_RADIUS);

            float penalty = 0f;
            if (!IsWithinLaneBounds(candidatePosX, candidatePosY))
            {
                penalty = -1f;
            }

            float dot = (candX * normForward.X) + (candY * normForward.Y) + penalty;
            if (dot > bestDot)
            {
                bestDot = dot;
                bestCandidate = (candX, candY);
            }
        }

        if (bestCandidate == null)
        {
            return (kitty.Unit.X, kitty.Unit.Y);
        }

        float resultX = kitty.Unit.X + (bestCandidate.Value.X * DODGE_RADIUS);
        float resultY = kitty.Unit.Y + (bestCandidate.Value.Y * DODGE_RADIUS);
        MemoryHandler.DestroyArray(dodgeClusters, true);
        return (resultX, resultY);
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
            MoveKittyToPosition();
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
