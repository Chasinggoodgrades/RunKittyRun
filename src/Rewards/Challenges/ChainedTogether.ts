

class ChainedTogether
{
    private REQUIRED_PLAYERS: number = 2;
    private static Dictionary<string, Chain> KittyLightnings = new Dictionary<string, Chain>();
    private static List<List<Kitty>> kittyGroups = new List<List<Kitty>>(); // Convert this into a dictionary
    private static timerInterval: number = 0.1;
    private static rng: Random = Globals.RANDOM_GEN;
    private static MoveChainTimer: timer;
    private static EventTriggered: boolean = false;
    private static EventStarted: boolean = false;
    private static IsStartingContidionValid: boolean = true;

    private static TriggerEventOnLastSafeZone()
    {
        if (Gamemode.CurrentGameMode != GameMode.Standard) return; // Only occurs in Standard Gamemode.
        if (EventStarted || EventTriggered) return; // Don't trigger multiple times.
        if (!IsStartingContidionValid) return;

        List<Kitty> allKitties = Globals.ALL_KITTIES_LIST;

        if (allKitties.Count < REQUIRED_PLAYERS) return; // Need at least 2 players to trigger event.

        for (let i: number = 0; i < allKitties.Count - 1; i++)
        {
            if (!IsInLastSafezone(allKitties[i]))
            {
                return;
            }
        }

        TriggerEvent();
    }

    public static TriggerEvent()
    {
        Utility.TimedTextToAllPlayers(4.0, "{Colors.COLOR_TURQUOISE}Togheter: Event: Requirements: Complete: Chained!{Colors.COLOR_RESET} {Colors.COLOR_YELLOW}next: round: Activating!{Colors.COLOR_RESET}");
        EventTriggered = true;
    }

    private static UpdateStartingCondition(kitty: Kitty)
    {
        let currentSafezone: number = kitty.CurrentSafeZone;
        List<Kitty> kitties = Globals.ALL_KITTIES_LIST;
        let skippedSafezone: boolean = false;

        for (let i: number = 0; i < kitties.Count; i++)
        {
            let currentKitty: Kitty = kitties[i];
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
    public static StartEvent()
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
            TimerStart(MoveChainTimer, timerInterval, true, MoveChain);

        }

        catch (e: Error)
        {
            Logger.Warning("Error in ChainedTogether.StartEvent {e.Message}");
            throw new Error() // TODO; Rethrow actual error
        }
    }

    private static MoveChain()
    {
        let kitties = Globals.ALL_KITTIES_LIST;
        let isOutOfRange: boolean = false;
        let kittyOutOfRange: string = "";

        for (let i: number = 0; i < kitties.Count - 1; i++)
        {
            let kitty = kitties[i];
            let kittyName = kitty.Name;

            if (!KittyLightnings.ContainsKey(kittyName)) continue;

            let chain = KittyLightnings[kittyName];
            isOutOfRange = chain.Move();
            kittyOutOfRange = kittyName;

            if (isOutOfRange) break;
        }

        if (isOutOfRange)
        {
            LoseEvent(kittyOutOfRange);
        }
    }

    public static LoseEvent(kittyNameOutSideRange: string)
    {
        if (!EventStarted) return; // Event not started or already ended.

        try
        {
            FreeKittiesFromGroup(kittyNameOutSideRange, false);
        }
        catch (e: Error)
        {
            Logger.Warning("Error in ChainedTogether.LoseEvent {e.Message}");
            throw new Error() // TODO; Rethrow actual error
        }
    }

    /// <summary>
    /// Purpose is to regenerate the group chains if a player leaves the game or disconnects.
    /// </summary>
    /// <param name="kittyName"></param>
    public static RegenerateGroup(kittyName: string)
    {
        let groupIndex: number = kittyGroups.FindIndex(group => group.Any(kitty => kitty.Name == kittyName)); // IEnumerable "Any" leaks
        if (groupIndex < 0) return;

        try
        {
            let currentGroup = kittyGroups[groupIndex].Where(kitty => kitty.Name != kittyName).ToList(); // Where and ToList are IEnumerable or Creating a new Object  .. LEAKS

            FreeKittiesFromGroup(kittyName, false);

            for (let j: number = 0; j < currentGroup.Count - 1; j++)
            {
                let currentKitty = currentGroup[j];
                let nextKitty = currentGroup[j + 1];

                currentKitty.IsChained = true;
                let chain: Chain = ObjectPool.GetEmptyObject<Chain>();
                chain.SetKitties(currentKitty, nextKitty);
                KittyLightnings[currentKitty.Name] = chain;
            }

            kittyGroups.Add(currentGroup);
        }
        catch (e: Error)
        {
            Logger.Warning("Error in ChainedTogether.LoseEvent {e.Message}");
            throw new Error() // TODO; Rethrow actual error
        }
    }

