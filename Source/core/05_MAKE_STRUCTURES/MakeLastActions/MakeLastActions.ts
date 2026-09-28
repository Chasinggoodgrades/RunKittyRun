import { Text } from 'core/01_libraries/Text'
import { Escaper } from '../../04_STRUCTURES/Escaper/Escaper'
import { Level } from '../../04_STRUCTURES/Level/Level'
import { MakeAction } from './MakeAction'

export class MakeLastActions {
    private lastActions: { [x: number]: MakeAction } = {}
    private lastActionId = -1
    private lastActionEffective = -1 //anciennement appelé "pointeur"
    private owner: Escaper

    constructor(owner: Escaper) {
        this.owner = owner
    }

    newAction = (action: MakeAction): MakeAction => {
        let i: number

        if (this.lastActionEffective < this.lastActionId) {
            //suppression des actions annulées (à l'ajout d'une nouvelle action)
            i = this.lastActionEffective + 1
            while (i <= this.lastActionId) {
                this.lastActions[i]?.destroy()
                i++
            }
        }

        this.lastActionEffective++

        //sauvegarde de l'action
        this.lastActions[this.lastActionEffective] = action
        this.lastActionId = this.lastActionEffective

        //assignation du "owner" de l'action
        action.owner = this.owner

        return action
    }

    cancelLastAction = (): boolean => {
        if (this.lastActionEffective < 0) {
            return false
        }

        if (!this.lastActions[this.lastActionEffective]) {
            Text.erP(this.owner.getPlayer(), 'action obsolète')
        } else {
            //annulation de l'action
            if (!this.lastActions[this.lastActionEffective].cancel()) {
                Text.erA('error : action already cancelled for player ' + I2S(GetPlayerId(this.owner.getPlayer())))
            }
        }

        this.lastActionEffective--
        return true
    }

    redoLastAction = (): boolean => {
        if (this.lastActionEffective === this.lastActionId) {
            return false
        }

        this.lastActionEffective++

        if (!this.lastActions[this.lastActionEffective]) {
            Text.erP(this.owner.getPlayer(), 'action obsolète')
        } else {
            //réexécution de l'action
            if (!this.lastActions[this.lastActionEffective].redo()) {
                Text.erA('error : action already redone for player ' + I2S(GetPlayerId(this.owner.getPlayer())))
            }
        }

        return true
    }

    deleteSpecificActionsForLevel = (level: Level) => {
        const lastActionEffective = this.lastActions[this.lastActionEffective]

        let highestId = -1

        for (const [actionId, action] of pairs(this.lastActions)) {
            if (action.getLevel() === level) {
                action.destroy()
                delete this.lastActions[actionId]
            } else {
                if (actionId > highestId) {
                    highestId = actionId
                }
            }
        }

        this.lastActionId = highestId

        if (!!lastActionEffective) {
            for (let i = 0; i <= this.lastActionId; i++) {
                if (this.lastActions[i] == lastActionEffective) {
                    this.lastActionEffective = i
                    break
                }
            }
        }
    }

    destroyCancelledActions = () => {
        if (this.lastActionEffective === this.lastActionId) {
            return
        }

        while (this.lastActionId > this.lastActionEffective) {
            this.lastActions[this.lastActionId]?.destroy()
            this.lastActionId--
        }
    }

    destroyAllActions = () => {
        for (const [_, makeAction] of pairs(this.lastActions)) {
            makeAction.destroy()
        }
        this.lastActionId = -1
        this.lastActionEffective = -1
    }

    destroy = () => {
        this.destroyAllActions()
    }
}
