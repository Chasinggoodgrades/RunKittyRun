import { MemoryHandler } from 'Utils/MemoryHandler'
import { Constants } from 'core/01_libraries/Constants'
import { Text } from 'core/01_libraries/Text'
import { getUdgEscapers, getUdgLevels } from '../../../../globals'
import { Ascii2String } from '../../01_libraries/Ascii'
import { ReplaceBackslahsesInLinks, Round32 } from '../../01_libraries/Basic_functions'
import { udg_colorCode } from '../../01_libraries/Init_colorCodes'
import { Natives } from '../../wc3_natives_unsecured/Natives'
import { Level } from '../Level/Level'
import { requestContactChunksRebuild } from './ContactChunks'
import { IMMOLATION_SKILLS } from './Immolation_skills'

export class MonsterType {
    label: string
    theAlias?: string
    private unitTypeId: number
    private scale: number //influe sur la taille de l'unité ; 1.0 donne une taille normale
    private immolationRadius = 0
    private immolationSkill: number | null
    private speed: number
    private isClickableB: boolean
    private isWanderableB: boolean
    private killingEffectStr?: string
    private maxLife: number
    private height: number
    private createTerrainLabel?: string
    private killRectDimensions?: { width: number; height: number }

    private lifeBonusEnabled = false
    private lifeBonusNbLivesEarned = 0
    private lifeBonusMinimumSurviveTime = 0

    constructor(
        label: string,
        unitTypeId: number,
        scale: number,
        immolationRadius: number,
        speed: number,
        isClickable: boolean
    ) {
        if (speed <= 0 || speed > Constants.MAX_MOVE_SPEED) {
            throw this.constructor.name + ' : wrong speed value "' + speed + '"'
        }

        if (scale <= 0 && scale !== -1) {
            throw this.constructor.name + ' : wrong scale value "' + scale + '"'
        }

        if (immolationRadius !== 0 && !IMMOLATION_SKILLS[immolationRadius]) {
            throw `${this.constructor.name} - '${label}' - '${unitTypeId}' - wrong immolation radius - '${immolationRadius}'`
        }

        const testMonster = Natives.UCreateUnit(Constants.NEUTRAL_PLAYER, unitTypeId, 0, 0, 0)
        if (!testMonster) {
            throw `Unit type unknown: ${label}`
        } else {
            RemoveUnit(testMonster)
        }

        this.label = label
        this.unitTypeId = unitTypeId
        this.scale = scale
        this.immolationRadius = immolationRadius
        this.immolationSkill = IMMOLATION_SKILLS[immolationRadius]
        this.speed = speed
        this.isClickableB = isClickable
        this.isWanderableB = false
        this.maxLife = 10000
        this.height = -1
    }

    setLabel = (label: string) => {
        this.label = label
    }

    getLabel = () => {
        return this.label
    }

    setAlias = (theAlias: string): MonsterType => {
        this.theAlias = theAlias
        return this
    }

    refresh = () => {
        let levelsMaking: Level[] = []
        let levelAlreadyChecked: boolean
        let nbLevelsMaking = 0
        const currentLevel = getUdgLevels().getCurrentLevel()
        currentLevel.recreateMonstersUnitsOfType(this)

        for (let i = 0; i < Constants.NB_ESCAPERS; i++) {
            let escaper = getUdgEscapers().get(i)
            if (escaper && escaper.getMakingLevel() != currentLevel) {
                levelAlreadyChecked = false

                for (let j = 0; j < nbLevelsMaking; j++) {
                    if (escaper.getMakingLevel() == levelsMaking[j]) {
                        levelAlreadyChecked = true
                        break
                    }
                }

                if (!levelAlreadyChecked) {
                    levelsMaking[nbLevelsMaking] = escaper.getMakingLevel()
                    nbLevelsMaking++
                }
            }
        }

        for (let i = 0; i < nbLevelsMaking; i++) {
            levelsMaking[i].recreateMonstersUnitsOfType(this)
        }
    }

    destroy = () => {
        getUdgLevels().clearMonstersOfType(this)
    }

