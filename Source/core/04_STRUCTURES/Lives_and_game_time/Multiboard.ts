import { ServiceManager } from 'Services'
import { literalArray } from 'Utils/ArrayUtils'
import { IDestroyable, MemoryHandler } from 'Utils/MemoryHandler'
import { progressionUtils } from 'Utils/ProgressionUtils'
import { createTimer, forRange } from 'Utils/mapUtils'
import { arrayPush, ucfirst } from 'core/01_libraries/Basic_functions'
import { Constants } from 'core/01_libraries/Constants'
import { udg_colorCode } from 'core/01_libraries/Init_colorCodes'
import { AfkMode } from 'core/08_GAME/Afk_mode/Afk_mode'
import { getUdgEscapers, getUdgLevels, globals } from '../../../../globals'
import { playerId2colorId, rawPlayerNames } from '../../06_COMMANDS/Helpers/Command_functions'
import { Escaper } from '../Escaper/Escaper'
import { sameLevelProgression } from '../Level/LevelProgression'
import { TerrainTypeSlide } from '../TerrainType/TerrainTypeSlide'
import { LIVES_PLAYER } from './Lives_and_game_time'
import { GameTime } from './Time_of_game_trigger'
import { Natives } from '../../wc3_natives_unsecured/Natives'

// Column and row start at index 1

const getLongestNameWidth = () => {
    let nameWidth = 5

    for (const playerName of rawPlayerNames) {
        if (playerName.length > nameWidth) {
            nameWidth = playerName.length
        }
    }

    return nameWidth / 2 + 3
}

type IBoardMode = 'multiboard' | 'leaderboard'

type IStatsMode = (typeof statsModes)[0]
const statsModes = literalArray(['global', 'current', 'speedrun'])

export type IMultiboard = ReturnType<typeof initMultiboard>

