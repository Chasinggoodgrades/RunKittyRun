import { Logger } from 'src/Events/Logger/Logger'
import { Kitty } from 'src/Game/Entities/Kitty/Kitty'
import { CurrentGameMode } from 'src/Gamemodes/CurrentGameMode'
import { GameMode } from 'src/Gamemodes/GameModeEnum'
import { Globals } from 'src/Global/Globals'
import { RegionList } from 'src/Global/RegionList'
import { Difficulty } from 'src/Init/Difficulty/Difficulty'
import { DifficultyLevel } from 'src/Init/Difficulty/DifficultyOption'
import { Colors } from 'src/Utility/Colors/Colors'
import { MemoryHandler } from 'src/Utility/MemoryHandler/MemoryHandler'
import { Utility } from 'src/Utility/Utility'
import { Timer } from 'w3ts'
import { AwardManager } from '../Rewards/AwardManager'

export class ChainedTogether {
    private static REQUIRED_PLAYERS = 2
    private static KittyLightnings: Map<string, Chain> = new Map()
    private static kittyGroups: Kitty[][] = [] // Convert this into a dictionary
    private static timerInterval = 0.1
    private static MoveChainTimer: Timer
    private static EventTriggered: boolean = false
    private static EventStarted: boolean = false
    private static IsStartingContidionValid: boolean = true

    private static TriggerEventOnLastSafeZone = () => {
        if (CurrentGameMode.active !== GameMode.Standard) return // Only occurs in Standard Gamemode.
        if (ChainedTogether.EventStarted || ChainedTogether.EventTriggered) return // Don't trigger multiple times.
        if (!ChainedTogether.IsStartingContidionValid) return

        const allKitties = Globals.ALL_KITTIES_LIST

        if (allKitties.length < ChainedTogether.REQUIRED_PLAYERS) return // Need at least 2 players to trigger event.

        for (let i = 0; i < allKitties.length - 1; i++) {
            if (!ChainedTogether.IsInLastSafezone(allKitties[i])) {
                return
            }
        }

        ChainedTogether.TriggerEvent()
    }

    public static TriggerEvent = () => {
        Utility.TimedTextToAllPlayers(
            4.0,
            `${Colors.COLOR_TURQUOISE}Chained Together Event Requirements Complete!${Colors.COLOR_RESET} ${Colors.COLOR_YELLOW}Activating next round!${Colors.COLOR_RESET}`
        )
        ChainedTogether.EventTriggered = true
    }

    private static UpdateStartingCondition(kitty: Kitty) {
        const currentSafezone: number = kitty.CurrentSafeZone
        const kitties = Globals.ALL_KITTIES_LIST
        let skippedSafezone: boolean = false

        for (let i = 0; i < kitties.length; i++) {
            const currentKitty: Kitty = kitties[i]
            if (
                currentKitty.CurrentSafeZone !== currentSafezone - 1 &&
                currentKitty.CurrentSafeZone !== currentSafezone
            ) {
                skippedSafezone = true
                break
            }
        }

        if (skippedSafezone) {
            ChainedTogether.IsStartingContidionValid = false
        }
    }

    /// <summary>
    /// Starts the event
    /// </summary>
    public static StartEvent = () => {
        if (!ChainedTogether.EventTriggered) {
            ChainedTogether.IsStartingContidionValid = true
            return
        }

        ChainedTogether.EventStarted = true

        try {
            ChainedTogether.SetGroups()
            ChainedTogether.MoveChainTimer ??= Timer.create()
            ChainedTogether.MoveChainTimer.start(ChainedTogether.timerInterval, true, ChainedTogether.MoveChain)
        } catch (e) {
            Logger.Warning(`Error in ChainedTogether.StartEvent: ${e}`)
            throw e
        }
    }

    private static MoveChain = () => {
        const kitties = Globals.ALL_KITTIES_LIST
        let isOutOfRange: boolean = false
        let kittyOutOfRange: string = ''

        for (let i = 0; i < kitties.length - 1; i++) {
            const kitty = kitties[i]
            const kittyName = kitty.name

            if (!ChainedTogether.KittyLightnings.has(kittyName)) continue

            const chain = ChainedTogether.KittyLightnings.get(kittyName)!
            isOutOfRange = chain.Move()
            kittyOutOfRange = kittyName

            if (isOutOfRange) break
        }

        if (isOutOfRange) {
            ChainedTogether.LoseEvent(kittyOutOfRange)
        }
    }

    public static LoseEvent(kittyNameOutSideRange: string) {
        if (!ChainedTogether.EventStarted) return // Event not started or already ended.

        try {
            ChainedTogether.FreeKittiesFromGroup(kittyNameOutSideRange, false)
        } catch (e) {
            Logger.Warning(`Error in ChainedTogether.LoseEvent ${e}`)
            throw e
        }
    }

