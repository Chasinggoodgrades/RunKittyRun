import { arrayPush } from 'core/01_libraries/Basic_functions'
import { Text } from 'core/01_libraries/Text'
import {
    ClearMob,
    CLEAR_MOB_MAX_DURATION,
    FRONT_MONTANT_DURATION,
} from 'core/04_STRUCTURES/Monster_properties/ClearMob'
import { Make } from 'core/05_MAKE_STRUCTURES/Make/Make'
import { Monster } from '../../04_STRUCTURES/Monster/Monster'

export class MakeClearMob extends Make {
    private disableDuration: number
    private clearMob?: ClearMob
    private blockMobs: Monster[] = []
    private indexLastBlockNotCancelledMob: number
    private triggerMob?: Monster

    constructor(maker: unit, disableDuration: number) {
        super(maker, 'createClearMob')

        if (
            disableDuration !== 0 &&
            (disableDuration > CLEAR_MOB_MAX_DURATION || disableDuration < FRONT_MONTANT_DURATION)
        ) {
            throw 'ClearMob : wrong duration'
        }

        this.disableDuration = disableDuration
        this.indexLastBlockNotCancelledMob = 0
    }

    private createClearMob = () => {
        if (this.triggerMob) {
            this.clearMob = this.escaper.getMakingLevel().clearMobs.new(this.triggerMob, this.disableDuration, true)
        }
    }

    private addBlockMob = (monster: Monster) => {
        //clear entries after the last not cancelled mob
        const nbBlockMobs = this.blockMobs.length
        for (let i = this.indexLastBlockNotCancelledMob + 1; i < nbBlockMobs; i++) {
            this.blockMobs.splice(-1, 1)
        }

        //add the block mob
        this.clearMob && this.clearMob.addBlockMob(monster)
        arrayPush(this.blockMobs, monster)
        this.indexLastBlockNotCancelledMob++
    }

    private cancelOneBlockMob = () => {
        if (this.clearMob && this.clearMob.removeLastBlockMob()) {
            if (this.indexLastBlockNotCancelledMob != 0) {
                this.indexLastBlockNotCancelledMob--
            }

            return true
        }

        return false
    }

    private redoOneBlockMob = () => {
        if (this.clearMob && this.indexLastBlockNotCancelledMob < this.blockMobs.length - 1) {
            this.indexLastBlockNotCancelledMob++
            const monster = this.blockMobs[this.indexLastBlockNotCancelledMob]
            this.clearMob.addBlockMob(monster)

            return true
        }

        return false
    }

    clickMade = (monster: Monster) => {
        if (!this.clearMob) {
            //creation of the clearMob
            this.triggerMob = monster
            this.createClearMob()
            Text.mkP(this.makerOwner, 'trigger mob added for a new clear mob')
        } else {
            //vérification que le clear mob existe toujours
            if (!this.clearMob.getTriggerMob()) {
                Text.erP(this.makerOwner, 'the clear mob you are working on has been removed')
                this.escaper.destroyMake()
                return
            }
            if (this.clearMob.getBlockMobs().containsMonster(monster)) {
                Text.erP(this.makerOwner, 'this monster is already a block mob of this clear mob')
                return
            } else {
                this.addBlockMob(monster)
                Text.mkP(this.makerOwner, 'block mob added')
            }
        }
    }

    doActions = () => {
        if (super.doBaseActions()) {
            //recherche du monstre cliqué
            const monster = this.escaper.getMakingLevel().monsters.getMonsterNear(this.orderX, this.orderY)

            //application du clic
            if (!monster) {
                Text.erP(this.makerOwner, 'no monster clicked for your making level')
            } else {
                this.clickMade(monster)
            }
        }
    }

    cancelLastAction = () => {
        if (this.clearMob) {
            if (this.cancelOneBlockMob()) {
                Text.mkP(this.makerOwner, 'last block mob removed')
            } else {
                this.clearMob.destroy()
                delete this.clearMob
                Text.mkP(this.makerOwner, 'clear mob removed')
            }

            return true
        } else {
            return false
        }
    }

    redoLastAction = () => {
        if (!this.clearMob) {
            if (this.triggerMob) {
                this.createClearMob()
                Text.mkP(this.makerOwner, 'trigger mob added for a new clear mob')
                return true
            } else {
                return false
            }
        } else if (this.redoOneBlockMob()) {
            Text.mkP(this.makerOwner, 'block mob added')
            return true
        } else {
            return false
        }
    }
}
