import { MemoryHandler } from 'Utils/MemoryHandler'
import { Constants } from 'core/01_libraries/Constants'
import { Text } from 'core/01_libraries/Text'
import { getUdgEscapers, getUdgLevels } from '../../../../globals'
import { udg_colorCode } from '../../01_libraries/Init_colorCodes'
import { Level } from '../Level/Level'
import { MonsterType } from '../Monster/MonsterType'

export const DEFAULT_CASTER_PROJECTILE_SPEED = 600
export const MIN_CASTER_PROJECTILE_SPEED = 100
export const DEFAULT_CASTER_RANGE = 1000
export const MIN_CASTER_LOAD_TIME = 0.2
export const DEFAULT_CASTER_LOAD_TIME = 1.0
export const DEFAULT_CASTER_ANIMATION = 'spell'

export class CasterType {
    label: string
    theAlias?: string
    private casterMonsterType: MonsterType
    private projectileMonsterType: MonsterType
    private range: number
    private projectileSpeed: number
    private loadTime: number
    private animation: string

    constructor(
        label: string,
        casterMonsterType: MonsterType,
        projectileMonsterType: MonsterType,
        range: number,
        projectileSpeed: number,
        loadTime: number,
        animation: string
    ) {
        if (range <= 0 || projectileSpeed <= 0) {
            throw 'CasterType: range and projectileSpeed must be positive'
        }

        this.label = label
        this.casterMonsterType = casterMonsterType
        this.projectileMonsterType = projectileMonsterType
        this.range = range
        this.projectileSpeed = projectileSpeed
        this.loadTime = loadTime
        this.animation = animation
    }

    setLabel = (label: string) => {
        this.label = label
    }

    setAlias(theAlias: string) {
        this.theAlias = theAlias
        return this
    }

    refresh = () => {
        let levelsMaking: Level[] = []
        let levelAlreadyChecked: boolean
        let nbLevelsMaking = 0
        const currentLevel = getUdgLevels().getCurrentLevel()
        currentLevel.refreshCastersOfType(this)

        for (let i = 0; i < Constants.NB_ESCAPERS; i++) {
            const escaper = getUdgEscapers().get(i)
            if (escaper) {
                if (escaper.getMakingLevel() != currentLevel) {
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
        }

        for (let i = 0; i < nbLevelsMaking; i++) {
            levelsMaking[i].refreshCastersOfType(this)
        }
    }

    destroy = () => {
        getUdgLevels().removeCastersOfType(this)
    }

    getCasterMonsterType = (): MonsterType => {
        return this.casterMonsterType
    }

    setCasterMonsterType = (newCasterMonsterType: MonsterType) => {
        this.casterMonsterType = newCasterMonsterType
        this.refresh()
    }

    getProjectileMonsterType = (): MonsterType => {
        return this.projectileMonsterType
    }

    setProjectileMonsterType = (newProjectileMonsterType: MonsterType) => {
        this.projectileMonsterType = newProjectileMonsterType
    }

    getRange = (): number => {
        return this.range
    }

    setRange = (newRange: number): boolean => {
        if (newRange <= 0) {
            return false
        }
        this.range = newRange
        return true
    }

    getProjectileSpeed = (): number => {
        return this.projectileSpeed
    }

    setProjectileSpeed = (newSpeed: number): boolean => {
        if (newSpeed <= 0) {
            return false
        }
        this.projectileSpeed = newSpeed
        return true
    }

    getLoadTime = (): number => {
        return this.loadTime
    }

    setLoadTime = (loadTime: number): boolean => {
        if (loadTime < MIN_CASTER_LOAD_TIME) {
            return false
        }
        this.loadTime = loadTime
        return true
    }

    getAnimation = (): string => {
        return this.animation
    }

    setAnimation = (animation: string) => {
        this.animation = animation
    }

    toText = (): string => {
        let space = '   '
        const aliasDisplay = this.theAlias ? ' ' + this.theAlias : ''
        let display = udg_colorCode[Constants.TEAL] + this.label + aliasDisplay + ' : '
        display =
            display +
            this.casterMonsterType.label +
            space +
            this.projectileMonsterType.label +
            space +
            'range: ' +
            R2S(this.range) +
            space
        display =
            display +
            'projectileSpeed: ' +
            R2S(this.projectileSpeed) +
            space +
            'loadTime: ' +
            R2S(this.loadTime) +
            space +
            this.animation
        return display
    }

    displayForPlayer = (p: player) => {
        Text.P_timed(p, Constants.TERRAIN_DATA_DISPLAY_TIME, this.toText())
    }

    toJson = () => {
        const output = MemoryHandler.getEmptyObject<any>()

        output['label'] = this.label
        output['alias'] = this.theAlias
        output['casterMonsterTypeLabel'] = this.casterMonsterType.label
        output['projectileMonsterTypeLabel'] = this.projectileMonsterType.label
        output['range'] = this.range
        output['projectileSpeed'] = this.projectileSpeed
        output['loadTime'] = this.loadTime
        output['animation'] = this.animation

        return output
    }
}