    private static FreeKittiesFromGroup(kittyName: string, isVictory: boolean = false)
    {
        let groupIndex: number = kittyGroups.FindIndex(group => group.Any(kitty => kitty.Name == kittyName)); //IEnumerable with "Any" leaks
        if (groupIndex < 0) return;

        let currentGroup = kittyGroups[groupIndex];

        for (let i: number = 0; i < currentGroup.Count; i++)
        {
            let kitty = currentGroup[i];
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

    private static SetGroups()
    {
        let allKitties = Globals.ALL_KITTIES_LIST;
        let count: number = allKitties.Count;

        // Shuffle the kitties list to ensure randomness
        for (let i: number = allKitties.Count - 1; i > 0; i--)
        {
            let j: number = rng.Next(i + 1);
            let temp: Kitty = allKitties[i];
            allKitties[i] = allKitties[j];
            allKitties[j] = temp;
        }

        if (count < 3)
        {
            kittyGroups.Add(allKitties);
            ChainGroup(allKitties);

        }

        let index: number = 0;
        let groupsOfThree: number = count / 3;
        let remainder: number = count % 3;

        if (remainder == 1)
        {
            // convert two groups of 3 into two groups of 4 to avoid a group of 1
            groupsOfThree -= 1;
            remainder += 3;
        }

        for (let i: number = 0; i < groupsOfThree; i++)
        {
            let group = new List<Kitty> [allKitties[index], allKitties[index + 1], allKitties[index + 2]]
            kittyGroups.Add(group);
            ChainGroup(group);
            index += 3;
        }

        if (remainder > 0)
        {
            let lastGroup = new List<Kitty>();
            for (let i: number = index; i < allKitties.Count; i++)
            {
                lastGroup.Add(allKitties[i]);
            }
            kittyGroups.Add(lastGroup);
            ChainGroup(lastGroup);
        }
    }

    private static ChainGroup(List<Kitty> group)
    {
        for (let j: number = 0; j < group.Count - 1; j++)
        {
            let currentKitty = group[j];
            let nextKitty = group[j + 1];

            currentKitty.IsChained = true;
            let chain: Chain = ObjectPool.GetEmptyObject<Chain>();
            chain.SetKitties(currentKitty, nextKitty);
            KittyLightnings[currentKitty.Name] = chain;
        }
    }

    public static ReachedSafezone(kitty: Kitty)
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
        catch (e: Error)
        {
            Logger.Warning("Error in ChainedTogether.ReachedSafezone {e.Message}");
            throw new Error() // TODO; Rethrow actual error
        }

    }

    private static AwardChainedTogether(kitty: Kitty)
    {
        Utility.CreateSimpleTextTag("{Colors.COLOR_RED}Together: Chained!{Colors.COLOR_RESET}", 2.0, kitty.Unit);

        let level: DifficultyLevel = (DifficultyLevel)Difficulty.DifficultyValue;

        let awards = Globals.GAME_AWARDS_SORTED.Auras;
        let nameOfAward: string;

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

    private static IsInLastSafezone(kitty: Kitty)
    {
        // Check if the checks made with this function can be removed by calling the
        // functions TriggerEventOnLastSafeZone and ReachedSafezone on Source\Events\VictoryZone\FinalSafezone.cs
        // I'm afraid there could be a race condition by doing so
        return kitty.CurrentSafeZone == RegionList.SafeZones.Length - 1;
    }

}

class Chain
{
    public FirstKitty: Kitty 
    public SecondKitty: Kitty 
    public Lightning: lightning 

    private static readonly Dictionary<DifficultyLevel, (good: number, far: number, breakPoint: number)> ranges = new()
    {
        { DifficultyLevel.Normal,     (600, 700, 800) },
        { DifficultyLevel.Hard,       (650, 750, 850) },
        { DifficultyLevel.Impossible, (700, 800, 900) },
        { DifficultyLevel.Nightmare,  (750, 850, 950) }
    };

    public Chain()
    {
    }

    public SetKitties(firstKitty: Kitty, secondKitty: Kitty)
    {
        FirstKitty = firstKitty;
        SecondKitty = secondKitty;
        Lightning?.Dispose(); // just incase
        Lightning = AddLightning("WHCH", true, FirstKitty.Unit.X, FirstKitty.Unit.Y, SecondKitty.Unit.X, SecondKitty.Unit.Y);
        FirstKitty.IsChained = true;
        SecondKitty.IsChained = true;
    }

    public Move(): boolean
    {
        let outOfRange: number = CalculateRangeByDifficulty("breakPoint");
        let isOutOfRange: boolean = false;
        let x1 = FirstKitty.Unit.X;
        let y1 = FirstKitty.Unit.Y;
        let x2 = SecondKitty.Unit.X;
        let y2 = SecondKitty.Unit.Y;
        MoveLightning(Lightning, true, FirstKitty.Unit.X, FirstKitty.Unit.Y, SecondKitty.Unit.X, SecondKitty.Unit.Y);
        let distance: number = Math.Abs(x2 - x1) + Math.Abs(y2 - y1);

        if (distance > outOfRange)
        {
            isOutOfRange = true;
        }

        ChangeChainColor(distance);
        return isOutOfRange;
    }

    public Dispose()
    {
        Lightning?.Dispose();
        FirstKitty.IsChained = false;
        SecondKitty.IsChained = false;
        ObjectPool<Chain>.ReturnObject(this);
    }

    public ChangeChainColor(distance: number)
    {
        let red: number = 0.0, green = 1.0, blue = 0.0, alpha = 1.0; // Default color is green

        let far: number = CalculateRangeByDifficulty("far");
        let good: number = CalculateRangeByDifficulty("good");

        if (distance > far)
        {
            red = 1.0; green = 0.0; blue = 0.0; // Red
        }
        else if (distance > good)
        {
            red = 1.0; green = 1.0; blue = 0.0; // Yellow
        }

        SetLightningColor(Lightning, red, green, blue, alpha);
    }

    public static CalculateRangeByDifficulty(rangeType: string)
    {
        let level: DifficultyLevel = (DifficultyLevel)Difficulty.DifficultyValue;

        (good: number, far: number, breakPoint: number) selectedRange;

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
                throw new ArgumentError("rangeType: Invalid '{rangeType}'");
        }
    }
}
