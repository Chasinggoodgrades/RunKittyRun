import { ServiceManager } from 'Services'
import { MemoryHandler } from 'Utils/MemoryHandler'
import { MazeUtils } from 'Utils/vToto'
import { Ascii2String } from 'core/01_libraries/Ascii'
import { arrayPush, tileset2tilesetChar } from 'core/01_libraries/Basic_functions'
import { Constants } from 'core/01_libraries/Constants'
import { Text } from 'core/01_libraries/Text'
import { globals } from '../../../../globals'
import { CmdParam, NbParam } from '../../06_COMMANDS/Helpers/Command_functions'
import { handlePaginationArgs, handlePaginationObj } from '../../06_COMMANDS/Helpers/Pagination'
import { TerrainTypeMax } from '../../07_TRIGGERS/Modify_terrain_Functions/Terrain_type_max'
import { BaseArray } from '../BaseArray'
import { TerrainType, isDeathTerrain } from './TerrainType'
import { TerrainTypeDeath } from './TerrainTypeDeath'
import { TerrainTypeSlide } from './TerrainTypeSlide'
import { TerrainTypeWalk } from './TerrainTypeWalk'

//le nombre de terrains du jeu est de 177
export class TerrainTypeArray extends BaseArray<TerrainType> {
    constructor() {
        super(true)
    }

    mainTileset: string = 'auto'

    getByLabel = (label: string) => {
        for (const [_, terrainType] of pairs(this.data)) {
            if (terrainType.label === label || terrainType.theAlias === label) {
                return terrainType
            }
        }

        return null
    }

    getByCode = (code: string) => {
        for (const [_, terrainType] of pairs(this.data)) {
            if (Ascii2String(terrainType.terrainTypeId) === code) {
                return terrainType
            }
        }

        return null
    }

    getTerrainType = (x: number, y: number) => {
        let terrainTypeId = globals.USE_VTOTO_SLIDE_LOGIC ? MazeUtils.getHVTileAt(x, y) : GetTerrainType(x, y)

        if (globals.USE_VTOTO_SLIDE_LOGIC && !terrainTypeId) {
            const upward = MazeUtils.getDiagonalTileAt(x, y, true)
            const downward = MazeUtils.getDiagonalTileAt(x, y, false)

            const d = downward ? this.get(downward) : null
            const u = upward ? this.get(upward) : null

            if (upward === downward) {
                terrainTypeId = upward
            } else if (upward === null) {
                terrainTypeId = downward
            } else if (downward === null) {
                terrainTypeId = upward
            } else if (d && isDeathTerrain(d)) {
                terrainTypeId = upward
            } else if (u && isDeathTerrain(u)) {
                terrainTypeId = downward
            }
        }

        if (!terrainTypeId) {
            terrainTypeId = GetTerrainType(x, y)
        }

        for (const [_, terrainType] of pairs(this.data)) {
            if (terrainType.getTerrainTypeId() === terrainTypeId) {
                return terrainType
            }
        }

        return null
    }

    getByTerrainTypeId = (terrainTypeId: number): TerrainType | null => {
        for (const [_, terrainType] of pairs(this.data)) {
            if (terrainType.getTerrainTypeId() === terrainTypeId) {
                return terrainType
            }
        }

        return null
    }

    isTerrainTypeIdAlreadyUsed = (terrainTypeId: number) => {
        for (const [_, terrainType] of pairs(this.data)) {
            if (terrainType.getTerrainTypeId() === terrainTypeId) {
                return true
            }
        }

        return false
    }

    isLabelAlreadyUsed = (label: string) => {
        return this.getByLabel(label) !== null
    }

    newWalk = (label: string, terrainTypeId: number, walkspeed: number) => {
        if (this.isLabelAlreadyUsed(label)) throw `TerrainType label already used: "${label}"`
        if (this.isTerrainTypeIdAlreadyUsed(terrainTypeId)) throw 'Terrain type already used'
        if (terrainTypeId === 0) throw 'Wrong terrain type'

        const tt = new TerrainTypeWalk(label, terrainTypeId, walkspeed)
        this._new(tt)
        ServiceManager.getService('React').forceUpdate()
        return tt
    }

    newDeath = (
        label: string,
        terrainTypeId: number,
        killingEffectStr: string,
        timeToKill: number,
        toleranceDist: number
    ) => {
        if (this.isLabelAlreadyUsed(label)) throw `TerrainType label already used: "${label}"`
        if (this.isTerrainTypeIdAlreadyUsed(terrainTypeId)) throw 'Terrain type already used'
        if (terrainTypeId === 0) throw 'Wrong terrain type'

        const tt = new TerrainTypeDeath(label, terrainTypeId, killingEffectStr, timeToKill, toleranceDist)
        this._new(tt)
        ServiceManager.getService('React').forceUpdate()
        return tt
    }

