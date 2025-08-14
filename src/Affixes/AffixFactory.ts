import { Logger } from 'src/Events/Logger/Logger'
import { NamedWolves } from 'src/Game/Entities/NamedWolves'
import { Wolf } from 'src/Game/Entities/Wolf'
import { WolfArea } from 'src/Game/WolfArea'
import { Gamemode } from 'src/Gamemodes/Gamemode'
import { GameMode } from 'src/Gamemodes/GameModeEnum'
import { Globals } from 'src/Global/Globals'
import { RegionList } from 'src/Global/RegionList'
import { Difficulty } from 'src/Init/Difficulty/Difficulty'
import { DifficultyLevel } from 'src/Init/Difficulty/DifficultyOption'
import { FandF } from 'src/Rewards/EasterEggs/F&F/FandF'
import { sumNumbers } from 'src/Utility/Utility'
import { Affix } from './Affix'
import { Blitzer } from './Blitzer'
import { Bomber } from './Bomber'
import { Chaos } from './Chaos'
import { Fixation } from './Fixation'
import { Frostbite } from './Frostbite'
import { Howler } from './Howler'
import { Speedster } from './Speedster'
import { Stealth } from './Stealth'
import { Unpredictable } from './Unpredictable'
import { Vortex } from './Vortex'

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
        for (let affix of AffixFactory.AllAffixes) {
            if (AffixFactory.TempAffixCounts.has(affix.name)) continue
            if (laneIndex != -1 && affix.Unit.RegionIndex != laneIndex) continue
            AffixFactory.TempAffixCounts.set(affix.name, 0)
        }

        for (let affix of AffixFactory.AllAffixes) {
            if (AffixFactory.TempAffixCounts.has(affix.name)) {
                if (laneIndex != -1 && affix.Unit.RegionIndex != laneIndex) continue
                AffixFactory.TempAffixCounts.set(affix.name, (AffixFactory.TempAffixCounts.get(affix.name) || 0) + 1)
            }
        }

        for (let [_, affix] of AffixFactory.TempAffixCounts) {
            if (affix > 0) {
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
                return null as never
        }
    }

    /// <summary>
    /// Initializes the lane weights for affix distribution.
    /// </summary>
    private static InitLaneWeights() {
        let regionCount = RegionList.WolfRegions.length
        let totalArea = 0.0
        AffixFactory.LaneWeights = []

        for (let [_, lane] of WolfArea.WolfAreas) {
            totalArea += lane.Area
            AffixFactory.LaneWeights[lane.ID] = lane.Area
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
        if (!AffixFactory.CanApplyAffix(unit, affixName)) return null as never
        let affix = AffixFactory.CreateAffix(unit, affixName)
        unit.AddAffix(affix)
        return affix
    }

    private static AvailableAffixes(laneNumber: number) {
        let affixes = AffixFactory.AffixTypes.join(', ') // Start with all affixes in a single string
        let fixationCount = WolfArea.WolfAreas.get(laneNumber)!.FixationCount
        if (
            laneNumber > 6 ||
            Difficulty.DifficultyValue == DifficultyLevel.Hard ||
            fixationCount >= AffixFactory.MAX_FIXIATION_PER_LANE
        )
            affixes = affixes.replace('Fixation, ', '').replace(', Fixation', '').replace('Fixation', '')
        if (Difficulty.DifficultyValue == DifficultyLevel.Hard) {
            affixes = affixes.replace('Chaos, ', '').replace(', Chaos', '').replace('Chaos', '')
        }
        return affixes.trim()
    }

    private static ApplyRandomAffix(unit: Wolf, laneNumber: number): Affix {
        try {
            let affixes = AffixFactory.AvailableAffixes(laneNumber)

            let affixArray = affixes.split(', ').filter(Boolean)

            if (affixArray.length == 0) return null as never

            let randomIndex = Math.random()
            let randomAffix = affixArray[randomIndex]
            return AffixFactory.ApplyAffix(unit, randomAffix)
        } catch (ex: any) {
            Logger.Warning('{Colors.COLOR_RED}Error in ApplyRandomAffix: {ex.Message}{Colors.COLOR_RESET}')
            return null as never
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
                for (let [_, wolf] of Globals.ALL_WOLVES) {
                    if (!AffixFactory.ShouldAffixWolves(wolf, wolf.RegionIndex)) continue
                    AffixFactory.ApplyRandomAffix(wolf, wolf.RegionIndex)
                }
                return
            }

            // # per lane based on the weights
            let totalWeight = sumNumbers(AffixFactory.LaneWeights) // IEnumerable is shit still but this doesnt call but 5 times a game so its fine
            let laneDistribution = []
            let totalAssigned: number = 0

            for (let i: number = 0; i < AffixFactory.LaneWeights.length; i++) {
                // Set proportions based on lane weights
                let ratio: number = AffixFactory.LaneWeights[i] / totalWeight
                laneDistribution[i] = Math.floor(AffixFactory.NUMBER_OF_AFFIXED_WOLVES * ratio)
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
                let affixTarget: number = Math.min(laneDistribution[i], AffixFactory.MAX_AFFIXED_PER_LANE)
                let wolvesInLane = WolfArea.WolfAreas.get(i)!.Wolves

                // Add affixes to random wolves until the {affixTarget} is reached
                let appliedCount: number = 0
                for (let j: number = 0; j < wolvesInLane.length && appliedCount < affixTarget; j++) {
                    let wolf = wolvesInLane[j]
                    if (!AffixFactory.ShouldAffixWolves(wolf, i)) continue

                    let affix = AffixFactory.ApplyRandomAffix(wolf, i)
                    if (affix != null) appliedCount++
                }
            }
        } catch (ex: any) {
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
        for (let [_, wolf] of Globals.ALL_WOLVES) {
            wolf.RemoveAllWolfAffixes()
        }
        AffixFactory.AllAffixes.length = 0
    }
}
