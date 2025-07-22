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
    private static bool IsStartingConditionValid = true;

    private static void TriggerEventOnLastSafeZone()
    {
        if (Gamemode.CurrentGameMode != GameMode.Standard) return; // Only occurs in Standard Gamemode.
        if (EventStarted || EventTriggered) return; // Don't trigger multiple times.
        if (!IsStartingConditionValid) return;

        List<Kitty> allKitties = Globals.ALL_KITTIES_LIST;

        if (allKitties.Count < REQUIRED_PLAYERS) return; // Need at least 2 players to trigger event.

        for (int i = 0; i < allKitties.Count - 1; i++)
        {
            if (!IsInLastSafezone(allKitties[i]))
            {
                return;
            }
        }

        TriggerEvent();
    }

    public static void TriggerEvent()
    {
        Utility.TimedTextToAllPlayers(4.0f, $"{Colors.COLOR_TURQUOISE}Chained Together Event Requirements Complete!{Colors.COLOR_RESET} {Colors.COLOR_YELLOW}Activating next round!{Colors.COLOR_RESET}");
        EventTriggered = true;
    }
    private static void UpdateStartingCondition(Kitty kitty)
    {
        int currentSafezone = kitty.CurrentSafeZone;
        List<Kitty> kitties = Globals.ALL_KITTIES_LIST;
        bool skippedSafezone = false;

        for (int i = 0; i < kitties.Count; i++)
        {
            Kitty currentKitty = kitties[i];
            if (currentKitty.CurrentSafeZone != currentSafezone - 1 && currentKitty.CurrentSafeZone != currentSafezone)
            {
                skippedSafezone = true;
                break;
            }
        }

        if (skippedSafezone)
        {
            IsStartingConditionValid = false;
        }
    }

    public static void StartEvent()
    {
        if (!EventTriggered)
        {
            IsStartingConditionValid = true;
            return;
        }

        EventStarted = true;

        try
        {
            SetGroups();
            MoveChainTimer ??= CreateTimer();
            TimerStart(MoveChainTimer, timerInterval, true, MoveChain);
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in ChainedTogether.StartEvent {e.Message}");
            throw;
        }
    }

    private static void MoveChain()
    {
        foreach (var chain in KittyLightnings.Values)
        {
            chain.Constrain();
        }
    }
    
    // Unused anyway
    private static void RegenerateGroup(string kittyName)
    {
        if (!kittyGroups.TryGetValue(kittyName, out var group)) return;
        group.RemoveAll(k => k.Name == kittyName);
        RechainGroup(group);
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
            var chain = ObjectPool.GetEmptyObject<Chain>();
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
            if (!EventStarted)
            {
                UpdateStartingCondition(kitty);
                if (IsInLastSafezone(kitty))
                    TriggerEventOnLastSafeZone();
                return;
            }
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

        DifficultyLevel level = (DifficultyLevel)Difficulty.DifficultyValue;

        var awards = Globals.GAME_AWARDS_SORTED.Auras;
        string nameOfAward;

        switch (level)
        {
            case >= DifficultyLevel.Nightmare:
                nameOfAward = nameof(awards.ChainedNightmareAura);
                break;
            case >= DifficultyLevel.Impossible:
                nameOfAward = nameof(awards.ChainedImpossibleAura);
                break;
            case >= DifficultyLevel.Hard:
                nameOfAward = nameof(awards.ChainedHardAura);
                break;
            default:
                nameOfAward = nameof(awards.ChainedNormalAura);
                break;
        }

        AwardManager.GiveReward(kitty.Player, nameOfAward);
    }

    private static bool IsInLastSafezone(Kitty kitty)
    {
        // Check if the checks made with this function can be removed by calling the
        // functions TriggerEventOnLastSafeZone and ReachedSafezone on Source\Events\VictoryZone\FinalSafezone.cs
        // I'm afraid there could be a race condition by doing so
        return kitty.CurrentSafeZone == RegionList.SafeZones.Length - 1;
    }
}

public class Chain
{
    public Kitty FirstKitty { get; private set; }
    public Kitty SecondKitty { get; private set; }
    public lightning Lightning { get; private set; }

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
        Lightning = AddLightning("WHCH", true,
            a.Unit.X, a.Unit.Y, b.Unit.X, b.Unit.Y);
    }

    public void Constrain()
    {
        float x1 = FirstKitty.Unit.X, y1 = FirstKitty.Unit.Y;
        float x2 = SecondKitty.Unit.X, y2 = SecondKitty.Unit.Y;
        float dx = x2 - x1, dy = y2 - y1;
        float dist = (float)Math.Sqrt(dx * dx + dy * dy);
        int max = GetRange("max");

        if (dist > max && dist > 0f)
        {
            float excess = dist - max;
            float nx = dx / dist, ny = dy / dist;
            bool firstCanMove = FirstKitty.Alive && !FirstKitty.Unit.IsPaused;
            bool secondCanMove = SecondKitty.Alive && !SecondKitty.Unit.IsPaused;
            float w1 = firstCanMove ? (secondCanMove ? 0.5f : 1f) : 0f;
            float w2 = secondCanMove ? (firstCanMove ? 0.5f : 1f) : 0f;

            // Move FirstKitty with terrain check
            float newX1 = nx * excess * w1;
            float newY1 = ny * excess * w1;

            if (IsTerrainPathable(FirstKitty.Unit.X + newX1, y1, PATHING_TYPE_WALKABILITY))
            {
                newX1 = 0;
            }

            if (IsTerrainPathable(x1, FirstKitty.Unit.Y + newY1, PATHING_TYPE_WALKABILITY))
            {
                newY1 = 0;
            }
          
            FirstKitty.Unit.SetPathing(false);
            FirstKitty.Unit.X += newX1;
            FirstKitty.Unit.Y += newY1;
            FirstKitty.Unit.SetPathing(true);

            // Move SecondKitty with terrain check
            float newX2 = nx * excess * w2;
            float newY2 = ny * excess * w2;
            if (IsTerrainPathable(SecondKitty.Unit.X + newX2, y2, PATHING_TYPE_WALKABILITY))
            {
                newX2 = 0;
            }

            if (IsTerrainPathable(x2, SecondKitty.Unit.Y + newY2, PATHING_TYPE_WALKABILITY))
            {
                newY2 = 0;
            }

            SecondKitty.Unit.SetPathing(false);
            SecondKitty.Unit.X -= newX2;
            SecondKitty.Unit.Y -= newY2;
            SecondKitty.Unit.SetPathing(true);
        }

        // update lightning and color
        MoveLightning(Lightning, true,
            FirstKitty.Unit.X, FirstKitty.Unit.Y,
            SecondKitty.Unit.X, SecondKitty.Unit.Y);
        UpdateColor(dist);
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
        Lightning?.Dispose();
        FirstKitty.IsChained = false;
        SecondKitty.IsChained = false;
        ObjectPool.ReturnObject(this);
    }
}
