import { ApplyRotation, convertTextToAngle, ForceAngleBetween0And360 } from 'core/01_libraries/Basic_functions'
import { Constants } from 'core/01_libraries/Constants'
import { Text } from 'core/01_libraries/Text'
import { getUdgMonsterTypes } from '../../../../globals'
import { ServiceManager } from '../../../Services'
import { MemoryHandler } from '../../../Utils/MemoryHandler'
import { createPoint } from '../../../Utils/Point'
import { handlePaginationArgs, handlePaginationObj } from '../../06_COMMANDS/Helpers/Pagination'
import { BaseArray } from '../BaseArray'
import type { Level } from '../Level/Level'
import { CircleRegion } from '../Region/CircleRegion'
import { HorizontalRegionDirection } from '../Region/HorizontalRectangleRegion'
import { LineRegion } from '../Region/LineRegion'
import { MECRegion } from '../Region/MECRegion'
import { MonsterSpawn } from './MonsterSpawn'

export class MonsterSpawnArray extends BaseArray<MonsterSpawn> {
    private level: Level

    constructor(level: Level) {
        super(false)
        this.level = level
    }

    getByLabel = (label: string) => {
        for (const [_, ms] of pairs(this.data)) {
            if (ms.getLabel() === label) {
                return ms
            }
        }

        return null
    }

    new(monsterSpawn: MonsterSpawn, activate: boolean) {
        this._new(monsterSpawn)
        activate && monsterSpawn.activate()
        monsterSpawn.level = this.level

        this.level.updateDebugRegions()
    }

    newFromJson = (monsterSpawnsJson: { [x: string]: any }[]) => {
        for (let ms of monsterSpawnsJson) {
            const mt = getUdgMonsterTypes().getByLabel(ms.monsterTypeLabel)
            if (!mt) {
                Text.erA('Monster type "' + ms.monsterTypeLabel + '" unknown')
            } else {
                const oldMecRegionFormat = ms.mecRegion === undefined
                let mecRegion: MECRegion
                if (oldMecRegionFormat) {
                    mecRegion = this.generateMecRegionFromOldJsonFormat(ms)
                } else {
                    mecRegion = this.getMECRegionFromJson(ms.mecRegion)
                }

                mecRegion.setWithEnterAndLeaveZone(true)

                const monsterSpawn = new MonsterSpawn(
                    ms.label,
                    mt,
                    mecRegion,
                    ms.frequency ?? ms.frequence,
                    ms.monsterDirectionMode ?? 'straight'
                )

                monsterSpawn.setSpawnAmount(ms.spawnAmount || 1)
                monsterSpawn.setInitialDelay(ms.initialDelay || 0)

                if (ms.timedUnspawn !== undefined) {
                    let timedUnspawn = S2R(ms.timedUnspawn)
                    if (oldMecRegionFormat) {
                        timedUnspawn -= 0.5 // handle old DELAY_BETWEEN_SPAWN_AND_MOVEMENT
                    }
                    monsterSpawn.setTimedUnspawn(timedUnspawn)
                }

                monsterSpawn.setFixedSpawnOffset(ms.fixedSpawnOffset)
                monsterSpawn.setSpawnOffset(ms.spawnOffset || 0)
                monsterSpawn.setFixedSpawnOffsetBounce(ms.fixedSpawnOffsetBounce)
                monsterSpawn.setFixedSpawnOffsetMirrored(ms.fixedSpawnOffsetMirrored)

                // Hide regions
                if (ms.hideRegions) {
                    for (const [_, hideRegionJson] of pairs(ms.hideRegions)) {
                        monsterSpawn.addHideRegion(this.getMECRegionFromJson(hideRegionJson))
                    }
                }

                this.new(monsterSpawn, false)
            }
        }
    }

