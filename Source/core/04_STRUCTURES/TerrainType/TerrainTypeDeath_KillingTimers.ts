import { Constants } from 'core/01_libraries/Constants'
import { forRange } from 'Utils/mapUtils'
import { getUdgEscapers, getUdgLevels, getUdgTerrainTypes } from '../../../../globals'
import { isDeathTerrain } from './TerrainType'
import { Natives } from '../../wc3_natives_unsecured/Natives'

export class KillingTimers {
    private timers: timer[] = []

    constructor() {
        forRange(Constants.NB_ESCAPERS, i => (this.timers[i] = CreateTimer()))
    }

    destroy = () => {
        forRange(Constants.NB_ESCAPERS, i => DestroyTimer(this.timers[i]))
    }

    destroyTimer = (timerId: number) => {
        PauseTimer(this.timers[timerId])
    }

    TerrainKillTimer2Escaper = (theTimer: timer) => {
        let escaperId = 0

        for (const [_, terrainType] of pairs(getUdgTerrainTypes().getAll())) {
            if (isDeathTerrain(terrainType)) {
                escaperId = 0

                while (!(escaperId >= Constants.NB_ESCAPERS)) {
                    if (theTimer == terrainType.getTimer(escaperId)) {
                        return getUdgEscapers().get(escaperId)
                    }

                    escaperId = escaperId + 1
                }
            }
        }
    }

    start = (timerId: number, time: number) => {
        TimerStart(this.timers[timerId], time, false, () => {
            const escaper = this.TerrainKillTimer2Escaper(Natives.UGetExpiredTimer())

            if (!escaper) {
                return
            }

            escaper.pause(false)
            escaper.destroyTerrainKillEffect()

            if (escaper.currentLevelTouchTerrainDeath == getUdgLevels().getCurrentLevel()) {
                escaper.kill()
            } else {
                if (escaper.isAlive()) {
                    escaper.enableCheckTerrain(true)
                }
            }
        })

        const escaper = getUdgEscapers().get(timerId)

        if (escaper) {
            escaper.currentLevelTouchTerrainDeath = getUdgLevels().getCurrentLevel()
        }
    }

    get = (id: number): timer => this.timers[id]
}
