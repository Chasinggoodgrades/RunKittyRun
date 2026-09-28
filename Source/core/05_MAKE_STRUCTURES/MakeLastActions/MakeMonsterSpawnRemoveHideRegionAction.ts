import { Text } from 'core/01_libraries/Text'
import { Level } from '../../04_STRUCTURES/Level/Level'
import { MakeAction } from './MakeAction'
import { MECRegion } from '../../04_STRUCTURES/Region/MECRegion'
import { MonsterSpawn } from '../../04_STRUCTURES/MonsterSpawn/MonsterSpawn'

export class MakeMonsterSpawnRemoveHideRegionAction extends MakeAction {
    private monsterSpawn: MonsterSpawn
    private hideRegion: MECRegion

    constructor(level: Level, monsterSpawn: MonsterSpawn, hideRegion: MECRegion) {
        super(level)
        this.monsterSpawn = monsterSpawn
        this.hideRegion = hideRegion
    }

    destroy = () => {
        if (this.isActionMadeB) {
            this.hideRegion.destroy()
        }
    }

    cancel = (): boolean => {
        if (!this.isActionMadeB) {
            return false
        }
        this.monsterSpawn.addHideRegion(this.hideRegion)
        this.isActionMadeB = false
        this.owner && Text.mkP(this.owner.getPlayer(), 'monster spawn dead zone deletion redone')
        return true
    }

    redo = (): boolean => {
        if (this.isActionMadeB) {
            return false
        }
        this.monsterSpawn.removeHideRegion(this.hideRegion, false)
        this.isActionMadeB = true
        this.owner && Text.mkP(this.owner.getPlayer(), 'monster spawn dead zone deletion cancelled')
        return true
    }
}
