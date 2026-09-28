import { Text } from '../../01_libraries/Text'
import { Level } from '../../04_STRUCTURES/Level/Level'
import { Monster } from '../../04_STRUCTURES/Monster/Monster'
import { MakeAction } from './MakeAction'

export class MakeDeleteMonstersAction extends MakeAction {
    private suppressedMonsters: Monster[]

    constructor(level: Level, suppressedMonsters: Monster[]) {
        super(level)

        if (suppressedMonsters.length == 0) {
            throw 'no monster suppressed'
        }

        this.suppressedMonsters = suppressedMonsters
    }

    destroy = () => {
        if (this.isActionMadeB) {
            //suppression définitive des mobs
            for (const monster of this.suppressedMonsters) {
                monster.destroy()
            }
        }
    }

    cancel = (): boolean => {
        if (!this.isActionMadeB) {
            return false
        }

        //création des monstres supprimés
        for (const monster of this.suppressedMonsters) {
            monster.undelete()
        }

        this.isActionMadeB = false
        this.owner && Text.mkP(this.owner.getPlayer(), 'monster deleting cancelled')

        return true
    }

    redo = (): boolean => {
        if (this.isActionMadeB) {
            return false
        }

        //suppression des monstres recréés
        for (const monster of this.suppressedMonsters) {
            monster.delete()
        }

        this.isActionMadeB = true
        this.owner && Text.mkP(this.owner.getPlayer(), 'monster deleting redone')

        return true
    }
}
