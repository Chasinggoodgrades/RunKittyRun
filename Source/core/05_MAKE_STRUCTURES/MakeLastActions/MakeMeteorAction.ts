import { Text } from 'core/01_libraries/Text'
import { Level } from '../../04_STRUCTURES/Level/Level'
import { Meteor } from '../../04_STRUCTURES/Meteor/Meteor'
import { MakeAction } from './MakeAction'

export class MakeMeteorAction extends MakeAction {
    private meteor: Meteor

    constructor(level: Level, meteor: Meteor) {
        super(level)
        this.meteor = meteor
    }

    destroy = () => {
        if (!this.isActionMadeB) {
            this.meteor.destroy()
        }
    }

    cancel = (): boolean => {
        if (!this.isActionMadeB) {
            return false
        }
        this.meteor.delete()
        this.isActionMadeB = false
        this.owner && Text.mkP(this.owner.getPlayer(), 'meteor creation cancelled')
        return true
    }

    redo = (): boolean => {
        if (this.isActionMadeB) {
            return false
        }
        this.meteor.undelete()
        this.isActionMadeB = true
        this.owner && Text.mkP(this.owner.getPlayer(), 'meteor creation redone')
        return true
    }
}