export const initMultiboard = () => {
    let mb: multiboard | null
    let lb: leaderboard | null

    const playerScores: {
        [x: number]: {
            stats: {
                [K in IStatsMode]: {
                    score: number
                    saves: number
                    deaths: number
                    points: number
                }
            }
            mode: IBoardMode
            statsMode: IStatsMode
            visible: boolean
        }
    } = {}

    const playerLastRowIndex: { [x: number]: number } = {}

    let amountOfEscapers = 0
    let pointsEnabled = false
    let progressionEnabled = false
    let levelEnabled = false
    let pointsEarnedOnLevelCompletion = 0
    let pointsEarnedOnMeteorCompletion = 0
    let pointsEarnedOnMeteorCompletionMaxPerLevel = 0

    forRange(Constants.NB_ESCAPERS, i => {
        playerScores[i] = {
            stats: {
                global: { score: 0, saves: 0, deaths: 0, points: 0 },
                current: { score: 0, saves: 0, deaths: 0, points: 0 },
                speedrun: { score: 0, saves: 0, deaths: 0, points: 0 },
            },
            mode: 'multiboard',
            statsMode: 'global',
            visible: true,
        }
    })

    const resetRoundScores = () => {
        forRange(Constants.NB_ESCAPERS, i => {
            playerScores[i].stats.current.score = 0
            playerScores[i].stats.current.saves = 0
            playerScores[i].stats.current.deaths = 0
            playerScores[i].stats.current.points = 0
        })

        GameTime.current.resetGameTime()
        GameTime.speedrun.resetGameTime()

        reinitBoards()
        amountOfEscapers = getUdgEscapers().countMain()
    }

    const initMultiboard = () => {
        const cols = 4 + (pointsEnabled ? 1 : 0) + (progressionEnabled ? 1 : 0) + (levelEnabled ? 1 : 0)
        const rows = 3 + getUdgEscapers().countMain()

        const nameWidth = getLongestNameWidth()

        mb = Natives.UCreateMultiboardBJ(cols, rows, `${globals.scoreboardLabel} - Global`)

        for (let col = 1; col <= cols; col++) {
            for (let row = 1; row <= rows; row++) {
                MultiboardSetItemStyleBJ(mb, col, row, true, false)

                if (col === 1) {
                    if (row <= 2) {
                        // Header
                        MultiboardSetItemWidthBJ(mb, col, row, 15)
                    } else {
                        // Players
                        MultiboardSetItemWidthBJ(mb, col, row, nameWidth)
                    }
                } else {
                    MultiboardSetItemWidthBJ(mb, col, row, 4)
                }
            }
        }

        MultiboardSetItemValueBJ(mb, 1, 3, 'Player Name')
        MultiboardSetItemValueBJ(mb, 2, 3, 'Score')
        MultiboardSetItemValueBJ(mb, 3, 3, 'Saves')
        MultiboardSetItemValueBJ(mb, 4, 3, 'Deaths')
        pointsEnabled && MultiboardSetItemValueBJ(mb, 5, 3, 'Points')
        progressionEnabled && MultiboardSetItemValueBJ(mb, pointsEnabled ? 6 : 5, 3, 'Prog')
        levelEnabled && MultiboardSetItemValueBJ(mb, pointsEnabled ? 7 : 6, 3, 'Level')
    }

    const initLeaderboard = () => {
        // Disabled leaderboard for full -ui support; causes desyncs when used together since they're bound to the same frame and they're both overwriting eachother
        //
        // lb = CreateLeaderboardBJ(GetPlayersAll(), '')
        // LeaderboardAddItemBJ(Player(0), lb, 'Game time', 0)
        // LeaderboardSetPlayerItemStyleBJ(Player(0), lb, true, false, false)
        // LeaderboardAddItemBJ(LIVES_PLAYER, lb, 'Lives', 0)
    }

    const getOrCreateLeaderboard = () => {
        if (lb) return lb

        initLeaderboard()
        return lb!
    }

    const destroyBoards = () => {
        if (mb) {
            DestroyMultiboard(mb)
            mb = null
        }

        if (lb) {
            DestroyLeaderboard(lb)
            lb = null
        }
    }

    const reinitBoards = () => {
        // Hide boards to reset position
        getUdgEscapers().forMainEscapers(escaper => updateVisibility(escaper, false))

        destroyBoards()

        initMultiboard()
        initLeaderboard()

        // Toggle visibility to update board width
        getUdgEscapers().forMainEscapers(escaper => updateVisibility(escaper, true))

        // Restore player visibility state
        getUdgEscapers().forMainEscapers(escaper => {
            updateVisibility(escaper, playerScores[GetPlayerId(escaper.getPlayer())].visible)
        })

        updateBoards()
    }

    const updateLives = (lives: number) => {
        mb && MultiboardSetItemValueBJ(mb, 1, 1, `${udg_colorCode[6]}Lives: ${lives}`)
        lb && LeaderboardSetPlayerItemValueBJ(LIVES_PLAYER, lb, lives)
    }

    const updateGametime = (reinitCheck: boolean) => {
        if (reinitCheck) {
            const currentCount = getUdgEscapers().countMain()

            if (currentCount !== amountOfEscapers) {
                reinitBoards()
                amountOfEscapers = currentCount
            }
        }

        const globalGameTimeStr = GameTime.global.getGameTime()
        const currentGameTimeStr = GameTime.current.getGameTime()
        const speedrunGameTimeStr = GameTime.speedrun.getGameTime()

        for (let i = 0; i < Constants.NB_ESCAPERS; i++) {
            if (GetLocalPlayer() === Natives.UPlayer(i)) {
                const statsMode = playerScores[i].statsMode

                if (statsMode === 'current') {
                    mb && MultiboardSetItemValueBJ(mb, 1, 2, `|Cfffed312Game time: ${currentGameTimeStr}`)
                    lb &&
                        LeaderboardSetPlayerItemLabelBJ(
                            Natives.UPlayer(0),
                            lb,
                            `|Cfffed312Game time: ${currentGameTimeStr}`
                        )
                } else if (statsMode === 'global') {
                    mb && MultiboardSetItemValueBJ(mb, 1, 2, `|Cfffed312Game time: ${globalGameTimeStr}`)
                    lb &&
                        LeaderboardSetPlayerItemLabelBJ(
                            Natives.UPlayer(0),
                            lb,
                            `|Cfffed312Game time: ${globalGameTimeStr}`
                        )
                } else if (statsMode === 'speedrun') {
                    mb && MultiboardSetItemValueBJ(mb, 1, 2, `|Cfffed312Game time: ${speedrunGameTimeStr}`)
                    lb &&
                        LeaderboardSetPlayerItemLabelBJ(
                            Natives.UPlayer(0),
                            lb,
                            `|Cfffed312Game time: ${speedrunGameTimeStr}`
                        )
                }
            }

            if (progressionEnabled) {
                const escaper = getUdgEscapers().get(i)

                if (!escaper) {
                    continue
                }

                const rowIndex = playerLastRowIndex[escaper.getId()]

                if (!rowIndex) {
                    continue
                }

                const playerId = escaper.getEscaperId()
                const colorCode = udg_colorCode[playerId2colorId(playerId)]

                progressionUtils.calcDisplayedPlayerProgression(escaper)

                mb &&
                    MultiboardSetItemValueBJ(
                        mb,
                        pointsEnabled ? 6 : 5,
                        4 + rowIndex,
                        colorCode + progressionUtils.getPlayerProgression(escaper) + '%'
                    )

                mb &&
                    MultiboardSetItemValueBJ(
                        mb,
                        pointsEnabled ? 7 : 6,
                        4 + rowIndex,
                        colorCode + getUdgLevels().getCurrentLevel(escaper).getId()
                    )
            }
        }
    }

    const playerSortGlobal = (a: Escaper, b: Escaper) => {
        const scoreA = playerScores[GetPlayerId(a.getPlayer())].stats.global.score
        const scoreB = playerScores[GetPlayerId(b.getPlayer())].stats.global.score

        if (scoreA === scoreB) {
            return GetPlayerId(a.getPlayer()) < GetPlayerId(b.getPlayer())
        } else {
            return scoreA > scoreB
        }
    }

    const playerSortCurrent = (a: Escaper, b: Escaper) => {
        const scoreA = playerScores[GetPlayerId(a.getPlayer())].stats.current.score
        const scoreB = playerScores[GetPlayerId(b.getPlayer())].stats.current.score

        if (scoreA === scoreB) {
            return GetPlayerId(a.getPlayer()) < GetPlayerId(b.getPlayer())
        } else {
            return scoreA > scoreB
        }
    }

    const updatePlayers = () => {
        if (!mb) return

        let rowIndex = 0

        const sortedArray = MemoryHandler.getEmptyArray<Escaper>()

        for (const [_, escaper] of pairs(getUdgEscapers().getAll())) {
            sortedArray.push(escaper)
        }

        for (let i = 0; i < Constants.NB_ESCAPERS; i++) {
            if (GetLocalPlayer() === Natives.UPlayer(i)) {
                const statsMode = playerScores[i].statsMode

                if (statsMode === 'current') {
                    table.sort(sortedArray, playerSortCurrent)
                } else if (statsMode === 'global') {
                    table.sort(sortedArray, playerSortGlobal)
                }

                for (const escaper of sortedArray) {
                    if (escaper.isEscaperSecondary()) {
                        continue
                    }

                    const playerId = escaper.getEscaperId()
                    const playerName = escaper.getDisplayName()

                    const colorCode = udg_colorCode[playerId2colorId(playerId)]
                    const playerScore = playerScores[playerId].stats[statsMode]

                    MultiboardSetItemValueBJ(mb, 1, 4 + rowIndex, colorCode + playerName)
                    MultiboardSetItemValueBJ(mb, 2, 4 + rowIndex, colorCode + playerScore.score)
                    MultiboardSetItemValueBJ(mb, 3, 4 + rowIndex, colorCode + playerScore.saves)
                    MultiboardSetItemValueBJ(mb, 4, 4 + rowIndex, colorCode + playerScore.deaths)
                    pointsEnabled && MultiboardSetItemValueBJ(mb, 5, 4 + rowIndex, colorCode + playerScore.points)

                    progressionEnabled &&
                        MultiboardSetItemValueBJ(
                            mb,
                            pointsEnabled ? 6 : 5,
                            4 + rowIndex,
                            colorCode + progressionUtils.getPlayerProgression(escaper) + '%'
                        )

                    mb &&
                        MultiboardSetItemValueBJ(
                            mb,
                            pointsEnabled ? 7 : 6,
                            4 + rowIndex,
                            colorCode + getUdgLevels().getCurrentLevel(escaper).getId()
                        )

                    playerLastRowIndex[escaper.getId()] = rowIndex

                    rowIndex++
                }
            }
        }

        MemoryHandler.destroyArray(sortedArray)
    }

    const updateBoards = () => {
        updateGametime(false)
        updateLives(ServiceManager.getService('Lives').get())

        updatePlayers()
    }

    const setVisibility = (escaper: Escaper, visible: boolean) => {
        playerScores[GetPlayerId(escaper.getPlayer())].visible = visible
        updateVisibility(escaper, visible)
    }

    const updateVisibility = (escaper: Escaper, visible: boolean) => {
        const playerMode = playerScores[GetPlayerId(escaper.getPlayer())]

        if (GetLocalPlayer() === escaper.getPlayer()) {
            mb &&
                MultiboardSetTitleText(
                    mb,
                    `${globals.scoreboardLabel} - ${ucfirst(playerMode.statsMode)}` +
                        (getUdgLevels().isNoobEdit() ? ' - ' + udg_colorCode[Constants.RED] + 'Noobedit' + '|r' : '') +
                        (getUdgLevels().isSpeedEdit() ? ' - ' + udg_colorCode[Constants.PURPLE] + 'SPEED' + '|r' : '')
                )

            mb && MultiboardDisplay(mb, !escaper.hideLeaderboard && playerMode.mode === 'multiboard' && visible)
            lb && LeaderboardDisplay(lb, !escaper.hideLeaderboard && playerMode.mode === 'leaderboard' && visible)
        }
    }

    const setMode = (escaper: Escaper, mode: IBoardMode) => {
        playerScores[GetPlayerId(escaper.getPlayer())].mode = mode

        setVisibility(escaper, true)
    }

    const setStatsMode = (escaper: Escaper, statsMode: IStatsMode) => {
        playerScores[GetPlayerId(escaper.getPlayer())].statsMode = statsMode

        updatePlayers()

        setVisibility(escaper, true)
    }

    const increasePlayerScore = (playerId: number, score: 'saves' | 'deaths') => {
        for (const statsMode of statsModes) {
            playerScores[playerId].stats[statsMode][score]++
            playerScores[playerId].stats[statsMode].score =
                playerScores[playerId].stats[statsMode].saves - playerScores[playerId].stats[statsMode].deaths
        }

        updatePlayers()
    }

    const setPointsEnabled = (enabled: boolean) => {
        if (pointsEnabled !== enabled) {
            pointsEnabled = enabled
            reinitBoards()
        }
    }

    const setProgressionEnabled = (enabled: boolean) => {
        if (progressionEnabled !== enabled) {
            progressionEnabled = enabled
            reinitBoards()
        }
    }

    const setLevelEnabled = (enabled: boolean) => {
        if (levelEnabled !== enabled) {
            levelEnabled = progressionEnabled && enabled
            reinitBoards()
        }
    }

    const onPlayerLevelCompleted = (player: Escaper) => {
        if (pointsEnabled && pointsEarnedOnLevelCompletion > 0) {
            for (const [targetId] of pairs(playerScores)) {
                const targetEscaper = getUdgEscapers().get(targetId)

                if (targetEscaper && sameLevelProgression(player, targetEscaper)) {
                    adjustPlayerPoints(targetId, pointsEarnedOnLevelCompletion)
                }
            }
        }
    }

    const playerMeteorsInLvl: { [levelIdAndPlayerId: string]: number } = {}

    const onPlayerMeteorCompleted = (escaper: Escaper) => {
        if (pointsEnabled && pointsEarnedOnMeteorCompletion > 0) {
            for (const [targetId] of pairs(playerScores)) {
                const targetEscaper = getUdgEscapers().get(targetId)

                if (targetEscaper && sameLevelProgression(escaper, targetEscaper)) {
                    const currentLevel = getUdgLevels().getCurrentLevel(targetEscaper).id

                    if (!playerMeteorsInLvl[`${currentLevel}_${targetId}`]) {
                        playerMeteorsInLvl[`${currentLevel}_${targetId}`] = 0
                    }

                    let pointsToGive = pointsEarnedOnMeteorCompletion

                    if (
                        pointsEarnedOnMeteorCompletionMaxPerLevel > 0 &&
                        pointsToGive + playerMeteorsInLvl[`${currentLevel}_${targetId}`] >
                            pointsEarnedOnMeteorCompletionMaxPerLevel
                    ) {
                        pointsToGive =
                            pointsEarnedOnMeteorCompletionMaxPerLevel -
                            playerMeteorsInLvl[`${currentLevel}_${targetId}`]
                    }

                    // Shouldn't be possible
                    if (pointsToGive < 0) {
                        continue
                    }

                    playerMeteorsInLvl[`${currentLevel}_${targetId}`] += pointsToGive
                    adjustPlayerPoints(targetId, pointsToGive)
                }
            }
        }
    }

    const adjustPlayerPoints = (playerId: number, points: number) => {
        for (const statsMode of statsModes) {
            playerScores[playerId].stats[statsMode].points += points
        }

        updatePlayers()
    }

    const setPlayerPoints = (playerId: number, points: number) => {
        for (const statsMode of statsModes) {
            playerScores[playerId].stats[statsMode].points = points
        }

        updatePlayers()
    }

    const setPointsEarnedOnLevelCompletion = (points: number) => {
        pointsEarnedOnLevelCompletion = points
    }

    const setPointsEarnedOnMeteorCompletion = (points: number) => {
        pointsEarnedOnMeteorCompletion = points
    }

    const setPointsEarnedOnMeteorCompletionMaxPerLevel = (points: number) => {
        pointsEarnedOnMeteorCompletionMaxPerLevel = points
    }

    createTimer(1, true, () => {
        GameTime.global.updateGameTime()
        GameTime.current.updateGameTime()

        let isSliding = false

        for (const [_, escaper] of pairs(getUdgEscapers().getAll())) {
            if (escaper.isSliding()) {
                isSliding = true
                break
            }
        }

        if (isSliding) {
            GameTime.speedrun.updateGameTime()
        }

        updateGametime(true)
        handleDitchLogic()
    })

    type ITarget = { escaper: Escaper; progression: number }
    const progressionCompare = (a: ITarget, b: ITarget) => b.progression > a.progression

    const ditchEffects: { [escaperId: number]: effect } = {}

    // Not really multiboard but w/e
    const handleDitchLogic = () => {
        if (getUdgLevels().getLevelProgression() === 'solo') {
            return
        }

        const sortedTargets = MemoryHandler.getEmptyArray<ITarget & IDestroyable>()

        for (const [_, escaper] of pairs(getUdgEscapers().getAll())) {
            if (
                AfkMode.isAfk[escaper.getId()] ||
                escaper.hasAutorevive() ||
                (escaper.getLastTerrainType() !== null &&
                    !(escaper.getLastTerrainType() instanceof TerrainTypeSlide)) ||
                !escaper.getHero()
            ) {
                continue
            }

            const target = MemoryHandler.getEmptyObject<ITarget>()
            target.escaper = escaper
            target.progression = progressionUtils.getPlayerProgression(escaper)
            arrayPush(sortedTargets, target)
        }

        if (sortedTargets.length > 1) {
            table.sort(sortedTargets, progressionCompare)

            const groupedTargets = MemoryHandler.getEmptyArray<ITarget[] & IDestroyable>()

            // Group players with same level progression
            for (const target of sortedTargets) {
                let foundGroup = false

                for (const group of groupedTargets) {
                    if (sameLevelProgression(group[0].escaper, target.escaper)) {
                        arrayPush(group, target)
                        foundGroup = true
                        break
                    }
                }

                if (!foundGroup) {
                    const newGroup = MemoryHandler.getEmptyArray<ITarget>()
                    arrayPush(newGroup, target)
                    arrayPush(groupedTargets, newGroup)
                }
            }

            // Figure out which players should have the ditch effect
            const ditchEffectPlayers = MemoryHandler.getEmptyObject<{ [escaperId: string]: Escaper }>()

            for (const group of groupedTargets) {
                if (group.length < 2) {
                    continue
                }

                let deadPlayer: Escaper | undefined = undefined

                for (const target of group) {
                    const hero = target.escaper.getHero()

                    if (!hero) {
                        continue
                    }

                    if (!target.escaper.isAlive()) {
                        deadPlayer = target.escaper
                        continue
                    }

                    // Only enable when all players behind are dead
                    if (!deadPlayer && target.escaper.isAlive()) {
                        break
                    }

                    if (deadPlayer) {
                        ditchEffectPlayers[target.escaper.getId()] = target.escaper
                        break
                    }
                }
            }

            // Remove ditch effects that are no longer needed
            for (const [escaperId, ditchEffect] of pairs(ditchEffects)) {
                if (!ditchEffectPlayers[escaperId]) {
                    DestroyEffect(ditchEffect)
                    delete ditchEffects[escaperId]
                }
            }

            // Create ditch effects that are needed
            for (const [_, escaper] of pairs(ditchEffectPlayers)) {
                if (!ditchEffects[escaper.getId()]) {
                    const hero = escaper.getHero()

                    if (hero) {
                        ditchEffects[escaper.getId()] = Natives.UAddSpecialEffectTargetUnitBJ(
                            'overhead',
                            hero,
                            'AbilitiesSpellsOtherTalkToMeTalkToMe.mdl'
                        )
                    }
                }
            }

            // Cleanup variables
            for (const group of groupedTargets) {
                group.__destroy()
            }

            groupedTargets.__destroy()
            ditchEffectPlayers.__destroy()
        }

        sortedTargets.__destroy(true)
    }

    return {
        setVisibility,
        setMode,
        setStatsMode,
        increasePlayerScore,
        updateLives,
        resetRoundScores,
        getOrCreateLeaderboard,
        reinitBoards,
        setPointsEnabled,
        setProgressionEnabled,
        setLevelEnabled,
        adjustPlayerPoints,
        setPlayerPoints,
        setPointsEarnedOnLevelCompletion,
        setPointsEarnedOnMeteorCompletion,
        setPointsEarnedOnMeteorCompletionMaxPerLevel,
        onPlayerLevelCompleted,
        onPlayerMeteorCompleted,
        arePointsEnabled: () => pointsEnabled,
    }
}
