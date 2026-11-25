using System;
using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

/// <summary>
/// Chains between kitties, created by the Ring of Linked Fates (<see cref="ChainRing"/>).
/// Reaching the last safezone while linked by rings awards the Chained auras.
/// </summary>
public static class ChainedTogether
{
    private static float timerInterval = 0.01f;
    private static timer MoveChainTimer;
    private static bool MoveChainTimerRunning = false;
    private static readonly List<Chain> RingChains = new List<Chain>();
    private static readonly List<Kitty> RingReach = new List<Kitty>();
    private static readonly List<int> RingParent = new List<int>();
    private static readonly List<Kitty> NetworkBuffer = new List<Kitty>();

    private static void StartMoveChainTimer()
    {
        if (MoveChainTimerRunning) return;
        MoveChainTimer ??= CreateTimer();
        TimerStart(MoveChainTimer, timerInterval, true, MoveChain);
        MoveChainTimerRunning = true;
    }

    private static void MoveChain()
    {
        // a plain list and an index loop: this runs a hundred times a second
        var active = Chain.Active;

        for (int i = 0; i < active.Count; i++)
        {
            active[i].Constrain();
        }
    }

    /// <summary>
    /// Disposes every chain and switches every ring off. Should be called on <see cref="RoundManager.RoundEnd"/>
    /// </summary>
    public static void UnchainAllKitties()
    {
        for (int i = 0; i < RingChains.Count; i++) RingChains[i].Dispose();
        RingChains.Clear();

        for (int i = 0; i < Globals.ALL_KITTIES_LIST.Count; i++)
            Globals.ALL_KITTIES_LIST[i].IsChained = false;

        ChainRing.ResetAll();
    }

    /// <summary>
    /// Links the toggler to every enabled kitty within <paramref name="range"/>, and through them to everyone else reachable the same way.
    /// Every new link is at most <paramref name="range"/> long (below the chain max), so nobody gets pulled on connect. Existing ring links are kept.
    /// </summary>
    /// <returns>Number of other kitties in the toggler's ring network, 0 if it couldn't chain.</returns>
    public static int JoinRingChain(Kitty toggler, List<Kitty> enabled, float range)
    {
        try
        {
            float rangeSq = range * range;
            RingReach.Clear();
            RingReach.Add(toggler);

            for (int r = 0; r < RingReach.Count; r++)
            {
                var from = RingReach[r];
                for (int i = 0; i < enabled.Count; i++)
                {
                    var k = enabled[i];
                    if (RingReach.Contains(k) || !CanRingChain(k)) continue;
                    if (DistanceSqBetween(from, k) <= rangeSq || HasRingLink(from, k)) RingReach.Add(k);
                }
            }

            RingParent.Clear();
            for (int i = 0; i < RingReach.Count; i++) RingParent.Add(i);
            for (int c = 0; c < RingChains.Count; c++)
            {
                int a = RingReach.IndexOf(RingChains[c].FirstKitty);
                int b = RingReach.IndexOf(RingChains[c].SecondKitty);
                if (a >= 0 && b >= 0) RingParent[RingFind(a)] = RingFind(b);
            }

            // Shortest links first, joining separate parts until the whole reach is one network.
            while (true)
            {
                int bestA = -1, bestB = -1;
                float best = float.MaxValue;
                for (int i = 0; i < RingReach.Count; i++)
                {
                    for (int j = i + 1; j < RingReach.Count; j++)
                    {
                        if (RingFind(i) == RingFind(j)) continue;
                        float d = DistanceSqBetween(RingReach[i], RingReach[j]);
                        if (d > rangeSq || d >= best) continue;
                        best = d;
                        bestA = i;
                        bestB = j;
                    }
                }
                if (bestA < 0) break;

                var first = RingReach[bestA];
                var second = RingReach[bestB];
                var chain = ObjectPool<Chain>.GetEmptyObject();
                chain.SetKitties(first, second);
                RingChains.Add(chain);
                first.IsChained = second.IsChained = true;
                RingParent[RingFind(bestA)] = RingFind(bestB);
            }

            StartMoveChainTimer();
            return IsRingChained(toggler) ? RingReach.Count - 1 : 0;
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in ChainedTogether.JoinRingChain {e.Message}");
            return 0;
        }
    }

    /// <summary>
    /// Removes every ring link of the kitty. Other links in its network stay.
    /// </summary>
    public static void LeaveRingChain(Kitty kitty)
    {
        bool removed = false;
        for (int i = RingChains.Count - 1; i >= 0; i--)
        {
            var chain = RingChains[i];
            if (chain.FirstKitty != kitty && chain.SecondKitty != kitty) continue;
            RingChains.RemoveAt(i);
            chain.Dispose();
            removed = true;
        }
        if (!removed) return;

        // Chain.Dispose clears the flag on both ends, even if they still have other links.
        for (int i = 0; i < RingChains.Count; i++)
            RingChains[i].FirstKitty.IsChained = RingChains[i].SecondKitty.IsChained = true;
    }

