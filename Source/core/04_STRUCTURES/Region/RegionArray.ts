import { MemoryHandler } from 'Utils/MemoryHandler'
import { arrayPush } from 'core/01_libraries/Basic_functions'
import { Constants } from 'core/01_libraries/Constants'
import { Text } from 'core/01_libraries/Text'
import { handlePaginationArgs, handlePaginationObj } from '../../06_COMMANDS/Helpers/Pagination'
import { BaseArray } from '../BaseArray'
import type { Level } from '../Level/Level'
import { Region } from './Region'

export class RegionArray extends BaseArray<Region> {
    private level: Level

    constructor(level: Level) {
        super(false)
        this.level = level
    }

    getByLabel = (label: string) => {
        for (const [_, r] of pairs(this.data)) {
            if (r.getLabel() === label) {
                return r
            }
        }

        return null
    }

    new(region: Region) {
        this._new(region)
        region.level = this.level

        this.level.updateDebugRegions()
    }

    newFromJson = (regionsJson: { [x: string]: any }[]) => {
        for (const r of regionsJson) {
            const region = new Region(r.label, r.minX, r.minY, r.maxX, r.maxY)
            r.flags && region.setFlags(r.flags)
            this.new(region)
        }
    }

    removeRegion = (regionId: number) => {
        delete this.data[regionId]

        this.level.updateDebugRegions()
    }

    clearRegion = (label: string): boolean => {
        const r = this.getByLabel(label)
        if (r) {
            delete this.data[r.getId()]
            r.destroy()
            return true
        } else {
            return false
        }
    }

    getRegionAt = (x: number, y: number) => {
        for (const [_, r] of pairs(this.data)) {
            if (r.getMinX() <= x && r.getMaxX() >= x && r.getMinY() <= y && r.getMaxY() >= y) {
                return r
            }
        }

        return null
    }

    getRegionsAt = (x: number, y: number) => {
        const regions = MemoryHandler.getEmptyArray<Region>()

        for (const [_, r] of pairs(this.data)) {
            if (r.getMinX() <= x && r.getMaxX() >= x && r.getMinY() <= y && r.getMaxY() >= y) {
                arrayPush(regions, r)
            }
        }

        return regions
    }

    getRegionAtWithFlag = (x: number, y: number, flag: string) => {
        for (const [_, r] of pairs(this.data)) {
            if (r.getMinX() <= x && r.getMaxX() >= x && r.getMinY() <= y && r.getMaxY() >= y) {
                if (r.hasFlag(flag)) {
                    return r
                }
            }
        }

        return null
    }

    activate = (activ: boolean) => {
        for (const [_, region] of pairs(this.data)) {
            region.activate(activ)
        }
    }

    changeLabel = (oldLabel: string, newLabel: string): boolean => {
        const rWithOldLabel = this.getByLabel(oldLabel)
        const rWithNewLabel = this.getByLabel(newLabel)

        if (!rWithOldLabel || rWithNewLabel) {
            return false
        }

        rWithOldLabel.setLabel(newLabel)

        return true
    }

    displayPaginatedForPlayer = (p: player, cmd: string) => {
        const { searchTerms, pageNum } = handlePaginationArgs(cmd)
        const searchTerm = searchTerms.join(' ')

        if (searchTerm.length !== 0) {
            if (this.getByLabel(searchTerm)) {
                this.getByLabel(searchTerm)?.displayForPlayer(p)
            } else {
                Text.erP(p, `unknown region`)
            }
        } else {
            const pag = handlePaginationObj(this.getAll(), pageNum)

            if (pag.cmds.length === 0) {
                Text.erP(p, `no region for this level`)
            } else {
                Text.P_timed(
                    p,
                    Constants.TERRAIN_DATA_DISPLAY_TIME,
                    `|cff00ff00Regions (page |cff00ccff${pageNum}|r|cff00ff00/|cff00ccff${pag.totalPages}|r|cff00ff00)|r`
                )
                for (const l of pag.cmds) {
                    Text.P_timed(p, Constants.TERRAIN_DATA_DISPLAY_TIME, l)
                }
            }
        }
    }
}
