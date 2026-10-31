using System;
using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class ChainedTogether
{
    private const int REQUIRED_PLAYERS = 2;
    private static Dictionary<string, Chain> KittyLightnings = new Dictionary<string, Chain>();
    private static Dictionary<string, List<Kitty>> kittyGroups = new Dictionary<string, List<Kitty>>();
    private static float timerInterval = 0.01f;
    private static Random rng = Globals.RANDOM_GEN;
    private static timer MoveChainTimer;
    private static bool EventTriggered { get; set; } = false;
    private static bool EventStarted { get; set; } = false;

    public static void OnRoundWon()
    {
        if (Gamemode.CurrentGameMode != GameMode.Standard) return;
        if (EventStarted || EventTriggered) return;
        if (Globals.ROUND >= Gamemode.NumberOfRounds) return; // no next round to chain

        if (CountPlayers() < REQUIRED_PLAYERS) return;

        var all = Globals.ALL_KITTIES_LIST;
        int lastSafezone = RegionList.SafeZones.Length - 1;

        for (int i = 0; i < all.Count; i++)
        {
            var k = all[i];
            if (k.ComputerControlled) continue;
            if (k.CurrentSafeZone < lastSafezone) return; // somebody never reached the last safezone: not a clean win
        }

        TriggerEvent();
    }

    /// <summary>Human players in the game.</summary>
    private static int CountPlayers()
    {
        int count = 0;
        var all = Globals.ALL_KITTIES_LIST;

        for (int i = 0; i < all.Count; i++)
        {
            if (!all[i].ComputerControlled) count++;
        }

        return count;
    }

    public static void TriggerEvent()
    {
        Utility.TimedTextToAllPlayers(4.0f,
            $"{Colors.COLOR_TURQUOISE}Clean win! Chained Together Event Requirements Complete!{Colors.COLOR_RESET} {Colors.COLOR_YELLOW}Activating next round!{Colors.COLOR_RESET}");
        EventTriggered = true;
    }

    public static void StartEvent()
    {
        if (!EventTriggered) return;
        if (EventStarted) return; // no reason to begin this again.

        // players may have left between the win and now
        if (CountPlayers() < REQUIRED_PLAYERS)
        {
            EventTriggered = false;
            Utility.TimedTextToAllPlayers(4.0f, $"{Colors.COLOR_YELLOW}Chained Together cancelled: it needs at least {REQUIRED_PLAYERS} players.{Colors.COLOR_RESET}");
            return;
        }

        EventStarted = true;
        try
        {
            SetGroups();
            MoveChainTimer ??= CreateTimer();
            TimerStart(MoveChainTimer, timerInterval, true, MoveChain);
            Utility.SimpleTimer(3.5f, () => Utility.TimedTextToAllPlayers(10.0f,
                $"{Colors.COLOR_YELLOW}You may opt out of the chained together event by typing {Colors.COLOR_CYAN}-nochain{Colors.COLOR_RESET} {Colors.COLOR_RED} (must be before round starts).{Colors.COLOR_RESET}"));
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in ChainedTogether.StartEvent {e.Message}");
            throw;
        }
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

    private static void RegenerateGroup(string kittyName)
    {
        if (!kittyGroups.TryGetValue(kittyName, out var group)) return;
        group.RemoveAll(k => k.Name == kittyName);
        RechainGroup(group);
    }

    /// <summary>
    /// This function will unchain all kitties and dispose of the chain objects. Should be called on <see cref="RoundManager.RoundEnd"/>
    /// </summary>
    public static void UnchainAllKitties()
    {
        // A chained round just ended (won, lost or timed out): the event is over and a new clean win can arm it again.
        // (A round that was only armed, not yet chained, keeps its arming for the round to come.)
        if (EventStarted)
        {
            EventStarted = false;
            EventTriggered = false;
            kittyGroups.Clear();
        }

        foreach(var kitty in Globals.ALL_KITTIES_LIST)
        {
            kitty.IsChained = false;
            if (KittyLightnings.TryGetValue(kitty.Name, out var chain))
            {
                chain.Dispose();
                KittyLightnings.Remove(kitty.Name);
            }
        }

    }

    public static void OptOutOfChain(Kitty kitty)
    {
        try
        {
            if (!kitty.IsChained) return;
            if (!kittyGroups.TryGetValue(kitty.Name, out var group)) return;

            // Dispose every chain link in this group first so we never
            // overwrite a KittyLightnings entry without freeing the old Chain.
            DisposeGroupChains(group);

            group.Remove(kitty);
            kittyGroups.Remove(kitty.Name);
            kitty.IsChained = false;

            if (group.Count == 1)
            {
                var solo = group[0];
                kittyGroups.Remove(solo.Name);
                RegroupSoloKitty(solo);
            }
            else if (group.Count >= 2)
            {
                RechainGroup(group);
            }
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in ChainedTogether.OptOutOfChain {e.Message}");
            throw;
        }
    }

    private static void DisposeGroupChains(List<Kitty> group)
    {
        for (int i = 0; i < group.Count - 1; i++)
        {
            var key = group[i].Name;
            if (KittyLightnings.TryGetValue(key, out var chain))
            {
                chain.Dispose();
                KittyLightnings.Remove(key);
            }
        }
    }

    private static void RegroupSoloKitty(Kitty solo)
    {
        List<Kitty> targetGroup = null;
        foreach (var g in kittyGroups.Values)
        {
            if (g.Count == 0 || g.Contains(solo)) continue;
            targetGroup = g;
            break; 
        }

        if (targetGroup == null)
        {
            // No other group exist — solo kitty just travels unchained
            return;
        }

        targetGroup.Add(solo);
        kittyGroups[solo.Name] = targetGroup;

        // Only chain the new link (previous last member -> solo).
        // Existing chains in targetGroup are untouched.
        var previousLast = targetGroup[targetGroup.Count - 2];
        var newChain = ObjectPool<Chain>.GetEmptyObject();
        newChain.SetKitties(previousLast, solo);
        previousLast.IsChained = true;
        solo.IsChained = true;
        KittyLightnings[previousLast.Name] = newChain;
    }

    private static void FreeKittiesFromGroup(string kittyName, bool isVictory = false)
    {
        if (!kittyGroups.TryGetValue(kittyName, out var group)) return;
        foreach (var k in group)
        {
            k.IsChained = false;
            if (KittyLightnings.TryGetValue(k.Name, out var c))
            {
                c.Dispose();
                KittyLightnings.Remove(k.Name);
            }
            if (isVictory) AwardChainedTogether(k);
        }
        foreach (var k in group) kittyGroups.Remove(k.Name);
    }

    private static void SetGroups()
    {
        var all = new List<Kitty>(Globals.ALL_KITTIES_LIST);
        int count = all.Count;
        for (int i = count - 1; i > 0; i--)
        {
            int j = rng.Next(i + 1);
            var temp = all[i];
            all[i] = all[j];
            all[j] = temp;
        }

        List<List<Kitty>> groups = new();
        if (count < 3)
            groups.Add(all);
        else
        {
            int groupsOfThree = count / 3;
            int rem = count % 3;
            if (rem == 1)
            {
                groupsOfThree--;
                rem += 3;
            }
            int idx = 0;
            for (int i = 0; i < groupsOfThree; i++)
            {
                groups.Add(all.GetRange(idx, 3));
                idx += 3;
            }
            if (idx < count)
                groups.Add(all.GetRange(idx, count - idx));
        }

        foreach (var g in groups)
            RechainGroup(g);
    }

    private static void RechainGroup(List<Kitty> group)
    {
        for (int i = 0; i < group.Count - 1; i++)
        {
            var a = group[i];
            var b = group[i + 1];
            a.IsChained = b.IsChained = true;
            var chain = ObjectPool<Chain>.GetEmptyObject();
            chain.SetKitties(a, b);
            KittyLightnings[a.Name] = chain;
            kittyGroups[a.Name] = group;
            kittyGroups[b.Name] = group;
        }
    }

    public static void ReachedSafezone(Kitty kitty)
    {
        try
        {
            if (!EventStarted) return;
            if (!IsInLastSafezone(kitty)) return;
            FreeKittiesFromGroup(kitty.Name, true);
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in ChainedTogether.ReachedSafezone {e.Message}");
            throw;
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
        Lightning?.Dispose();

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
        if (registered)
        {
            registered = false;
            Active.Remove(this);
        }

        Lightning?.Dispose();
        FirstKitty.IsChained = false;
        SecondKitty.IsChained = false;
        ObjectPool<Chain>.ReturnObject(this);
    }
}
