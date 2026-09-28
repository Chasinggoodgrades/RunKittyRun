import { MakeMeteorAction } from 'core/05_MAKE_STRUCTURES/MakeLastActions/MakeMeteorAction'
import { Make } from 'core/05_MAKE_STRUCTURES/Make/Make'
import { Meteor } from '../../04_STRUCTURES/Meteor/Meteor'

export class MakeMeteor extends Make {
    constructor(maker: unit) {
        super(maker, 'meteorCreate')
    }

    doActions = () => {
        if (super.doBaseActions()) {
            const meteor = new Meteor(this.orderX, this.orderY)
            this.escaper.getMakingLevel().meteors.new(meteor, true)
            this.escaper.newAction(new MakeMeteorAction(this.escaper.getMakingLevel(), meteor))
        }
    }
}