    /// <summary>
    /// Purpose is to regenerate the group chains if a player leaves the game or disconnects.
    /// </summary>
    /// <param name="kittyName"></param>
    public static RegenerateGroup(kittyName: string) {
        const groupIndex: number = ChainedTogether.kittyGroups.findIndex(group =>
            group.some(kitty => kitty.name === kittyName)
        ) // IEnumerable "Any" leaks
        if (groupIndex < 0) return

        try {
            const currentGroup = ChainedTogether.kittyGroups[groupIndex].filter(kitty => kitty.name !== kittyName) // Where and ToList are IEnumerable or Creating a new Object  .. LEAKS

            ChainedTogether.FreeKittiesFromGroup(kittyName, false)

            for (let j = 0; j < currentGroup.length - 1; j++) {
                const currentKitty = currentGroup[j]
                const nextKitty = currentGroup[j + 1]

                currentKitty.IsChained = true
                const chain: Chain = MemoryHandler.getEmptyObject<Chain>()
                chain.SetKitties(currentKitty, nextKitty)
                ChainedTogether.KittyLightnings.set(currentKitty.name, chain)
            }

            ChainedTogether.kittyGroups.push(currentGroup)
        } catch (e) {
            Logger.Warning(`Error in ChainedTogether.LoseEvent: ${e}`)
            throw e
        }
    }

    private static FreeKittiesFromGroup(kittyName: string, isVictory: boolean = false) {
        const groupIndex: number = ChainedTogether.kittyGroups.findIndex(group =>
            group.some(kitty => kitty.name === kittyName)
        ) //IEnumerable with "Any" leaks
        if (groupIndex < 0) return

        const currentGroup = ChainedTogether.kittyGroups[groupIndex]

        for (let i = 0; i < currentGroup.length; i++) {
            const kitty = currentGroup[i]
            kitty.IsChained = false

            if (isVictory) {
                ChainedTogether.AwardChainedTogether(kitty)
            }

            if (ChainedTogether.KittyLightnings.has(kitty.name)) {
                ChainedTogether.KittyLightnings.get(kitty.name)!.dispose()
                ChainedTogether.KittyLightnings.delete(kitty.name)
            }
        }

        ChainedTogether.kittyGroups.splice(groupIndex, 1)
    }

    private static SetGroups = () => {
        const allKitties = Globals.ALL_KITTIES_LIST
        const count: number = allKitties.length

        // Shuffle the kitties list to ensure randomness
        for (let i: number = allKitties.length - 1; i > 0; i--) {
            const j: number = Math.random()
            const temp: Kitty = allKitties[i]
            allKitties[i] = allKitties[j]
            allKitties[j] = temp
        }

        if (count < 3) {
            ChainedTogether.kittyGroups.push(allKitties)
            ChainedTogether.ChainGroup(allKitties)
        }

        let index = 0
        let groupsOfThree: number = count / 3
        let remainder: number = count % 3

        if (remainder === 1) {
            // convert two groups of 3 into two groups of 4 to avoid a group of 1
            groupsOfThree -= 1
            remainder += 3
        }

        for (let i = 0; i < groupsOfThree; i++) {
            const group = [allKitties[index], allKitties[index + 1], allKitties[index + 2]]
            ChainedTogether.kittyGroups.push(group)
            ChainedTogether.ChainGroup(group)
            index += 3
        }

        if (remainder > 0) {
            const lastGroup: Kitty[] = []
            for (let i: number = index; i < allKitties.length; i++) {
                lastGroup.push(allKitties[i])
            }
            ChainedTogether.kittyGroups.push(lastGroup)
            ChainedTogether.ChainGroup(lastGroup)
        }
    }

    private static ChainGroup(group: Kitty[]) {
        for (let j = 0; j < group.length - 1; j++) {
            const currentKitty = group[j]
            const nextKitty = group[j + 1]

            currentKitty.IsChained = true
            const chain: Chain = MemoryHandler.getEmptyObject<Chain>()
            chain.SetKitties(currentKitty, nextKitty)
            ChainedTogether.KittyLightnings.set(currentKitty.name, chain)
        }
    }

    public static ReachedSafezone(kitty: Kitty) {
        try {
            if (!ChainedTogether.EventStarted) {
                ChainedTogether.UpdateStartingCondition(kitty)

                if (ChainedTogether.IsInLastSafezone(kitty)) {
                    ChainedTogether.TriggerEventOnLastSafeZone()
                }
                return // Event not started or already ended.
            }

            if (!ChainedTogether.IsInLastSafezone(kitty)) return

            //finish event
            ChainedTogether.FreeKittiesFromGroup(kitty.name, true)
        } catch (e) {
            Logger.Warning(`Error in ChainedTogether.ReachedSafezone ${e}`)
            throw e
        }
    }

