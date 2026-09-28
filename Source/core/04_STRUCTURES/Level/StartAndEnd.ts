import { ServiceManager } from 'Services'
import { MemoryHandler } from 'Utils/MemoryHandler'
import { createEvent } from 'Utils/mapUtils'
import { Text } from 'core/01_libraries/Text'
import { getUdgLevels } from '../../../../globals'
import { Hero2Escaper } from '../Escaper/Escaper_functions'
import { getSameLevelProgressionPlayers } from './LevelProgression'
import { Natives } from '../../wc3_natives_unsecured/Natives'
import { hooks } from '../../API/GeneralHooks'

abstract class RectInterface {
    minX: number
    minY: number
    maxX: number
    maxY: number
    r: rect

    constructor(minX: number, minY: number, maxX: number, maxY: number) {
        this.minX = minX
        this.minY = minY
        this.maxX = maxX
        this.maxY = maxY
        this.r = Rect(this.minX, this.minY, this.maxX, this.maxY)
    }

    getRandomX = () => {
        return GetRandomReal(this.minX, this.maxX)
    }

    getRandomY = () => {
        return GetRandomReal(this.minY, this.maxY)
    }

    getCenterX = () => {
        return GetRectCenterX(this.r)
    }

    getCenterY = () => {
        return GetRectCenterY(this.r)
    }

    destroy() {
        RemoveRect(this.r)
    }

    toJson(): false | { [x: string]: any } {
        const output = MemoryHandler.getEmptyObject<any>()

        output['minX'] = this.minX
        output['minY'] = this.minY
        output['maxX'] = this.maxX
        output['maxY'] = this.maxY

        return output
    }
}

export class Start extends RectInterface {
    facing?: number

    constructor(x1: number, y1: number, x2: number, y2: number, facing?: number) {
        super(RMinBJ(x1, x2), RMinBJ(y1, y2), RMaxBJ(x1, x2), RMaxBJ(y1, y2))

        this.facing = facing
    }

    getFacing = () => this.facing

    toJson = () => {
        const output = super.toJson()

        if (output) {
            if (this.facing) {
                output['facing'] = this.facing
            }
        }

        return output
    }
}

export class End extends RectInterface {
    private endReaching: trigger
    private alliedPlayersBeaten: { [x: number]: boolean } = {}

    constructor(levelId: number, x1: number, y1: number, x2: number, y2: number) {
        super(RMinBJ(x1, x2), RMinBJ(y1, y2), RMaxBJ(x1, x2), RMaxBJ(y1, y2))

        this.endReaching = createEvent({
            events: [t => TriggerRegisterEnterRectSimple(t, this.r)],
            actions: [
                () => {
                    const finisher = Hero2Escaper(Natives.UGetTriggerUnit())

                    if (!finisher) {
                        return
                    }

                    if (getUdgLevels().levelProgressionState[finisher.getId()] !== levelId) {
                        return
                    }

                    if (!getUdgLevels().goToNextLevel(finisher, true)) {
                        if (getUdgLevels().getLevelProgression() !== 'all') {
                            if (this.alliedPlayersBeaten[finisher.getId()]) {
                                return
                            }

                            for (const player of getSameLevelProgressionPlayers(finisher)) {
                                this.alliedPlayersBeaten[player.getId()] = true
                            }

                            ServiceManager.getService('Multiboard').onPlayerLevelCompleted(finisher)
                            Text.A('Good job ! You have finished the game.')
                            return
                        }

                        ServiceManager.getService('Multiboard').onPlayerLevelCompleted(finisher)

                        DisableTrigger(this.endReaching)
                        Text.A('Good job ! You have finished the game.')

                        for (const hook of hooks.hooks_onGameWinning.getHooks()) {
                            hook.execute0()
                        }

                        TriggerSleepAction(2)
                        Text.A('restart in 10 seconds')
                        TriggerSleepAction(10)
                        getUdgLevels().restartTheGame()
                    }
                },
            ],
        })

        DisableTrigger(this.endReaching)
    }

    activate = (activ: boolean) => {
        if (activ) {
            EnableTrigger(this.endReaching)
        } else {
            DisableTrigger(this.endReaching)
        }
    }

    destroy = () => {
        super.destroy()
        DestroyTrigger(this.endReaching)
    }
}

export class TpForEnd extends RectInterface {
    private tpForEndReaching: trigger

    constructor(levelId: number, x1: number, y1: number, x2: number, y2: number) {
        super(RMinBJ(x1, x2), RMinBJ(y1, y2), RMaxBJ(x1, x2), RMaxBJ(y1, y2))

        this.tpForEndReaching = createEvent({
            events: [t => TriggerRegisterEnterRectSimple(t, this.r)],
            actions: [
                () => {
                    const finisher = Hero2Escaper(Natives.UGetTriggerUnit())

                    if (!finisher) {
                        return
                    }

                    if (getUdgLevels().levelProgressionState[finisher.getId()] !== levelId) {
                        return
                    }

                    getUdgLevels().tpToEndOfLevel(finisher)
                },
            ],
        })

        DisableTrigger(this.tpForEndReaching)
    }

    activate = (activ: boolean) => {
        if (activ) {
            EnableTrigger(this.tpForEndReaching)
        } else {
            DisableTrigger(this.tpForEndReaching)
        }
    }

    destroy = () => {
        super.destroy()
        DestroyTrigger(this.tpForEndReaching)
    }
}

export let DEPART_PAR_DEFAUT: Start

export const init_StartAndEnd = () => {
    DEPART_PAR_DEFAUT = new Start(-50, -50, 50, 50)
}
