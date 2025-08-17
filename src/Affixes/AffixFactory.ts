import { Logger } from 'src/Events/Logger/Logger'
import { Wolf } from 'src/Game/Entities/Wolf'
import { WolfArea } from 'src/Game/WolfArea'
import { CurrentGameMode } from 'src/Gamemodes/CurrentGameMode'
import { GameMode } from 'src/Gamemodes/GameModeEnum'
import { Globals } from 'src/Global/Globals'
import { RegionList } from 'src/Global/RegionList'
import { Difficulty } from 'src/Init/Difficulty/Difficulty'
import { DifficultyLevel } from 'src/Init/Difficulty/DifficultyOption'
import { Colors } from 'src/Utility/Colors/Colors'
import { sumNumbers } from 'src/Utility/Utility'
import { Affix } from './Affix'
import { AffixTypes, CreateAffix } from './AffixCreate'
import { AddAffix, RemoveAllWolfAffixes } from './AffixUtil'

export class AffixFactory {
    private static LaneWeights: number[]

    private static NUMBER_OF_AFFIXED_WOLVES: number // (Difficulty.DifficultyValue * 2) + Globals.ROUND;
    private static MAX_NUMBER_OF_AFFIXES = 1
    private static MAX_AFFIXED_PER_LANE = 6
    private static MAX_FIXIATION_PER_LANE = 3

    private static TempAffixesList: string[] = []
    private static TempAffixCounts: Map<string, number> = new Map()
    /// <summary>
    /// Only works in Standard mode. Initializes lane weights for affix distribution.
    /// </summary>
    public static Initialize = () => {
        Globals.AllAffixes = []
        AffixFactory.InitLaneWeights()
    }

    public static CalculateAffixes(laneIndex: number = -1) {
        for (const affix of Globals.AllAffixes) {
            if (AffixFactory.TempAffixCounts.has(affix.name)) continue
            if (laneIndex !== -1 && affix.Unit.RegionIndex !== laneIndex) continue
            AffixFactory.TempAffixCounts.set(affix.name, 0)
        }

        for (const affix of Globals.AllAffixes) {
            if (AffixFactory.TempAffixCounts.has(affix.name)) {
                if (laneIndex !== -1 && affix.Unit.RegionIndex !== laneIndex) continue
                AffixFactory.TempAffixCounts.set(affix.name, (AffixFactory.TempAffixCounts.get(affix.name) || 0) + 1)
            }
        }

        for (const [key, affix] of AffixFactory.TempAffixCounts) {
            if (affix > 0) {
                AffixFactory.TempAffixesList.push(`${key} x${affix}`)
            }
        }
        const arr = AffixFactory.TempAffixesList
        AffixFactory.TempAffixCounts.clear()
        AffixFactory.TempAffixesList.length = 0
        return arr
    }