    getUnitTypeId = (): number => {
        return this.unitTypeId
    }

    setUnitTypeId = (unitTypeId: number): boolean => {
        let testMonster = Natives.UCreateUnit(Constants.NEUTRAL_PLAYER, unitTypeId, 0, 0, 0)
        if (!testMonster) {
            return false
        }

        RemoveUnit(testMonster)

        this.unitTypeId = unitTypeId
        this.refresh()
        return true
    }

    getScale = (): number => {
        return this.scale
    }

    setScale = (scale: number): boolean => {
        if ((scale <= 0 && scale !== -1) || scale === this.scale) {
            return false
        }
        this.scale = scale
        this.refresh()
        return true
    }

    getCreateTerrainLabel = () => {
        return this.createTerrainLabel
    }

    setCreateTerrainLabel = (createTerrainLabel?: string): MonsterType => {
        this.createTerrainLabel = createTerrainLabel
        return this
    }

    getImmolationSkill = () => {
        return this.immolationSkill
    }

    setImmolation = (immolationRadius: number): boolean => {
        if (immolationRadius !== 0 && !IMMOLATION_SKILLS[immolationRadius]) {
            return false
        }
        this.immolationRadius = immolationRadius
        this.immolationSkill = IMMOLATION_SKILLS[immolationRadius]
        this.refresh()
        requestContactChunksRebuild()
        return true
    }

    getUnitMoveSpeed = (): number => {
        return this.speed
    }

    setUnitMoveSpeed = (speed: number): boolean => {
        if (speed <= 0 || speed > Constants.MAX_MOVE_SPEED) {
            return false
        }
        this.speed = speed
        this.refresh()
        return true
    }

    isClickable = (): boolean => {
        return this.isClickableB
    }

    setIsClickable = (isClickable: boolean): boolean => {
        if (this.isClickableB === isClickable) {
            return false
        }
        this.isClickableB = isClickable
        this.refresh()
        return true
    }

    isWanderable = () => this.isWanderableB

    setIsWanderable = (isWanderable: boolean): boolean => {
        if (this.isWanderableB === isWanderable) {
            return false
        }
        this.isWanderableB = isWanderable
        this.refresh()
        return true
    }

    getKillingEffectStr = () => {
        return this.killingEffectStr
    }

    setKillingEffectStr = (effectStr: string): MonsterType => {
        this.killingEffectStr = ReplaceBackslahsesInLinks(effectStr)
        return this
    }

    setNbMeteorsToKill = (nbMeteorsToKill: number): MonsterType => {
        //nombre de météores qu'il faut pour tuer le monstre, sachant qu'une météore fait 10k de dégât
        if (nbMeteorsToKill < 1 || nbMeteorsToKill > 9) {
            return this
        }
        this.maxLife = nbMeteorsToKill * 10000
        if (this.isClickableB) {
            this.refresh()
        }
        return this
    }

    getMaxLife = (): number => {
        return this.maxLife
    }

    getHeight = (): number => {
        return this.height
    }

    setHeight = (height: number): boolean => {
        if (height !== -1 && height < 0 && height !== this.height) {
            return false
        }
        this.height = height
        this.refresh()
        return true
    }

    getImmolationRadiusStr = (): string => {
        if (!this.immolationSkill) {
            return '0'
        }

        let immoStr = Ascii2String(this.immolationSkill)
        immoStr = SubStringBJ(immoStr, 2, 4) ?? ''
        return I2S(S2I(immoStr)) ?? ''
    }

    setKillRectDimensions = (width: number, height: number): boolean => {
        // round 32 for rect usage
        const roundedWidth = Round32(width)
        const roundedHeight = Round32(height)

        if (roundedHeight <= 0 || roundedWidth <= 0) {
            return false
        }

        this.killRectDimensions = { width: roundedWidth, height: roundedHeight }
        this.refresh()

        return true
    }

    removeKillRectDimensions = (): void => {
        this.killRectDimensions = undefined
        this.refresh()
    }