    newSlide = (
        label: string,
        terrainTypeId: number,
        slideSpeed: number,
        canTurn: boolean,
        rotationSpeed: number | null = null
    ) => {
        if (this.isLabelAlreadyUsed(label)) throw `TerrainType label already used: "${label}"`
        if (this.isTerrainTypeIdAlreadyUsed(terrainTypeId)) throw 'Terrain type already used'
        if (terrainTypeId === 0) throw 'Wrong terrain type'

        const tt = new TerrainTypeSlide(label, terrainTypeId, slideSpeed, canTurn, rotationSpeed)
        this._new(tt)
        ServiceManager.getService('React').forceUpdate()
        return tt
    }

    remove = (label: string): boolean => {
        for (const [terrainTypeId, terrainType] of pairs(this.data)) {
            if (terrainType.label === label || terrainType.theAlias === label) {
                this.data[terrainTypeId].destroy()
                delete this.data[terrainTypeId]
                ServiceManager.getService('React').forceUpdate()
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
                Text.erP(p, `unknown terrain`)
            }
        } else {
            const pag = handlePaginationObj(this.getAll(), pageNum)

            if (pag.cmds.length === 0) {
                Text.erP(p, `no terrain type saved`)
            } else {
                Text.P_timed(
                    p,
                    Constants.TERRAIN_DATA_DISPLAY_TIME,
                    `|cff00ff00Terrain Types (page |cff00ccff${pageNum}|r|cff00ff00/|cff00ccff${pag.totalPages}|r|cff00ff00)|r`
                )
                for (const l of pag.cmds) {
                    Text.P_timed(p, Constants.TERRAIN_DATA_DISPLAY_TIME, l)
                }
            }
        }
    }

    //mettre en place l'ordre des terrains au niveau des tilesets
    setOrder = (cmd: string): boolean => {
        let terrainType: TerrainType | null
        let terrainTypesOrdered: TerrainType[] = []
        let nbTerrainsDone: number
        let i: number
        if (this.count() !== NbParam(cmd)) {
            return false
        }
        nbTerrainsDone = 0
        while (true) {
            if (nbTerrainsDone === this.count()) break
            terrainType = this.getByLabel(CmdParam(cmd, nbTerrainsDone + 1))
            //vérification que le terrain existe
            if (terrainType === null) {
                return false
            }
            //vérification que le terrain n'a pas déjà été cité
            i = 0
            while (true) {
                if (i === nbTerrainsDone) break
                if (terrainTypesOrdered[i] === terrainType) {
                    return false
                }
                i = i + 1
            }
            //mémorisation du terrain
            terrainTypesOrdered[nbTerrainsDone] = terrainType
            nbTerrainsDone = nbTerrainsDone + 1
        }
        //mémorisation du numéro d'ordre de chaque terrain
        i = 0
        while (true) {
            if (i === nbTerrainsDone) break
            terrainTypesOrdered[i].setOrderId(i + 1)
            i = i + 1
        }
        return true
    }

    setMainTileset = (tileset: string): boolean => {
        let tilesetChar = tileset2tilesetChar(tileset)
        if (tilesetChar !== '') {
            this.mainTileset = tilesetChar
            return true
        }
        return false
    }

    getMainTileset = (): string => {
        return this.mainTileset
    }

    toJson = () => {
        const arr = MemoryHandler.getEmptyArray()

        for (const [_, terrainType] of pairs(this.data)) {
            arrayPush(arr, terrainType.toJson())
        }

        return arr
    }

    newFromJson = (terrainTypesJson: { [x: string]: any }[]) => {
        for (let terrainTypeJson of terrainTypesJson) {
            const terrainTypeId = TerrainTypeMax.TerrainTypeAsciiString2TerrainTypeId(terrainTypeJson.terrainTypeId)

            let tt: TerrainType | null = null

            switch (terrainTypeJson.kind) {
                case 'walk':
                    tt = this.newWalk(terrainTypeJson.label, terrainTypeId, terrainTypeJson.walkSpeed)

                    break

                case 'slide':
                    tt = this.newSlide(
                        terrainTypeJson.label,
                        terrainTypeId,
                        terrainTypeJson.slideSpeed,
                        terrainTypeJson.canTurn,
                        terrainTypeJson.rotationSpeed
                    )

                    break

                case 'death':
                    tt = this.newDeath(
                        terrainTypeJson.label,
                        terrainTypeId,
                        terrainTypeJson.killingEffet,
                        terrainTypeJson.timeToKill,
                        terrainTypeJson.toleranceDist
                    )

                    break
            }

            if (tt) {
                tt.orderId = terrainTypeJson.orderId || 0

                if (terrainTypeJson.alias) {
                    tt.setAlias(terrainTypeJson.alias)
                }

                if (terrainTypeJson.gravity) {
                    tt.setGravity(terrainTypeJson.gravity)
                }
            }
        }
    }
}