    /// <summary>
    /// Initializes the lane weights for affix distribution.
    /// </summary>
    private static InitLaneWeights = () => {
        const regionCount = RegionList.WolfRegions.length
        let totalArea = 0.0
        AffixFactory.LaneWeights = []

        for (const [_, lane] of WolfArea.WolfAreas) {
            totalArea += lane.Area
            AffixFactory.LaneWeights[lane.ID] = lane.Area
        }

        // Normalizing Weights
        for (let i = 0; i < regionCount; i++) {
            AffixFactory.LaneWeights[i] = (AffixFactory.LaneWeights[i] / totalArea) * 100
            //if(!PROD) print(`Lane ${i + 1} weight: ${AffixFactory.LaneWeights[i]}`);
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
        const affix = CreateAffix(unit, affixName)
        AddAffix(affix, unit)
        return affix
    }

    private static availableAffixes(laneNumber: number): string {
        const { Hard } = DifficultyLevel
        const affixes = [...AffixTypes] // Clone to avoid mutating original
        const fixationCount = WolfArea.WolfAreas.get(laneNumber)?.FixationCount ?? 0

        const isHard = Difficulty.DifficultyValue === Hard
        const isFixationBlocked = laneNumber > 6 || isHard || fixationCount >= AffixFactory.MAX_FIXIATION_PER_LANE

        const filtered = affixes.filter(type => {
            if (type === 'Fixation' && isFixationBlocked) return false
            if (type === 'Chaos' && isHard) return false
            return true
        })

        return filtered.join(', ')
    }

    private static ApplyRandomAffix(unit: Wolf, laneNumber: number): Affix {
        try {
            const affixes = AffixFactory.availableAffixes(laneNumber)

            const affixArray = affixes.split(', ').filter(v => !!v)

            if (affixArray.length === 0) return null as never

            const randomIndex = Math.floor(Math.random() * affixArray.length)
            const randomAffix = affixArray[randomIndex]
            return AffixFactory.ApplyAffix(unit, randomAffix)
        } catch (ex: any) {
            Logger.Warning(`${Colors.COLOR_RED}Error in ApplyRandomAffix: ${ex}${Colors.COLOR_RESET}`)
            return null as never
        }
    }

    /// <summary>
    /// Distributes affixed wolves weighted by region area, difficulty, and round.
    /// </summary>
    public static DistAffixes = () => {
        try {
            AffixFactory.RemoveAllAffixes()
            if (CurrentGameMode.active === GameMode.SoloTournament) return // Solo Return.. Team tournament should work.
            if (!AffixFactory.CanDistributeAffixes()) return

            AffixFactory.NUMBER_OF_AFFIXED_WOLVES =
                CurrentGameMode.active === GameMode.Standard
                    ? Difficulty.DifficultyValue * 3 + Globals.ROUND * 8
                    : 26 + Globals.ROUND * 8

            // Nightmare Difficulty Adjustment.. All Wolves get affixed
            if (Difficulty.DifficultyValue === DifficultyLevel.Nightmare) {
                for (const [_, wolf] of Globals.ALL_WOLVES) {
                    if (!AffixFactory.ShouldAffixWolves(wolf, wolf.RegionIndex)) continue
                    AffixFactory.ApplyRandomAffix(wolf, wolf.RegionIndex)
                }
                return
            }

            // # per lane based on the weights
            const totalWeight = sumNumbers(AffixFactory.LaneWeights) // IEnumerable is shit still but this doesnt call but 5 times a game so its fine
            const laneDistribution = []
            let totalAssigned = 0

            for (let i = 0; i < AffixFactory.LaneWeights.length; i++) {
                // Set proportions based on lane weights
                const ratio: number = AffixFactory.LaneWeights[i] / totalWeight
                laneDistribution[i] = Math.floor(AffixFactory.NUMBER_OF_AFFIXED_WOLVES * ratio)
                totalAssigned += laneDistribution[i]
            }

            // ^ rounding can cause some left overs so here we are
            let leftover: number = AffixFactory.NUMBER_OF_AFFIXED_WOLVES - totalAssigned
            for (let i = 0; i < AffixFactory.LaneWeights.length && leftover > 0; i++) {
                if (laneDistribution[i] < AffixFactory.MAX_AFFIXED_PER_LANE) {
                    laneDistribution[i]++
                    leftover--
                }
            }

            // Go thru and apply affixes to each lane
            for (let i = 0; i < laneDistribution.length; i++) {
                const affixTarget: number = Math.min(laneDistribution[i], AffixFactory.MAX_AFFIXED_PER_LANE)
                const wolvesInLane = WolfArea.WolfAreas.get(i)!.Wolves

                // Add affixes to random wolves until the {affixTarget} is reached
                let appliedCount = 0
                for (let j = 0; j < wolvesInLane.length && appliedCount < affixTarget; j++) {
                    const wolf = wolvesInLane[j]
                    if (!AffixFactory.ShouldAffixWolves(wolf, i)) continue

                    const affix = AffixFactory.ApplyRandomAffix(wolf, i)
                    if (affix !== null) appliedCount++
                }
            }
        } catch (ex: any) {
            Logger.Critical(`${Colors.COLOR_RED}Error in DistAffixes: ${ex}${Colors.COLOR_RESET}`)
            AffixFactory.RemoveAllAffixes()
        }
    }

    // Conditions for affixing wolves:
    // 1. Must be in the same lane
    // 2. Must have fewer than the maximum number of affixes
    // 3. Must not be a blood wolf, or named wolves
    private static ShouldAffixWolves(wolf: Wolf, laneIndex: number) {
        return (
            wolf.RegionIndex === laneIndex &&
            wolf.AffixCount() < AffixFactory.MAX_NUMBER_OF_AFFIXES &&
            // wolf.Unit !== FandF.BloodWolf && // fuck it, lets let this stupid thing rage hell. Sounds fun to me.
            !Globals.DNTNamedWolves.includes(wolf)
        )
    }

    private static CanDistributeAffixes(): boolean {
        return Difficulty.DifficultyValue !== DifficultyLevel.Normal
    }

    public static RemoveAllAffixes = () => {
        for (const [_, wolf] of Globals.ALL_WOLVES) {
            RemoveAllWolfAffixes(wolf)
        }
        Globals.AllAffixes.length = 0
    }
}
