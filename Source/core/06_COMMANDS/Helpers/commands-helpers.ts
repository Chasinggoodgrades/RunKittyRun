// For -snapPatrolsToSlideOffset and -snapPatrolsToSlide commands
import { getUdgEscapers, getUdgMonsterTypes, getUdgTerrainTypes } from '../../../../globals'
import { createPoint } from '../../../Utils/Point'
import { Escaper } from '../../04_STRUCTURES/Escaper/Escaper'
import { MonsterType } from '../../04_STRUCTURES/Monster/MonsterType'
import {
    DEFAULT_AUTO_TURN_MODE,
    getAutoTurnMode,
    isCursorFollowingAutoTurnMode,
    setAutoTurnMode,
} from '../../Async_slide/AutoTurn'
import { isTestingAsyncClicks, setMouseTrackingEnabled } from '../../Async_slide/HeroEffect'
import { setNetworkClickListeningEnabled } from '../../Async_slide/NetworkClick'

export const snapPatrolsToSlideOffsetMap: { [mt: string]: { angle: number; offset: number } | null } = {}
const snappedHistoryMap: { [historyId: string]: { x: number | undefined; y: number | undefined } } = {}

export const snapPointToSlide = (
    historyId: string,
    _x1: number,
    _y1: number,
    x2: number,
    y2: number,
    preferredDistance: number,
    fixStartOnSlidePatrols: boolean,
    mt: MonsterType
) => {
    const x1 = snappedHistoryMap[historyId]?.x || _x1
    const y1 = snappedHistoryMap[historyId]?.y || _y1

    if (!snappedHistoryMap[historyId]) {
        snappedHistoryMap[historyId] = { x: _x1, y: _y1 }
    }

    const currentTerrain = getUdgTerrainTypes().getTerrainType(x1, y1)
    let newX = x1
    let newY = y1

    if (currentTerrain?.kind === 'death') {
        const angle = Atan2(y2 - y1, x2 - x1)
        let currentX: number | undefined = undefined
        let currentY: number | undefined = undefined

        for (let i = 0; i <= 256; i++) {
            const testX = x1 + Math.cos(angle) * i
            const testY = y1 + Math.sin(angle) * i
            const tt = getUdgTerrainTypes().getTerrainType(testX, testY)

            if (tt?.kind === 'slide' || tt?.kind === 'walk') {
                currentX = testX
                currentY = testY
                break
            }
        }

        if (currentX !== undefined && currentY !== undefined) {
            const oppositeAngle = angle + Math.PI

            newX = currentX + Math.cos(oppositeAngle) * (preferredDistance + GetRandomInt(-4, 4))
            newY = currentY + Math.sin(oppositeAngle) * (preferredDistance + GetRandomInt(-4, 4))
        }
    }

    if (fixStartOnSlidePatrols && (currentTerrain?.kind === 'slide' || currentTerrain?.kind === 'walk')) {
        const angle = Atan2(y2 - y1, x2 - x1) + Math.PI

        let currentX: number | undefined = undefined
        let currentY: number | undefined = undefined

        for (let i = 0; i <= 256; i++) {
            const testX = x1 + Math.cos(angle) * i
            const testY = y1 + Math.sin(angle) * i
            const tt = getUdgTerrainTypes().getTerrainType(testX, testY)

            if (tt?.kind === 'death') {
                currentX = testX
                currentY = testY
                break
            }
        }

        if (currentX !== undefined && currentY !== undefined) {
            const oppositeAngle = angle

            newX = currentX + Math.cos(oppositeAngle) * (preferredDistance + GetRandomInt(-4, 4))
            newY = currentY + Math.sin(oppositeAngle) * (preferredDistance + GetRandomInt(-4, 4))
        }
    }

    const item = snapPatrolsToSlideOffsetMap[mt.label] || snapPatrolsToSlideOffsetMap['all']

    if (item) {
        newX += Math.cos(item.angle) * item.offset
        newY += Math.sin(item.angle) * item.offset
    }

    return createPoint(newX, newY)
}

// For command -patchImmo
export const adaptMonstersImmolation = (delta: number) => {
    getUdgMonsterTypes().forAll(monsterType => {
        const previousImmolationRadius = monsterType.getImmolationRadius()
        if (previousImmolationRadius > 0) {
            // if immolation is null, we keep it null
            const newImmolationRadius = Math.max(5, Math.min(400, monsterType.getImmolationRadius() + delta))
            monsterType.setImmolation(newImmolationRadius)
        }
    })
}

export const cameraFieldMap: { [x: string]: camerafield } = {
    TARGET_DISTANCE: CAMERA_FIELD_TARGET_DISTANCE,
    FARZ: CAMERA_FIELD_FARZ,
    ANGLE_OF_ATTACK: CAMERA_FIELD_ANGLE_OF_ATTACK,
    FIELD_OF_VIEW: CAMERA_FIELD_FIELD_OF_VIEW,
    ROLL: CAMERA_FIELD_ROLL,
    ROTATION: CAMERA_FIELD_ROTATION,
    ZOFFSET: CAMERA_FIELD_ZOFFSET,
    NEARZ: CAMERA_FIELD_NEARZ,
    LOCAL_PITCH: CAMERA_FIELD_LOCAL_PITCH,
    LOCAL_YAW: CAMERA_FIELD_LOCAL_YAW,
    LOCAL_ROLL: CAMERA_FIELD_LOCAL_ROLL,
}

// For -autoTurn and -testAsyncClicks commands

/**
 * What the asynchronous slide costs, switched on and off with the modes that ask for it.
 *
 * What crosses the network is kept to what is read, and that is decided on every machine alike.
 */
export const updateAsyncNeeds = (escaper: Escaper) => {
    const mode = getAutoTurnMode(escaper.getId())
    const isTesting = isTestingAsyncClicks(escaper.getId())

    // Where the mouse of a player points only has to cross the network for the sync mode, which
    // aims with it. The async mode reads its own cursor on its own machine and tells the others
    // where its hero looks, so nobody needs the mouse itself.
    setMouseTrackingEnabled(escaper.getId(), mode === 'sync' || isTesting)

    // The clicks are another matter: the modes following the cursor hand the hero over to the mouse and
    // take it back with them. asyncClicks reads its clicks on its own machine, and the game turns the
    // hero from the orders they give as it always did.
    setNetworkClickListeningEnabled(escaper.getId(), isCursorFollowingAutoTurnMode(mode) || isTesting)
}

/**
 * Gives every player the default auto turn mode (see DEFAULT_AUTO_TURN_MODE), exactly as "-autoTurn"
 * would: called at the start of the game, on every machine at once. A player can still change it,
 * by hand or with their start commands.
 */
export const applyDefaultAutoTurnMode = () => {
    if (DEFAULT_AUTO_TURN_MODE === 'off') {
        return
    }

    getUdgEscapers().forAll(escaper => {
        // a secondary hero follows its main one, which is given the mode
        if (escaper.isEscaperSecondary()) {
            return
        }

        setAutoTurnMode(escaper.getId(), DEFAULT_AUTO_TURN_MODE)
        updateAsyncNeeds(escaper)
    })
}
