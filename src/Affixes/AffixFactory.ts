import { Globals } from 'src/Global/Globals'

export class AffixFactory {
    public static AllAffixes: Affix[] = []
    public static readonly AffixTypes: string[] = [
        'Speedster',
        'Unpredictable',
        'Fixation',
        'Frostbite',
        'Chaos',
        'Howler',
        'Blitzer',
        'Stealth',
        'Bomber',
    ]
    private static LaneWeights: number[]

    private static NUMBER_OF_AFFIXED_WOLVES: number // (Difficulty.DifficultyValue * 2) + Globals.ROUND;
    private static MAX_NUMBER_OF_AFFIXES: number = 1
    private static MAX_AFFIXED_PER_LANE: number = 6
    private static MAX_FIXIATION_PER_LANE: number = 3

    private static TempAffixesList: string[] = []
    private static TempAffixCounts: Map<string, number> = new Map()
    /// <summary>
    /// Only works in Standard mode. Initializes lane weights for affix distribution.
    /// </summary>
    public static Initialize() {
        AffixFactory.AllAffixes = []
        AffixFactory.InitLaneWeights()
    }

    public static CalculateAffixes(laneIndex: number = -1) {
        for (let affix in AffixFactory.AllAffixes) {
            if (AffixFactory.TempAffixCounts.has(affix.Name)) continue
            if (laneIndex != -1 && affix.Unit.RegionIndex != laneIndex) continue
            AffixFactory.TempAffixCounts[affix.Name] = 0
        }

        for (let affix in AffixFactory.AllAffixes) {
            if (AffixFactory.TempAffixCounts.has(affix.Name)) {
                if (laneIndex != -1 && affix.Unit.RegionIndex != laneIndex) continue
                AffixFactory.TempAffixCounts[affix.Name]++
            }
        }

        for (let affix in AffixFactory.TempAffixCounts) {
            if (affix.Value > 0) {
                AffixFactory.TempAffixesList.push('{affix.Key} x{affix.Value}')
            }
        }
        let arr = AffixFactory.TempAffixesList
        AffixFactory.TempAffixCounts.clear()
        AffixFactory.TempAffixesList.length = 0
        return arr
    }

    public static CreateAffix(unit: Wolf, affixName: string): Affix {
        switch (affixName) {
            case 'Speedster':
                return new Speedster(unit)

            case 'Unpredictable':
                return new Unpredictable(unit)

            case 'Fixation':
                return new Fixation(unit)

            case 'Frostbite':
                return new Frostbite(unit)

            case 'Chaos':
                return new Chaos(unit)

            case 'Howler':
                return new Howler(unit)

            case 'Blitzer':
                return new Blitzer(unit)

            case 'Stealth':
                return new Stealth(unit)

            case 'Bomber':
                return new Bomber(unit)

            case 'Vortex':
                return new Vortex(unit)

            default:
                Logger.Warning('{Colors.COLOR_YELLOW_ORANGE}affix: Invalid|r')
                return null
        }
    }

    /// <summary>
    /// Initializes the lane weights for affix distribution.
    /// </summary>
    private static InitLaneWeights() {
        let regionCount = RegionList.WolfRegions.length
        let totalArea = 0.0
        AffixFactory.LaneWeights = []

        for (let lane in WolfArea.WolfAreas) {
            totalArea += lane.Value.Area
            AffixFactory.LaneWeights[lane.Value.ID] = lane.Value.Area
        }

        // Normalizing Weights
        for (let i: number = 0; i < regionCount; i++) {
            AffixFactory.LaneWeights[i] = (AffixFactory.LaneWeights[i] / totalArea) * 100
            //if(Program.Debug) print("Lane {i + 1} weight: {LaneWeights[i]}");
        }
    }

    /* summary
     * if: we: can: apply: affix: to: Wolf: type: Checks.
     * @unit: parm: Wolf
     * @affixName: optional: string
     */
    private static CanApplyAffix(unit: Wolf, affixName: string = 'x') {
        return unit.AffixCount() < AffixFactory.MAX_NUMBER_OF_AFFIXES && !unit.HasAffix(affixName)
    }

    public static ApplyAffix(unit: Wolf, affixName: string): Affix {
        if (!AffixFactory.CanApplyAffix(unit, affixName)) return null
        let affix = AffixFactory.CreateAffix(unit, affixName)
        unit.AddAffix(affix)
        return affix
    }

    private static AvailableAffixes(laneNumber: number) {
        let affixes = string.Join(', ', AffixFactory.AffixTypes) // Start with all affixes in a single string
        let fixationCount = WolfArea.WolfAreas[laneNumber].FixationCount
        if (
            laneNumber > 6 ||
            Difficulty.DifficultyValue == DifficultyLevel.Hard ||
            fixationCount >= AffixFactory.MAX_FIXIATION_PER_LANE
        )
            affixes = affixes.Replace('Fixation, ', '').Replace(', Fixation', '').Replace('Fixation', '')
        if (Difficulty.DifficultyValue == DifficultyLevel.Hard) {
            affixes = affixes.Replace('Chaos, ', '').Replace(', Chaos', '').Replace('Chaos', '')
        }
        return affixes.Trim()
    }

