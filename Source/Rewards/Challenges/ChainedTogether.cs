using System;
using System.Collections.Generic;
using System.Linq;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class ChainedTogether
{
    private static Dictionary<string, Chain> KittyLightnings = new Dictionary<string, Chain>();
    private static List<List<Kitty>> kittyGroups = new List<List<Kitty>>(); // Convert this into a dictionary
    private static float timerInterval = 0.1f;
    private static Random rng = Globals.RANDOM_GEN;
    private static timer MoveChainTimer;
    private static bool EventTriggered { get; set; } = false;
    private static bool EventStarted { get; set; } = false;
    private static bool IsStartingContidionValid = true;


    private static void TriggerEventOnLastSafeZone()
    {
        if (Gamemode.CurrentGameMode != "Standard") return; // Only occurs in Standard Gamemode.
        if (EventStarted || EventTriggered) return; // Don't trigger multiple times.
        if (!IsStartingContidionValid) return;

        List<Kitty> allKitties = Globals.ALL_KITTIES_LIST;

        if (allKitties.Count < 2) return; // Need at least 2 players to trigger event.

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
        Utility.TimedTextToAllPlayers(4.0f, $"{Colors.COLOR_YELLOW}Chained Togheter Event Requirements Complete! Activating next round!{Colors.COLOR_RESET}");
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
            IsStartingContidionValid = false;
        }
    }

    /// <summary>
    /// Starts the event
    /// </summary>
    public static void StartEvent()
    {
        if (!EventTriggered)
        {
            IsStartingContidionValid = true;
            return;
        }

        EventStarted = true;

        try
        {
            SetGroups();
            MoveChainTimer ??= CreateTimer();
            TimerStart(MoveChainTimer, timerInterval, true, ErrorHandler.Wrap(MoveChain));

        }

        catch (Exception e)
        {
            Logger.Warning($"Error in ChainedTogether.StartEvent {e.Message}");
            throw;
        }
    }

    private static void MoveChain()
    {
        var kitties = Globals.ALL_KITTIES_LIST;
        bool isOutOfRange = false;
        string kittyOutOfRange = "";

        for (int i = 0; i < kitties.Count - 1; i++)
        {
            var kitty = kitties[i];
            var kittyName = kitty.Name;

            if (!KittyLightnings.ContainsKey(kittyName)) continue;

            var chain = KittyLightnings[kittyName];
            isOutOfRange = chain.Move();
            kittyOutOfRange = kittyName;

            if (isOutOfRange) break;
        }

        if (isOutOfRange)
        {
            LoseEvent(kittyOutOfRange);
        }
    }

    public static void LoseEvent(string kittyNameOutSideRange)
    {
        if (!EventStarted) return; // Event not started or already ended.

        try
        {
            FreeKittiesFromGroup(kittyNameOutSideRange, false);
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in ChainedTogether.LoseEvent {e.Message}");
            throw;
        }
    }

    /// <summary>
    /// Purpose is to regenerate the group chains if a player leaves the game or disconnects.
    /// </summary>
    /// <param name="kittyName"></param>
    public static void RegenerateGroup(string kittyName)
    {
        int groupIndex = kittyGroups.FindIndex(group => group.Any(kitty => kitty.Name == kittyName)); // IEnumerable "Any" leaks
        if (groupIndex < 0) return;

        try
        {
            var currentGroup = kittyGroups[groupIndex].Where(kitty => kitty.Name != kittyName).ToList(); // Where and ToList are IEnumerable or Creating a new Object  .. LEAKS

            FreeKittiesFromGroup(kittyName, false);

            for (int j = 0; j < currentGroup.Count - 1; j++)
            {
                var currentKitty = currentGroup[j];
                var nextKitty = currentGroup[j + 1];

                currentKitty.IsChained = true;
                Chain chain = ObjectPool.GetEmptyObject<Chain>();
                chain.SetKitties(currentKitty, nextKitty);
                KittyLightnings[currentKitty.Name] = chain;
            }

            kittyGroups.Add(currentGroup);
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in ChainedTogether.LoseEvent {e.Message}");
            throw;
        }
    }

    private static void FreeKittiesFromGroup(string kittyName, bool isVictory = false)
    {
        int groupIndex = kittyGroups.FindIndex(group => group.Any(kitty => kitty.Name == kittyName)); //IEnumerable with "Any" leaks
        if (groupIndex < 0) return;

        var currentGroup = kittyGroups[groupIndex];

        for (int i = 0; i < currentGroup.Count; i++)
        {
            var kitty = currentGroup[i];
            kitty.IsChained = false;

            if (isVictory)
            {
                AwardChainedTogether(kitty);
            }

            if (KittyLightnings.ContainsKey(kitty.Name))
            {
                KittyLightnings[kitty.Name].Dispose();
                KittyLightnings.Remove(kitty.Name);
            }
        }

        kittyGroups.RemoveAt(groupIndex);
    }


    private static void SetGroups()
    {
        var allKitties = Globals.ALL_KITTIES_LIST;
        int count = allKitties.Count;

        // Shuffle the kitties list to ensure randomness
        for (int i = allKitties.Count - 1; i > 0; i--)
        {
            int j = rng.Next(i + 1);
            Kitty temp = allKitties[i];
            allKitties[i] = allKitties[j];
            allKitties[j] = temp;
        }

        if (count < 3)
        {
            kittyGroups.Add(allKitties);
            ChainGroup(allKitties);

        }

        int index = 0;
        int groupsOfThree = count / 3;
        int remainder = count % 3;

        if (remainder == 1)
        {
            // convert two groups of 3 into two groups of 4 to avoid a group of 1
            groupsOfThree -= 1;
            remainder += 3;
        }

        for (int i = 0; i < groupsOfThree; i++)
        {
            var group = new List<Kitty> { allKitties[index], allKitties[index + 1], allKitties[index + 2] };
            kittyGroups.Add(group);
            ChainGroup(group);
            index += 3;
        }

        if (remainder > 0)
        {
            var lastGroup = new List<Kitty>();
            for (int i = index; i < allKitties.Count; i++)
            {
                lastGroup.Add(allKitties[i]);
            }
            kittyGroups.Add(lastGroup);
            ChainGroup(lastGroup);
        }
    }
    
    private static void ChainGroup(List<Kitty> group)
    {
        for (int j = 0; j < group.Count - 1; j++)
        {
            var currentKitty = group[j];
            var nextKitty = group[j + 1];

            currentKitty.IsChained = true;
            Chain chain = ObjectPool.GetEmptyObject<Chain>();
            chain.SetKitties(currentKitty, nextKitty);
            KittyLightnings[currentKitty.Name] = chain;
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
                {
                    TriggerEventOnLastSafeZone();
                }
                return; // Event not started or already ended.
            }

            if (!IsInLastSafezone(kitty)) return;

            //finish event
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

        int award;

        switch (level)
        {
            case >= DifficultyLevel.Nightmare:
                award = Globals.GAME_AWARDS_SORTED.Auras.ChainedNightmareAura;
                break;
            case >= DifficultyLevel.Impossible:
                award = Globals.GAME_AWARDS_SORTED.Auras.ChainedImpossibleAura;
                break;
            case >= DifficultyLevel.Hard:
                award = Globals.GAME_AWARDS_SORTED.Auras.ChainedHardAura;
                break;
            default:
                award = Globals.GAME_AWARDS_SORTED.Auras.ChainedNormalAura;
                break;
        }

        AwardManager.GiveReward(kitty.Player, nameof(award));
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
    public Kitty FirstKitty { get; set; }
    public Kitty SecondKitty { get; set; }
    public lightning Lightning { get; set; }

    private static readonly Dictionary<DifficultyLevel, (int good, int far, int breakPoint)> ranges = new()
    {
        { DifficultyLevel.Normal,     (400, 600, 800) },
        { DifficultyLevel.Hard,       (450, 650, 850) },
        { DifficultyLevel.Impossible, (500, 700, 900) },
        { DifficultyLevel.Nightmare,  (550, 750, 950) }
    };

    public Chain()
    {
    }

    public void SetKitties(Kitty firstKitty, Kitty secondKitty)
    {
        FirstKitty = firstKitty;
        SecondKitty = secondKitty;
        Lightning?.Dispose(); // just incase
        Lightning = AddLightning("WHCH", true, FirstKitty.Unit.X, FirstKitty.Unit.Y, SecondKitty.Unit.X, SecondKitty.Unit.Y);
        FirstKitty.IsChained = true;
        SecondKitty.IsChained = true;
    }

    public bool Move()
    {
        int outOfRange = CalculateRangeByDifficulty("breakPoint");
        bool isOutOfRange = false;
        var x1 = FirstKitty.Unit.X;
        var y1 = FirstKitty.Unit.Y;
        var x2 = SecondKitty.Unit.X;
        var y2 = SecondKitty.Unit.Y;
        MoveLightning(Lightning, true, FirstKitty.Unit.X, FirstKitty.Unit.Y, SecondKitty.Unit.X, SecondKitty.Unit.Y);
        float distance = Math.Abs(x2 - x1) + Math.Abs(y2 - y1);

        if (distance > outOfRange)
        {
            isOutOfRange = true;
        }

        ChangeChainColor(distance);
        return isOutOfRange;
    }

    public void Dispose()
    {
        Lightning?.Dispose();
        FirstKitty.IsChained = false;
        SecondKitty.IsChained = false;
        ObjectPool.ReturnObject(this);
    }

    public void ChangeChainColor(float distance)
    {
        float red = 0.0f, green = 1.0f, blue = 0.0f, alpha = 1.0f; // Default color is green

        int far = CalculateRangeByDifficulty("far");
        int good = CalculateRangeByDifficulty("good");

        if (distance > far)
        {
            red = 1.0f; green = 0.0f; blue = 0.0f; // Red
        }
        else if (distance > good)
        {
            red = 1.0f; green = 1.0f; blue = 0.0f; // Yellow
        }

        SetLightningColor(Lightning, red, green, blue, alpha);
    }

    public static int CalculateRangeByDifficulty(string rangeType)
    {
        DifficultyLevel level = (DifficultyLevel)Difficulty.DifficultyValue;

        (int good, int far, int breakPoint) selectedRange;

        switch (level)
        {
            case >= DifficultyLevel.Nightmare:
                selectedRange = ranges[DifficultyLevel.Nightmare];
                break;
            case >= DifficultyLevel.Impossible:
                selectedRange = ranges[DifficultyLevel.Impossible];
                break;
            case >= DifficultyLevel.Hard:
                selectedRange = ranges[DifficultyLevel.Hard];
                break;
            default:
                selectedRange = ranges[DifficultyLevel.Normal];
                break;
        }

        switch (rangeType)
        {
            case "good":
                return selectedRange.good;
            case "far":
                return selectedRange.far;
            case "breakPoint":
                return selectedRange.breakPoint;
            default:
                throw new ArgumentException($"Invalid rangeType '{rangeType}'");
        }
    }
}
