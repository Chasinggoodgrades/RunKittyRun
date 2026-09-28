import { Text } from 'core/01_libraries/Text'
import { Level } from '../../04_STRUCTURES/Level/Level'
import { MakeAction } from './MakeAction'
import { Monster } from '../../04_STRUCTURES/Monster/Monster'

export class MakeMonsterAction extends MakeAction {
    private monster: Monster

    constructor(level: Level, monster: Monster) {
        super(level)
        this.monster = monster
    }

    destroy = () => {
        if (!this.isActionMadeB) {
            this.monster.destroy()
        }
    }

    cancel = (): boolean => {
        if (!this.isActionMadeB) {
            return false
        }
        this.monster.delete()
        this.isActionMadeB = false
        this.owner && Text.mkP(this.owner.getPlayer(), 'monster creation cancelled')
        return true
    }

    redo = (): boolean => {
        if (this.isActionMadeB) {
            return false
        }
        this.monster.undelete()
        this.isActionMadeB = true
        this.owner && Text.mkP(this.owner.getPlayer(), 'monster creation redone')
        return true
    }
}