    private static ApplyRandomAffix(unit: Wolf, laneNumber: number): Affix {
        try {
            let affixes = AffixFactory.AvailableAffixes(laneNumber)

            let affixArray = affixes.split(', ').filter(Boolean)

            if (affixArray.length == 0) return null

            let randomIndex = Math.random()
            let randomAffix = affixArray[randomIndex]
            return AffixFactory.ApplyAffix(unit, randomAffix)
        } catch (ex) {
            Logger.Warning('{Colors.COLOR_RED}Error in ApplyRandomAffix: {ex.Message}{Colors.COLOR_RESET}')
            return null
        }
    }

    /// <summary>
    /// Distributes affixed wolves weighted by region area, difficulty, and round.
    /// </summary>
    public static DistAffixes() {
        try {
            AffixFactory.RemoveAllAffixes()
            if (Gamemode.CurrentGameMode == GameMode.SoloTournament) return // Solo Return.. Team tournament should work.
            if (!AffixFactory.CanDistributeAffixes()) return

            AffixFactory.NUMBER_OF_AFFIXED_WOLVES =
                Gamemode.CurrentGameMode == GameMode.Standard
                    ? Difficulty.DifficultyValue * 3 + Globals.ROUND * 8
                    : 26 + Globals.ROUND * 8

            // Nightmare Difficulty Adjustment.. All Wolves get affixed
            if (Difficulty.DifficultyValue == DifficultyLevel.Nightmare) {
                for (let wolf in Globals.ALL_WOLVES.Values) {
                    if (!AffixFactory.ShouldAffixWolves(wolf, wolf.RegionIndex)) continue
                    AffixFactory.ApplyRandomAffix(wolf, wolf.RegionIndex)
                }
                return
            }

            // # per lane based on the weights
            let totalWeight: number = AffixFactory.LaneWeights.Sum() // IEnumerable is shit still but this doesnt call but 5 times a game so its fine
            let laneDistribution = []
            let totalAssigned: number = 0

            for (let i: number = 0; i < AffixFactory.LaneWeights.length; i++) {
                // Set proportions based on lane weights
                let ratio: number = AffixFactory.LaneWeights[i] / totalWeight
                laneDistribution[i] = Math.Floor(AffixFactory.NUMBER_OF_AFFIXED_WOLVES * ratio)
                totalAssigned += laneDistribution[i]
            }

            // ^ rounding can cause some left overs so here we are
            let leftover: number = AffixFactory.NUMBER_OF_AFFIXED_WOLVES - totalAssigned
            for (let i: number = 0; i < AffixFactory.LaneWeights.length && leftover > 0; i++) {
                if (laneDistribution[i] < AffixFactory.MAX_AFFIXED_PER_LANE) {
                    laneDistribution[i]++
                    leftover--
                }
            }

            // Go thru and apply affixes to each lane
            for (let i: number = 0; i < laneDistribution.length; i++) {
                let affixTarget: number = Math.Min(laneDistribution[i], AffixFactory.MAX_AFFIXED_PER_LANE)
                let wolvesInLane = WolfArea.WolfAreas[i].Wolves

                // Add affixes to random wolves until the {affixTarget} is reached
                let appliedCount: number = 0
                for (let j: number = 0; j < wolvesInLane.length && appliedCount < affixTarget; j++) {
                    let wolf = wolvesInLane[j]
                    if (!AffixFactory.ShouldAffixWolves(wolf, i)) continue

                    let affix = AffixFactory.ApplyRandomAffix(wolf, i)
                    if (affix != null) appliedCount++
                }
            }
        } catch (ex) {
            Logger.Critical('{Colors.COLOR_RED}Error in DistAffixes: {ex.Message}{Colors.COLOR_RESET}')
            AffixFactory.RemoveAllAffixes()
        }
    }

    // Conditions for affixing wolves:
    // 1. Must be in the same lane
    // 2. Must have fewer than the maximum number of affixes
    // 3. Must not be a blood wolf, or named wolves
    private static ShouldAffixWolves(wolf: Wolf, laneIndex: number) {
        return (
            wolf.RegionIndex == laneIndex &&
            wolf.AffixCount() < AffixFactory.MAX_NUMBER_OF_AFFIXES &&
            wolf.Unit != FandF.BloodWolf &&
            !NamedWolves.DNTNamedWolves.includes(wolf)
        )
    }

    private static CanDistributeAffixes(): boolean {
        return Difficulty.DifficultyValue != DifficultyLevel.Normal
    }

    public static RemoveAllAffixes() {
        for (let wolf in Globals.ALL_WOLVES) {
            wolf.Value.RemoveAllWolfAffixes()
        }
        AffixFactory.AllAffixes.clear()
    }
}
