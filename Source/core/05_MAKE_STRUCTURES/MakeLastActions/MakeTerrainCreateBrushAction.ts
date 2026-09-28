import { MemoryHandler } from 'Utils/MemoryHandler'
import { Text } from '../../01_libraries/Text'
import { ChangeTerrainType } from '../../07_TRIGGERS/Modify_terrain_Functions/Modify_terrain_functions'
import { ChangingTile } from '../Make_terrain/MakeTerrainCreateBrush'
import { MakeAction } from './MakeAction'

export class MakeTerrainCreateBrushAction extends MakeAction {
    private changingTiles: ChangingTile[]

    constructor(changingTiles: ChangingTile[]) {
        super()

        this.changingTiles = MemoryHandler.cloneArray(changingTiles)
    }

    destroy = () => {
        MemoryHandler.destroyArray(this.changingTiles)
    }

    terrainModificationCancel = () => {
        for (let changingTile of this.changingTiles) {
            ChangeTerrainType(changingTile.x, changingTile.y, changingTile.terrainTypeBefore.getTerrainTypeId())
        }
    }

    terrainModificationRedo = () => {
        for (let changingTile of this.changingTiles) {
            ChangeTerrainType(changingTile.x, changingTile.y, changingTile.terrainTypeAfter.getTerrainTypeId())
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
