import { MemoryHandler } from 'Utils/MemoryHandler'
import { Constants } from 'core/01_libraries/Constants'
import { Text } from 'core/01_libraries/Text'
import { ChangeTerrainType } from '../../07_TRIGGERS/Modify_terrain_Functions/Modify_terrain_functions'
import { MakeAction } from './MakeAction'

export class MakeTerrainHorizontalSymmetryAction extends MakeAction {
    private minX: number
    private minY: number
    private maxX: number
    private maxY: number

    constructor(x1: number, y1: number, x2: number, y2: number) {
        super()

        this.minX = RMinBJ(x1, x2)
        this.maxX = RMaxBJ(x1, x2)
        this.minY = RMinBJ(y1, y2)
        this.maxY = RMaxBJ(y1, y2)

        //pour éviter les ptits décalages
        this.minX = I2R(Math.round(this.minX / Constants.LARGEUR_CASE)) * Constants.LARGEUR_CASE
        this.minY = I2R(Math.round(this.minY / Constants.LARGEUR_CASE)) * Constants.LARGEUR_CASE
        this.maxX = I2R(Math.round(this.maxX / Constants.LARGEUR_CASE)) * Constants.LARGEUR_CASE
        this.maxY = I2R(Math.round(this.maxY / Constants.LARGEUR_CASE)) * Constants.LARGEUR_CASE

        this.applySymmetry()
        this.isActionMadeB = true
    }

    applySymmetry = () => {
        const terrainTypeIds = MemoryHandler.getEmptyArray<number>()

        //sauvegarde du terrain
        let i = 0
        let x = this.minX
        let y = this.minY

        while (y <= this.maxY) {
            while (x <= this.maxX) {
                terrainTypeIds[i] = GetTerrainType(x, y)
                i = i + 1
                x = x + Constants.LARGEUR_CASE
            }
            x = this.minX
            y = y + Constants.LARGEUR_CASE
        }

        //application de la symétrie
        i = 0
        x = this.maxX
        y = this.minY

        while (y <= this.maxY) {
            while (x >= this.minX) {
                ChangeTerrainType(x, y, terrainTypeIds[i])
                i = i + 1
                x = x - Constants.LARGEUR_CASE
            }
            x = this.maxX
            y = y + Constants.LARGEUR_CASE
        }

        MemoryHandler.destroyArray(terrainTypeIds)
    }

    cancel = (): boolean => {
        if (!this.isActionMadeB) {
            return false
        }

        this.applySymmetry()
        this.isActionMadeB = false
        this.owner && Text.mkP(this.owner.getPlayer(), 'terrain vertical symmetry cancelled')

        return true
    }

    redo = (): boolean => {
        if (this.isActionMadeB) {
            return false
        }
        this.applySymmetry()
        this.isActionMadeB = true
        this.owner && Text.mkP(this.owner.getPlayer(), 'terrain vertical symmetry redone')

        return true
    }

    destroy = () => {
        //nothing needed
    }
}
