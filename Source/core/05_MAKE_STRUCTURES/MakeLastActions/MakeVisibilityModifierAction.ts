import { Text } from 'core/01_libraries/Text'
import { Level } from '../../04_STRUCTURES/Level/Level'
import { VisibilityModifier } from '../../04_STRUCTURES/Level/VisibilityModifier'
import { MakeAction } from './MakeAction'

export class MakeVisibilityModifierAction extends MakeAction {
    private visibilityModifierSave?: VisibilityModifier
    private visibilityModifierPointeur: VisibilityModifier //pointe vers le vm effectif

    constructor(level: Level, visibilityModifier: VisibilityModifier) {
        super(level)

        this.isActionMadeB = true
        this.visibilityModifierPointeur = visibilityModifier
    }

    cancel = (): boolean => {
        if (!this.isActionMadeB) {
            return false
        }

        this.visibilityModifierSave = this.visibilityModifierPointeur.copy()
        this.visibilityModifierPointeur.destroy()
        this.isActionMadeB = false

        this.owner && Text.mkP(this.owner.getPlayer(), 'visibility creation cancelled')

        return true
    }

    redo = (): boolean => {
        if (this.isActionMadeB || !this.level || !this.visibilityModifierSave) {
            return false
        }

        const vm = this.level.newVisibilityModifierFromExisting(this.visibilityModifierSave)
        if (!vm) {
            this.owner && Text.erP(this.owner.getPlayer(), "can't recreate visibility, full for this level")
        } else {
            this.visibilityModifierPointeur = vm
            vm.activate(true)
            delete this.visibilityModifierSave
        }

        this.isActionMadeB = true
        this.owner && Text.mkP(this.owner.getPlayer(), 'visibility creation redone')

        return true
    }

    destroy = () => {
        if (this.visibilityModifierSave) {
            this.visibilityModifierSave.destroy()
        }
    }
}