    private static bool CanRingChain(Kitty k) => k != null && k.Alive;

    private static bool IsRingChained(Kitty k)
    {
        for (int i = 0; i < RingChains.Count; i++)
            if (RingChains[i].FirstKitty == k || RingChains[i].SecondKitty == k) return true;
        return false;
    }

    private static bool HasRingLink(Kitty a, Kitty b)
    {
        for (int i = 0; i < RingChains.Count; i++)
        {
            var c = RingChains[i];
            if ((c.FirstKitty == a && c.SecondKitty == b) || (c.FirstKitty == b && c.SecondKitty == a)) return true;
        }
        return false;
    }

    private static int RingFind(int i)
    {
        while (RingParent[i] != i) i = RingParent[i];
        return i;
    }

    private static float DistanceSqBetween(Kitty a, Kitty b)
    {
        float dx = a.Unit.X - b.Unit.X, dy = a.Unit.Y - b.Unit.Y;
        return dx * dx + dy * dy;
    }

    /// <summary>
    /// Reaching the last safezone while linked by rings awards the Chained aura to everyone alive in that ring network,
    /// then frees them so they can walk to the victory zone on their own.
    /// </summary>
    public static void ReachedSafezone(Kitty kitty)
    {
        try
        {
            if (!Globals.GAME_ACTIVE) return;
            if (!IsInLastSafezone(kitty) || !IsRingChained(kitty)) return;

            CollectRingNetwork(kitty, NetworkBuffer);
            for (int i = 0; i < NetworkBuffer.Count; i++)
            {
                if (NetworkBuffer[i].Alive) AwardChainedTogether(NetworkBuffer[i]);
            }

            for (int i = 0; i < NetworkBuffer.Count; i++) ChainRing.DisableFor(NetworkBuffer[i]);
            NetworkBuffer.Clear();
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in ChainedTogether.ReachedSafezone {e.Message}");
            throw;
        }
    }

    /// <summary>Fills <paramref name="result"/> with the kitty and everyone reachable from it through ring links.</summary>
    private static void CollectRingNetwork(Kitty start, List<Kitty> result)
    {
        result.Clear();
        result.Add(start);
        for (int r = 0; r < result.Count; r++)
        {
            var from = result[r];
            for (int c = 0; c < RingChains.Count; c++)
            {
                var chain = RingChains[c];
                Kitty other = chain.FirstKitty == from ? chain.SecondKitty : chain.SecondKitty == from ? chain.FirstKitty : null;
                if (other != null && !result.Contains(other)) result.Add(other);
            }
        }
    }

    private static void AwardChainedTogether(Kitty kitty)
    {
        Utility.CreateSimpleTextTag($"{Colors.COLOR_RED}Chained Together!{Colors.COLOR_RESET}", 2.0f, kitty.Unit);
        DifficultyLevel lvl = DifficultyConfig.GetVirtualDifficulty(Globals.ROUND);

        string awardName = GetChainedAwardName(lvl);
        AwardManager.GiveReward(kitty.Player, awardName);
    }

    internal static string GetChainedAwardName(DifficultyLevel lvl) => lvl switch
    {
        DifficultyLevel.Nightmare  => nameof(Globals.GAME_AWARDS_SORTED.Auras.ChainedNightmareAura),
        DifficultyLevel.Impossible => nameof(Globals.GAME_AWARDS_SORTED.Auras.ChainedImpossibleAura),
        DifficultyLevel.Hard       => nameof(Globals.GAME_AWARDS_SORTED.Auras.ChainedHardAura),
        _                          => nameof(Globals.GAME_AWARDS_SORTED.Auras.ChainedNormalAura)
    };

    private static bool IsInLastSafezone(Kitty k) =>
        k.CurrentSafeZone == RegionList.SafeZones.Length - 1;
}

public class Chain
{
    public Kitty FirstKitty { get; private set; }
    public Kitty SecondKitty { get; private set; }
    public lightning Lightning { get; private set; }

    /// <summary>Every chain that exists right now, for the constraint timer to walk without a dictionary.</summary>
    public static readonly List<Chain> Active = new List<Chain>();
    private bool registered;
    private bool inUse;

    private static readonly Dictionary<DifficultyLevel, (int good, int far, int max)> Ranges = new()
    {
        { DifficultyLevel.Normal,     (600, 700, 800) },
        { DifficultyLevel.Hard,       (650, 750, 850) },
        { DifficultyLevel.Impossible, (700, 800, 900) },
        { DifficultyLevel.Nightmare,  (750, 850, 950) }
    };

