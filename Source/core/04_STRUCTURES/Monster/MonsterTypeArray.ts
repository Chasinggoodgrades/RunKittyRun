import { Constants } from 'core/01_libraries/Constants'
import { Text } from 'core/01_libraries/Text'
import { handlePaginationArgs, handlePaginationObj } from '../../06_COMMANDS/Helpers/Pagination'
import { BaseArray } from '../BaseArray'
import { MonsterType } from './MonsterType'

export class MonsterTypeArray extends BaseArray<MonsterType> {
    constructor() {
        super(true)
    }

    getByLabel = (label: string) => {
        for (const [_, monsterType] of pairs(this.data)) {
            if (monsterType.label == label || monsterType.theAlias == label) {
                return monsterType
            }
        }

        return null
    }

    isLabelAlreadyUsed = (label: string): boolean => {
        return this.getByLabel(label) !== null
    }

    new(
        label: string,
        unitTypeId: number,
        scale: number,
        immolationRadius: number,
        speed: number,
        isClickable: boolean
    ) {
        if (this.isLabelAlreadyUsed(label)) {
            throw `MonsterType label already used: "${label}"`
        }

        const monsterType = new MonsterType(label, unitTypeId, scale, immolationRadius, speed, isClickable)
        this._new(monsterType)

        return monsterType
    }

    newFromJson = (monsterTypesJson: { [x: string]: any }[]) => {
        for (let mt of monsterTypesJson) {
            const unitTypeId = FourCC(mt.unitTypeId)
            const monsterType = this.new(mt.label, unitTypeId, mt.scale, mt.immolationRadius, mt.speed, mt.isClickable)
            monsterType.setHeight(mt.height)
            monsterType.setNbMeteorsToKill(mt.nbMeteorsToKill)
            if (mt.alias) {
                monsterType.setAlias(mt.alias)
            }
            if (mt.killingEffect) {
                monsterType.setKillingEffectStr(mt.killingEffect)
            }
            if (mt.isWanderable) {
                monsterType.setIsWanderable(mt.isWanderable)
            }
            if (mt.createTerrainLabel) {
                monsterType.setCreateTerrainLabel(mt.createTerrainLabel)
            }
            if (mt.killRectDimensions) {
                monsterType.setKillRectDimensions(mt.killRectDimensions.width, mt.killRectDimensions.height)
            }
            if (mt.lifeBonusEnabled) {
                monsterType.setLifeBonus(mt.lifeBonusEnabled, mt.lifeBonusNbLivesEarned, mt.lifeBonusMinimumSurviveTime)
            }
        }
    }

    remove = (label: string): boolean => {
        for (const [i, _monsterType] of pairs(this.data)) {
            if (this.data[i].label == label || this.data[i].theAlias == label) {
                this.data[i].destroy()
                delete this.data[i]
                return true
            }
        }

        return false
    }

    displayPaginatedForPlayer = (p: player, cmd: string) => {
        const { searchTerms, pageNum } = handlePaginationArgs(cmd)
        const searchTerm = searchTerms.join(' ')

        if (searchTerm.length !== 0) {
            if (this.isLabelAlreadyUsed(searchTerm)) {
                this.getByLabel(searchTerm)?.displayForPlayer(p)
            } else {
                Text.erP(p, `unknown monster type`)
            }
        } else {
            const pag = handlePaginationObj(this.getAll(), pageNum)

            if (pag.cmds.length === 0) {
                Text.erP(p, `no monster type saved`)
            } else {
                Text.P_timed(
                    p,
                    Constants.TERRAIN_DATA_DISPLAY_TIME,
                    `|cff00ff00Monster Types (page |cff00ccff${pageNum}|r|cff00ff00/|cff00ccff${pag.totalPages}|r|cff00ff00)|r`
                )
                for (const l of pag.cmds) {
                    Text.P_timed(p, Constants.TERRAIN_DATA_DISPLAY_TIME, l)
                }
            }
        }
    }
}
