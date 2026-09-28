import { EffectUtils } from 'Utils/EffectUtils'
import { IPoint, createPoint } from 'Utils/Point'
import { createEvent } from 'Utils/mapUtils'
import { Constants } from 'core/01_libraries/Constants'
import { udg_doubleHeroesEnabled } from 'core/Double_heroes/double_heroes_config'
import { getUdgEscapers } from '../../../../globals'

const startPositions: location[] = []
const startPositionsRandomized: location[] = []
const playerIdsRandomized: number[] = []

export const HERO_START_ANGLE = 90

const TIME_BEFORE_HERO_SPAWN = 3
const TIME_BETWEEN_EACH_HERO_SPAWN = 0.1
let EFFECT_FOR_MISSING_HEROES = 'Abilities\\Spells\\Undead\\DeathPact\\DeathPactTarget.mdl'

const staticSpawns: IPoint[] = []

export const heroes = {
    setEffectForMissingHeroes: (effectStr: string) => {
        EFFECT_FOR_MISSING_HEROES = effectStr
    },
    setStaticSpawnPositions: (spawns: rect[]) => {
        for (const spawn of spawns) {
            staticSpawns.push(createPoint(GetRectCenterX(spawn), GetRectCenterY(spawn)))
        }

        if (spawns.length > 0) {
            let i = 0

            while (staticSpawns.length < Constants.NB_ESCAPERS) {
                const spawn = spawns[i++]
                staticSpawns.push(createPoint(GetRectCenterX(spawn), GetRectCenterY(spawn)))

                if (i >= spawns.length) {
                    i = 0
                }
            }
        }
    },
}

const RandomizeStartPositionsAndHeroSpawnOrder = () => {
    let alreadyAdded: boolean[] = []
    let n: number
    let i: number

    //randomize start positions
    i = 0
    while (true) {
        if (i >= Constants.NB_ESCAPERS) break
        while (true) {
            n = GetRandomInt(0, Constants.NB_ESCAPERS - 1)
            if (!alreadyAdded[n]) break
        }
        startPositionsRandomized[i] =
            staticSpawns.length > 0 ? Location(staticSpawns[n].x, staticSpawns[n].y) : startPositions[n]
        alreadyAdded[n] = true
        i = i + 1
    }

    //reinit alreadyAdded to false
    i = 0
    while (true) {
        if (i >= Constants.NB_ESCAPERS) break
        alreadyAdded[i] = false
        i = i + 1
    }

    //randomize hero spawn order
    i = 0
    while (true) {
        if (i >= Constants.NB_PLAYERS_MAX) break
        while (true) {
            n = GetRandomInt(0, Constants.NB_PLAYERS_MAX - 1)
            if (!alreadyAdded[n]) break
        }
        playerIdsRandomized[i] = n
        alreadyAdded[n] = true
        i = i + 1
    }

    if (udg_doubleHeroesEnabled) {
        while (true) {
            if (i >= Constants.NB_ESCAPERS) break
            while (true) {
                n = GetRandomInt(Constants.NB_PLAYERS_MAX, Constants.NB_ESCAPERS - 1)
                if (!alreadyAdded[n]) break
            }
            playerIdsRandomized[i] = n
            alreadyAdded[n] = true
            i = i + 1
        }
    }
}

//===========================================================================
export const init_Heroes = () => {
    const NB_COLUMNS = Math.random() > 0.5 ? 6 : 4
    const NB_ROWS = NB_COLUMNS == 4 ? 6 : 4

    //define start positions
    const minX = GetRectMinX(gg_rct_departLvl_0)
    const minY = GetRectMinY(gg_rct_departLvl_0)
    const diffX = (GetRectMaxX(gg_rct_departLvl_0) - minX) / (NB_COLUMNS - 1)
    const diffY = (GetRectMaxY(gg_rct_departLvl_0) - minY) / (NB_ROWS - 1)
    let x = 0
    let y = 0
    let n = 0
    let spawnPeriod = TIME_BEFORE_HERO_SPAWN

    if (udg_doubleHeroesEnabled) {
        spawnPeriod = spawnPeriod / 2
    }

    while (true) {
        if (y > NB_ROWS - 1) break
        while (true) {
            if (x > NB_COLUMNS - 1) break
            startPositions[n] = Location(minX + diffX * x, minY + diffY * y)
            n = n + 1
            x = x + 1
        }
        x = 0
        y = y + 1
    }

    if (udg_doubleHeroesEnabled) {
        x = 0
        y = 0
        while (true) {
            if (y > NB_ROWS - 1) break
            while (true) {
                if (x > NB_COLUMNS - 1) break
                startPositions[n] = Location(minX + diffX * x, minY + diffY * y)
                n = n + 1
                x = x + 1
            }
            x = 0
            y = y + 1
        }
    }

    createEvent({
        events: [t => TriggerRegisterTimerEvent(t, spawnPeriod, false)],
        actions: [
            () => {
                //randomize start positions
                RandomizeStartPositionsAndHeroSpawnOrder()

                //create heroes
                for (let i = 0; i < Constants.NB_ESCAPERS; i++) {
                    if (!getUdgEscapers().get(i)?.getHero()) {
                        if (GetPlayerId(GetLocalPlayer()) === i) {
                            ClearSelection()
                        }
                    }
                }

                for (let i = 0; i < Constants.NB_ESCAPERS; i++) {
                    const n = playerIdsRandomized[i]
                    if (getUdgEscapers().get(n)) {
                        getUdgEscapers()
                            .get(n)
                            ?.createHero(
                                GetLocationX(startPositionsRandomized[n]),
                                GetLocationY(startPositionsRandomized[n]),
                                HERO_START_ANGLE
                            )
                    } else {
                        EffectUtils.destroyEffect(
                            EffectUtils.addSpecialEffectLoc(EFFECT_FOR_MISSING_HEROES, startPositionsRandomized[n])
                        )
                    }
                    ;(startPositionsRandomized[n] as any) = null
                    TriggerSleepAction(TIME_BETWEEN_EACH_HERO_SPAWN)
                }

                //call EnableTrigger(gg_trg_anticheat_teleport_and_revive)
                //AnticheatTeleport_justRevived = true
            },
        ],
    })
}
