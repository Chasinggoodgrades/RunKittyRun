import { Constants } from 'core/01_libraries/Constants'
import { Text } from 'core/01_libraries/Text'
import { getUdgMonsterTypes } from '../../../../globals'
import { handlePaginationArgs, handlePaginationObj } from '../../06_COMMANDS/Helpers/Pagination'
import { BaseArray } from '../BaseArray'
import { MonsterType } from '../Monster/MonsterType'
import { CasterType } from './CasterType'

export class CasterTypeArray extends BaseArray<CasterType> {
    constructor() {
        super(true)
    }

    getByLabel = (label: string) => {
        for (const [_, casterType] of pairs(this.data)) {
            if (casterType.label === label || casterType.theAlias === label) {
                return casterType
            }
        }

        return null
    }

    isLabelAlreadyUsed = (label: string): boolean => {
        return this.getByLabel(label) !== null
    }

    new = (
        label: string,
        casterMonsterType: MonsterType,
        projectileMonsterType: MonsterType,
        range: number,
        projectileSpeed: number,
        loadTime: number,
        animation: string
    ) => {
        if (this.isLabelAlreadyUsed(label)) {
            return null
        }

        const casterType = new CasterType(
            label,
            casterMonsterType,
            projectileMonsterType,
            range,
            projectileSpeed,
            loadTime,
            animation
        )

        this._new(casterType)

        return casterType
    }

    newFromJson = (casterTypesJson: { [x: string]: any }[]) => {
        for (let ct of casterTypesJson) {
            const casterMT = getUdgMonsterTypes().getByLabel(ct.casterMonsterTypeLabel)
            const projectileMT = getUdgMonsterTypes().getByLabel(ct.projectileMonsterTypeLabel)

            if (!casterMT || !projectileMT) {
                Text.erA('Unknown monster type for caster type "' + ct.label + '"')
            } else {
                const casterType = this.new(
                    ct.label,
                    casterMT,
                    projectileMT,
                    ct.range,
                    ct.projectileSpeed,
                    ct.loadTime,
                    ct.animation
                )
                if (ct.alias) {
                    casterType?.setAlias(ct.alias)
                }
            }
        }
    }

    remove = (label: string): boolean => {
        for (const [casterTypeId, casterType] of pairs(this.data)) {
            if (casterType.label === label || casterType.theAlias === label) {
                this.data[casterTypeId].destroy()
                delete this.data[casterTypeId]
            }
        }

        return true
    }

    displayPaginatedForPlayer = (p: player, cmd: string) => {
        const { searchTerms, pageNum } = handlePaginationArgs(cmd)
        const searchTerm = searchTerms.join(' ')

        if (searchTerm.length !== 0) {
            if (this.isLabelAlreadyUsed(searchTerm)) {
                this.getByLabel(searchTerm)?.displayForPlayer(p)
            } else {
                Text.erP(p, `unknown caster type`)
            }
        } else {
            const pag = handlePaginationObj(this.getAll(), pageNum)

            if (pag.cmds.length === 0) {
                Text.erP(p, `no caster type saved`)
            } else {
                Text.P_timed(
                    p,
                    Constants.TERRAIN_DATA_DISPLAY_TIME,
                    `|cff00ff00Caster Types (page |cff00ccff${pageNum}|r|cff00ff00/|cff00ccff${pag.totalPages}|r|cff00ff00)|r`
                )
                for (const l of pag.cmds) {
                    Text.P_timed(p, Constants.TERRAIN_DATA_DISPLAY_TIME, l)
                }
            }
        }
    }
}