    getKillRectDimensions = (): { width: number; height: number } | undefined => {
        return this.killRectDimensions
    }

    setLifeBonus = (enabling: boolean, nbLivesEarned?: number, minimumSurviveTime?: number): void => {
        this.lifeBonusEnabled = enabling

        if (nbLivesEarned !== undefined) {
            this.lifeBonusNbLivesEarned = nbLivesEarned
        }

        if (minimumSurviveTime !== undefined) {
            this.lifeBonusMinimumSurviveTime = minimumSurviveTime
        }
    }

    getLifeBonus = (): { nbLivesEarned: number; minimumSurviveTime: number } | undefined => {
        if (!this.lifeBonusEnabled) {
            return undefined
        }

        return {
            nbLivesEarned: this.lifeBonusNbLivesEarned,
            minimumSurviveTime: this.lifeBonusMinimumSurviveTime,
        }
    }

    toText = (): string => {
        let space = '   '
        let display = udg_colorCode[Constants.RED] + this.label + (this.theAlias ? ' ' + this.theAlias : '') + " : '"
        let scaleDisplay: string
        let heightDisplay: string
        if (this.scale === -1) {
            scaleDisplay = 'default'
        } else {
            scaleDisplay = R2S(this.scale) ?? ''
        }
        if (this.height === -1) {
            heightDisplay = 'default'
        } else {
            heightDisplay = I2S(R2I(this.height)) ?? ''
        }
        display = display + Ascii2String(this.unitTypeId) + "'"
        display =
            display +
            space +
            'speed_' +
            I2S(R2I(this.speed)) +
            space +
            'immo_' +
            this.getImmolationRadiusStr() +
            space +
            'scale_' +
            scaleDisplay +
            space +
            'height_' +
            heightDisplay
        if (this.killingEffectStr) {
            display = display + space + this.killingEffectStr
        }
        if (this.isClickableB) {
            display = display + space + 'clickable' + space + I2S(this.maxLife / 10000)
        }
        if (this.isWanderableB) {
            display = display + space + 'wanderable'
        }
        if (this.killRectDimensions) {
            display =
                display +
                space +
                'killRect_' +
                I2S(R2I(this.killRectDimensions.width)) +
                'x' +
                I2S(R2I(this.killRectDimensions.height))
        }
        if (this.lifeBonusEnabled) {
            display =
                display +
                space +
                'lifeBonus_enabled_nb' +
                I2S(this.lifeBonusNbLivesEarned) +
                '_minSurv' +
                R2S(this.lifeBonusMinimumSurviveTime) +
                's'
        }
        return display
    }

    displayForPlayer = (p: player) => {
        Text.P_timed(p, Constants.TERRAIN_DATA_DISPLAY_TIME, this.toText())
    }

    getImmolationRadius() {
        return this.immolationRadius
    }

    toJson = () => {
        const output = MemoryHandler.getEmptyObject<any>()

        output['label'] = this.label
        output['alias'] = this.theAlias
        output['unitTypeId'] = Ascii2String(this.unitTypeId)
        output['scale'] = this.scale
        output['immolationRadius'] = S2I(this.getImmolationRadiusStr())
        output['speed'] = R2I(this.speed)
        output['isClickable'] = this.isClickableB
        output['isWanderable'] = this.isWanderableB
        output['killingEffect'] = this.killingEffectStr
        output['nbMeteorsToKill'] = this.maxLife / 10000
        output['height'] = R2I(this.height)
        output['createTerrainLabel'] = this.createTerrainLabel

        if (this.killRectDimensions) {
            output['killRectDimensions'] = {
                width: this.killRectDimensions.width,
                height: this.killRectDimensions.height,
            }
        }

        if (this.lifeBonusEnabled) {
            output['lifeBonusEnabled'] = this.lifeBonusEnabled
            output['lifeBonusNbLivesEarned'] = this.lifeBonusNbLivesEarned
            output['lifeBonusMinimumSurviveTime'] = this.lifeBonusMinimumSurviveTime
        }

        return output
    }
}