    getMECRegionFromJson(mecRegionJson: any): MECRegion {
        const mecRegionService = ServiceManager.getService('MECRegionService')

        let mecRegion: MECRegion

        switch (mecRegionJson.type) {
            case 'CircleRegion': {
                const { centerY, radius, centerX } = mecRegionJson
                mecRegion = new CircleRegion(centerX, centerY, radius)
                break
            }
            case 'LineRegion': {
                const { originalX1, originalY1, originalX2, originalY2 } = mecRegionJson
                mecRegion = new LineRegion(originalX1, originalY1, originalX2, originalY2)
                break
            }
            case 'HorizontalRectangleRegion':
            case 'HorizontalRegion' /* old name */: {
                const { x1, y1, x2, y2, direction } = mecRegionJson
                mecRegion = mecRegionService.newHorizontalRectangleRegionBackupToLine(x1, y1, x2, y2, direction)
                break
            }
            case 'RectangleRegion': {
                const { x1, y1, x2, y2, x3, y3 } = mecRegionJson
                mecRegion = mecRegionService.newRectangleRegionBackupToLine(x1, y1, x2, y2, x3, y3)
                break
            }
            case 'ParallelogramRegion': {
                const { x1, y1, x2, y2, x3, y3 } = mecRegionJson
                mecRegion = mecRegionService.newParallelogramRegionBackupToLine(x1, y1, x2, y2, x3, y3)
                break
            }
            case 'TrapezeRegion': {
                const { x1, y1, x2, y2, x3, y3, distanceP3P4 } = mecRegionJson
                mecRegion = mecRegionService.newTrapezeRegionBackupToLine(x1, y1, x2, y2, x3, y3, distanceP3P4)
                break
            }
            default: {
                throw new Error('MonsterSpawnArray: newFromJson: unknown MECRegion type "' + mecRegionJson.type + '"')
            }
        }

        return mecRegion
    }

    /**
     * This method is used to generate a MECRegion from the old json format, which doesn't have a mecRegion property, but instead has the coordinates and direction angle directly on the monster spawn object. This method is used for retrocompatibility with old maps.
     * @param ms The monster spawn data in the old json format
     */
    generateMecRegionFromOldJsonFormat(ms: any): MECRegion {
        const mecRegionService = ServiceManager.getService('MECRegionService')

        let mecRegion: MECRegion | null = null

        try {
            const directionAngle = ForceAngleBetween0And360(
                typeof ms.sens === 'string' ? convertTextToAngle(ms.sens) : ms.sens
            )

            let direction: HorizontalRegionDirection | null = null
            switch (directionAngle) {
                case 0:
                    direction = 'right'
                    break
                case 90:
                    direction = 'up'
                    break
                case 180:
                    direction = 'left'
                    break
                case 270:
                    direction = 'down'
                    break
            }

            switch (ms.spawnShape) {
                case 'line': {
                    const x1 = ms.clickX1
                    const y1 = ms.clickY1
                    let x2 = ms.clickX2
                    let y2 = ms.clickY2

                    // With old format, on case of line spanw, the unspanwn is determined only by a timer, there is no rect, so we arbitraryly generate a square region
                    const p1p2_dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)

                    if (direction) {
                        // HorizontalRegion
                        x2 += p1p2_dist * CosBJ(directionAngle)
                        y2 += p1p2_dist * SinBJ(directionAngle)

                        mecRegion = mecRegionService.newHorizontalRectangleRegionBackupToLine(x1, y1, x2, y2, direction)
                    } else {
                        // RectangleRegion
                        const x3 = x2 + p1p2_dist * CosBJ(directionAngle)
                        const y3 = y2 + p1p2_dist * SinBJ(directionAngle)

                        mecRegion = mecRegionService.newRectangleRegionBackupToLine(x1, y1, x2, y2, x3, y3)
                    }

                    break
                }
                case 'point': {
                    // LineRegion

                    // With old format, on case of point spawn, the unspanwn is determined only by a timer, there is no rect, so we arbitraryly choose the region length
                    const regionLength = 800

                    const x1 = ms.clickX1
                    const y1 = ms.clickY1
                    let x2 = x1 + regionLength * CosBJ(directionAngle)
                    let y2 = y1 + regionLength * SinBJ(directionAngle)

                    mecRegion = new LineRegion(x1, y1, x2, y2)

                    break
                }
                case 'region':
                default: {
                    // spwawnShape was not defined with old MEC versions
                    // HorizontalRegion or RectangleRegion depending on the direction angle
                    if (direction) {
                        mecRegion = mecRegionService.newHorizontalRectangleRegionBackupToLine(
                            ms.minX,
                            ms.minY,
                            ms.maxX,
                            ms.maxY,
                            direction
                        )
                    } else {
                        const anchorX = (ms.minX + ms.maxX) / 2
                        const anchorY = (ms.minY + ms.maxY) / 2

                        const p1 = ApplyRotation(anchorX, anchorY, directionAngle, createPoint(ms.minX, ms.minY))
                        const p2 = ApplyRotation(anchorX, anchorY, directionAngle, createPoint(ms.minX, ms.maxY))
                        const p3 = ApplyRotation(anchorX, anchorY, directionAngle, createPoint(ms.maxX, ms.minY))

                        mecRegion = mecRegionService.newRectangleRegionBackupToLine(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y)

                        MemoryHandler.destroyObject(p1)
                        MemoryHandler.destroyObject(p2)
                        MemoryHandler.destroyObject(p3)
                    }
                    break
                }
            }
        } catch (e: any) {
            Text.erA('SPAWN REGION OLD JSON FORMAT ERROR: ' + e?.message)
        }

