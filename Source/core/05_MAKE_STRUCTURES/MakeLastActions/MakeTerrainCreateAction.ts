import { Constants } from 'core/01_libraries/Constants'
import { getUdgTerrainTypes } from '../../../../globals'
import { Text } from '../../01_libraries/Text'
import { TerrainType } from '../../04_STRUCTURES/TerrainType/TerrainType'
import {
    ChangeTerrainBetween,
    ChangeTerrainType,
} from '../../07_TRIGGERS/Modify_terrain_Functions/Modify_terrain_functions'
import { MakeAction } from './MakeAction'

export class MakeTerrainCreateAction extends MakeAction {
    private terrainTypesBefore: TerrainType[][]
    private terrainTypeNew: TerrainType

    private minX: number
    private minY: number
    private maxX: number
    private maxY: number

    constructor(terrainTypeNew: TerrainType, x1: number, y1: number, x2: number, y2: number) {
        super()

        this.minX = RMinBJ(x1, x2)
        this.maxX = RMaxBJ(x1, x2)
        this.minY = RMinBJ(y1, y2)
        this.maxY = RMaxBJ(y1, y2)

        if (!terrainTypeNew || terrainTypeNew.getTerrainTypeId() == 0) {
            throw "this terrain type doesn't exist anymore"
        }

        this.terrainTypesBefore = []

        let x = this.minX
        let y = this.minY

        while (y <= this.maxY) {
            while (x <= this.maxX) {
                const tt = getUdgTerrainTypes().getTerrainType(x, y)
                if (tt) {
                    !this.terrainTypesBefore[x] && (this.terrainTypesBefore[x] = [])
                    this.terrainTypesBefore[x][y] = tt
                }
                x = x + Constants.LARGEUR_CASE
            }
            x = this.minX
            y = y + Constants.LARGEUR_CASE
        }

        ChangeTerrainBetween(terrainTypeNew.getTerrainTypeId(), this.minX, this.minY, this.maxX, this.maxY)

        this.terrainTypeNew = terrainTypeNew
        this.isActionMadeB = true
    }

    destroy = () => {
        //nothing needed
    }

    terrainModificationCancel = () => {
        let x = this.minX
        let y = this.minY

        while (y <= this.maxY) {
            while (x <= this.maxX) {
                const terrainType = this.terrainTypesBefore[x][y]
                if (terrainType && terrainType.getTerrainTypeId() != 0) {
                    ChangeTerrainType(x, y, terrainType.getTerrainTypeId())
                }
                x = x + Constants.LARGEUR_CASE
            }
            x = this.minX
            y = y + Constants.LARGEUR_CASE
        }
    }

    terrainModificationRedo = () => {
        const terrainTypeId = this.terrainTypeNew.getTerrainTypeId()
        if (terrainTypeId === 0) {
            this.owner && Text.erP(this.owner.getPlayer(), "the terrain type for this action doesn't exist anymore")
        } else {
            ChangeTerrainBetween(terrainTypeId, this.minX, this.minY, this.maxX, this.maxY)
        }
    }

    cancel = (): boolean => {
        if (!this.isActionMadeB) {
            return false
        }

        this.terrainModificationCancel()
        this.isActionMadeB = false
        this.owner && Text.mkP(this.owner.getPlayer(), 'terrain creation cancelled')

        return true
    }

    redo = (): boolean => {
        if (this.isActionMadeB) {
            return false
        }

        this.terrainModificationRedo()
        this.isActionMadeB = true
        this.owner && Text.mkP(this.owner.getPlayer(), 'terrain creation redone')

        return true
    }
}