    public void SetKitties(Kitty a, Kitty b)
    {
        FirstKitty = a;
        SecondKitty = b;
        inUse = true;
        Lightning?.Dispose();
        Lightning = null;

        // drawn between where the players see their Kitties: the effects in async, the units otherwise
        AsyncZones.WhereToDraw(a.Unit, out var ax, out var ay);
        AsyncZones.WhereToDraw(b.Unit, out var bx, out var by);
        Lightning = AddLightning("WHCH", true, ax, ay, bx, by);

        if (!registered)
        {
            registered = true;
            Active.Add(this);
        }
    }

    public void Constrain()
    {
        // The leash is judged on where the Kitties are for game logic: the same on every machine. In
        // async that is their effect (see AsyncZones.LogicPosition), so the chain holds what the
        // players see, not the unit trailing behind it.
        AsyncZones.LogicPosition(FirstKitty.Unit, out var x1, out var y1);
        AsyncZones.LogicPosition(SecondKitty.Unit, out var x2, out var y2);
        float dx = x2 - x1, dy = y2 - y1;
        float dist = SquareRoot(dx * dx + dy * dy);
        int max = GetRange("max");

        if (dist > max && dist > 0f)
        {
            float excess = dist - max;
            float nx = dx / dist, ny = dy / dist;
            bool firstKittyCanMove = FirstKitty.Alive && !FirstKitty.Unit.IsPaused;
            bool secondKittyCanMove = SecondKitty.Alive && !SecondKitty.Unit.IsPaused;
            float w1 = firstKittyCanMove ? (secondKittyCanMove ? 0.5f : 1f) : 0f;
            float w2 = secondKittyCanMove ? (firstKittyCanMove ? 0.5f : 1f) : 0f;

            Pull(FirstKitty, x1, y1, nx * excess * w1, ny * excess * w1);
            Pull(SecondKitty, x2, y2, -nx * excess * w2, -ny * excess * w2);
        }

        // lightning and colour: drawn on what each player sees, a local picture only
        AsyncZones.WhereToDraw(FirstKitty.Unit, out var drawX1, out var drawY1);
        AsyncZones.WhereToDraw(SecondKitty.Unit, out var drawX2, out var drawY2);
        MoveLightning(Lightning, true, drawX1, drawY1, drawX2, drawY2);
        UpdateColor(dist);
    }

    /// <summary>
    /// Moves a Kitty by the pull: its unit, and its effect with it when one stands in, by the same
    /// amount, so the gap between the two is kept and nothing snaps. Only when the new place is open ground.
    /// </summary>
    private static void Pull(Kitty kitty, float logicX, float logicY, float pullX, float pullY)
    {
        if (pullX == 0f && pullY == 0f) return;

        if (IsTerrainPathable(logicX + pullX, logicY + pullY, pathingtype.Walkability)) return;

        float unitX = kitty.Unit.X + pullX;
        float unitY = kitty.Unit.Y + pullY;
        if (IsTerrainPathable(unitX, unitY, pathingtype.Walkability)) return;

        kitty.Unit.X = unitX;
        kitty.Unit.Y = unitY;
        kitty.AsyncEffect?.Nudge(pullX, pullY);
    }

    private void UpdateColor(float dist)
    {
        int good = GetRange("good"), far = GetRange("far");
        float r = 0f, g = 1f, b = 0f, a = 1f;
        if (dist > far) { r = 1f; g = 0f; b = 0f; }
        else if (dist > good) { r = 1f; g = 1f; b = 0f; }
        SetLightningColor(Lightning, r, g, b, a);
    }

    private static int GetRange(string type)
    {
        DifficultyLevel lvl = (DifficultyLevel)Difficulty.DifficultyValue;
        var key = lvl >= DifficultyLevel.Nightmare
            ? DifficultyLevel.Nightmare
            : lvl >= DifficultyLevel.Impossible
                ? DifficultyLevel.Impossible
                : lvl >= DifficultyLevel.Hard
                    ? DifficultyLevel.Hard
                    : DifficultyLevel.Normal;
        var tuple = Ranges[key];
        return type switch
        {
            "good" => tuple.good,
            "far" => tuple.far,
            "max" => tuple.max,
            _ => throw new ArgumentException($"Invalid range type {type}")
        };
    }

    public void Dispose()
    {
        // twice would put the object in the pool twice: two links sharing one, and one of them not drawn
        if (!inUse) return;
        inUse = false;

        if (registered)
        {
            registered = false;
            Active.Remove(this);
        }

        // the handle is let go of: a recycled one could be another link's lightning if disposed again
        Lightning?.Dispose();
        Lightning = null;
        FirstKitty.IsChained = false;
        SecondKitty.IsChained = false;
        ObjectPool<Chain>.ReturnObject(this);
    }
}