    private static AwardChainedTogether(kitty: Kitty) {
        Utility.CreateSimpleTextTag(`${Colors.COLOR_RED}Chained Together!${Colors.COLOR_RESET}`, 2.0, kitty.Unit)

        const level: DifficultyLevel = Difficulty.DifficultyValue

        const awards = Globals.GAME_AWARDS_SORTED.Auras
        let nameOfAward: string

        switch (level) {
            case DifficultyLevel.Nightmare:
                nameOfAward = 'ChainedNightmareAura'
                break
            case DifficultyLevel.Impossible:
                nameOfAward = 'ChainedImpossibleAura'
                break
            case DifficultyLevel.Hard:
                nameOfAward = 'ChainedHardAura'
                break
            default:
                nameOfAward = 'ChainedNormalAura'
                break
        }

        AwardManager.GiveReward(kitty.Player, nameOfAward)
    }

    private static IsInLastSafezone(kitty: Kitty) {
        // Check if the checks made with this function can be removed by calling the
        // functions TriggerEventOnLastSafeZone and ReachedSafezone on Source\Events\VictoryZone\FinalSafezone.cs
        // I'm afraid there could be a race condition by doing so
        return kitty.CurrentSafeZone === RegionList.SafeZones.length - 1
    }
}

export class Chain {
    public FirstKitty: Kitty
    public SecondKitty: Kitty
    public Lightning: lightning

    private static readonly ranges: { [key in DifficultyLevel]: { good: number; far: number; breakPoint: number } } = {
        [DifficultyLevel.Normal]: { good: 600, far: 700, breakPoint: 800 },
        [DifficultyLevel.Hard]: { good: 650, far: 750, breakPoint: 850 },
        [DifficultyLevel.Impossible]: { good: 700, far: 800, breakPoint: 900 },
        [DifficultyLevel.Nightmare]: { good: 750, far: 850, breakPoint: 950 },
    }

    public constructor() {}

    public SetKitties(firstKitty: Kitty, secondKitty: Kitty) {
        this.FirstKitty = firstKitty
        this.SecondKitty = secondKitty
        DestroyLightning(this.Lightning)
        this.Lightning = AddLightning(
            'WHCH',
            true,
            this.FirstKitty.Unit.x,
            this.FirstKitty.Unit.y,
            this.SecondKitty.Unit.x,
            this.SecondKitty.Unit.y
        )!
        this.FirstKitty.IsChained = true
        this.SecondKitty.IsChained = true
    }

    public Move(): boolean {
        const outOfRange: number = Chain.CalculateRangeByDifficulty('breakPoint')
        let isOutOfRange: boolean = false
        const x1 = this.FirstKitty.Unit.x
        const y1 = this.FirstKitty.Unit.y
        const x2 = this.SecondKitty.Unit.x
        const y2 = this.SecondKitty.Unit.y
        MoveLightning(
            this.Lightning,
            true,
            this.FirstKitty.Unit.x,
            this.FirstKitty.Unit.y,
            this.SecondKitty.Unit.x,
            this.SecondKitty.Unit.y
        )
        const distance: number = Math.abs(x2 - x1) + Math.abs(y2 - y1)

        if (distance > outOfRange) {
            isOutOfRange = true
        }

        this.ChangeChainColor(distance)
        return isOutOfRange
    }

    public dispose = () => {
        DestroyLightning(this.Lightning)
        this.FirstKitty.IsChained = false
        this.SecondKitty.IsChained = false
        MemoryHandler.destroyObject(this)
    }

    public ChangeChainColor(distance: number) {
        let red = 0.0
        let green = 1.0
        let blue = 0.0
        const alpha = 1.0 // Default color is green

        const far: number = Chain.CalculateRangeByDifficulty('far')
        const good: number = Chain.CalculateRangeByDifficulty('good')

        if (distance > far) {
            red = 1.0
            green = 0.0
            blue = 0.0 // Red
        } else if (distance > good) {
            red = 1.0
            green = 1.0
            blue = 0.0 // Yellow
        }

        SetLightningColor(this.Lightning, red, green, blue, alpha)
    }

    public static CalculateRangeByDifficulty(rangeType: string) {
        const level = Difficulty.DifficultyValue
        let selectedRange: { good: number; far: number; breakPoint: number }

        switch (true) {
            case level >= DifficultyLevel.Nightmare:
                selectedRange = Chain.ranges[DifficultyLevel.Nightmare]
                break
            case level >= DifficultyLevel.Impossible:
                selectedRange = Chain.ranges[DifficultyLevel.Impossible]
                break
            case level >= DifficultyLevel.Hard:
                selectedRange = Chain.ranges[DifficultyLevel.Hard]
                break
            default:
                selectedRange = Chain.ranges[DifficultyLevel.Normal]
                break
        }

        switch (rangeType) {
            case 'good':
                return selectedRange.good
            case 'far':
                return selectedRange.far
            case 'breakPoint':
                return selectedRange.breakPoint
            default:
                throw new Error(`Invalid rangeType '${rangeType}'`)
        }
    }
}