        if (!mecRegion) {
            throw new Error("MonsterSpawnArray: generateMecRegionFromOldJsonFormat: couldn't generate the MECRegion")
        }

        return mecRegion
    }

    removeMonsterSpawn = (monsterSpawnId: number) => {
        delete this.data[monsterSpawnId]

        this.level.updateDebugRegions()
    }

    clearMonsterSpawn = (label: string): boolean => {
        let ms = this.getByLabel(label)
        if (ms) {
            delete this.data[ms.getId()]
            ms.destroy()
            return true
        } else {
            return false
        }
    }

    activate = () => {
        for (const [_, ms] of pairs(this.data)) {
            ms.activate()
        }
    }

    deactivate = () => {
        for (const [_, ms] of pairs(this.data)) {
            ms.deactivate()
        }
    }

    changeLabel = (oldLabel: string, newLabel: string): boolean => {
        const msWithOldLabel = this.getByLabel(oldLabel)
        const msWithNewLabel = this.getByLabel(newLabel)

        if (!msWithOldLabel || msWithNewLabel) {
            return false
        }

        msWithOldLabel.setLabel(newLabel)

        return true
    }

    displayPaginatedForPlayer = (p: player, cmd: string, detailled = false) => {
        const { searchTerms, pageNum } = handlePaginationArgs(cmd)
        const searchTerm = searchTerms.join(' ')

        if (searchTerm.length !== 0) {
            if (this.getByLabel(searchTerm)) {
                this.getByLabel(searchTerm)?.displayForPlayer(p, detailled)
            } else {
                Text.erP(p, `unknown monster spawn`)
            }
        } else {
            const pag = handlePaginationObj(this.getAll(), pageNum, detailled)

            if (pag.cmds.length === 0) {
                Text.erP(p, `no monster spawn for this level`)
            } else {
                Text.P_timed(
                    p,
                    Constants.TERRAIN_DATA_DISPLAY_TIME,
                    `|cff00ff00Monster Spawns (page |cff00ccff${pageNum}|r|cff00ff00/|cff00ccff${pag.totalPages}|r|cff00ff00)|r`
                )
                for (const l of pag.cmds) {
                    Text.P_timed(p, Constants.TERRAIN_DATA_DISPLAY_TIME, l)
                }
            }
        }
    }

    getActiveMonsterUnitNear = (x: number, y: number): unit | null => {
        for (const [_, ms] of pairs(this.data)) {
            const u = ms.getActiveMonsterUnitNear(x, y)
            if (u) {
                return u
            }
        }

        return null
    }
}
