import { clearDeathCause, setDeathCause } from 'core/Log/DeathCause'
import { ReplaceBackslahsesInLinks } from '../../01_libraries/Basic_functions'
import { Constants } from '../../01_libraries/Constants'
import { COLOR_TERRAIN_DEATH } from '../../01_libraries/Init_colorCodes'
import { Text } from '../../01_libraries/Text'
import type { Escaper } from '../Escaper/Escaper'
import { DISPLAY_SPACE, TerrainType } from './TerrainType'
import { KillingTimers } from './TerrainTypeDeath_KillingTimers'

export const DEATH_TERRAIN_MAX_TOLERANCE = 50

export class TerrainTypeDeath extends TerrainType {
    private killingEffectStr: string = ''
    private timeToKill: number
    private killingTimers: KillingTimers
    private toleranceDist: number

    constructor(
        label: string,
        terrainTypeId: number,
        killingEffectStr: string,
        timeToKill: number,
        toleranceDist: number
    ) {
        super(label, terrainTypeId, null, 'death', 0, 1)

        this.setKillingEffectStr(killingEffectStr)
        this.timeToKill = timeToKill
        this.killingTimers = new KillingTimers()
        this.toleranceDist = toleranceDist
    }

    setKillingEffectStr = (killingEffectStr: string) => {
        this.killingEffectStr = ReplaceBackslahsesInLinks(killingEffectStr)
    }

    getKillingEffectStr = (): string => {
        return this.killingEffectStr
    }

    setTimeToKill = (newTimeToKill: number): boolean => {
        if (newTimeToKill < 0) {
            return false
        }
        this.timeToKill = newTimeToKill
        return true
    }

    getTimeToKill = (): number => {
        return this.timeToKill
    }

    killEscaper = (escaper: Escaper) => {
        // for -desyncProbe: the death comes once the time to kill has passed, unless it is called off
        setDeathCause(escaper.getId(), `death terrain ${this.label}`)

        escaper.enableCheckTerrain(false)
        escaper.enableSlide(false)
        escaper.pause(true)
        escaper.createTerrainKillEffect(this.killingEffectStr)
        this.killingTimers.start(escaper.getId(), this.timeToKill)
    }

    abortKillEscaper = (escaper: Escaper) => {
        clearDeathCause(escaper.getId())

        escaper.destroyTerrainKillEffect()
        this.killingTimers.destroyTimer(escaper.getId())
    }

    getTimer = (escaperId: number): timer => {
        return this.killingTimers.get(escaperId)
    }

    getToleranceDist = (): number => {
        return this.toleranceDist
    }

    setToleranceDist = (toleranceDist: number): boolean => {
        if (toleranceDist < 0 || toleranceDist > DEATH_TERRAIN_MAX_TOLERANCE) {
            return false
        }
        this.toleranceDist = toleranceDist
        return true
    }

    getColor = () => {
        return COLOR_TERRAIN_DEATH
    }

    toText = (): string => {
        let display = this.baseTextForDisplay()

        display +=
            R2S(this.getTimeToKill()) +
            DISPLAY_SPACE +
            this.getKillingEffectStr() +
            DISPLAY_SPACE +
            I2S(R2I(this.getToleranceDist()))

        //display cliff class
        display += DISPLAY_SPACE + 'cliff' + I2S(this.cliffClassId)
        return display
    }

    displayForPlayer = (p: player) => {
        Text.P_timed(p, Constants.TERRAIN_DATA_DISPLAY_TIME, this.toText())
    }

    toJson() {
        const output = super.toJson()

        output['killingEffet'] = this.getKillingEffectStr()
        output['timeToKill'] = this.getTimeToKill()
        output['toleranceDist'] = this.getToleranceDist()

        return output
    }

    destroy = () => {
        this.killingTimers.destroy()
    }
}
