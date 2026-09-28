import { arrayPush } from 'core/01_libraries/Basic_functions'
import { Text } from 'core/01_libraries/Text'
import { CircleMob } from 'core/04_STRUCTURES/Monster_properties/CircleMob'
import { Make } from 'core/05_MAKE_STRUCTURES/Make/Make'
import { Monster } from '../../04_STRUCTURES/Monster/Monster'

export class MakeCircleMob extends Make {
    private circleMob?: CircleMob
    private triggerMob: Monster | null = null
    private mobs: Monster[] = []

    private speed: number | null
    private direction: 'cw' | 'ccw' | null
    private facing: 'cw' | 'ccw' | 'in' | 'out' | null
    private radius: number | null

    private indexLastBlockNotCancelledMob = 0

    private firstClickRadius = false

    constructor(
        maker: unit,
        speed: number | null,
        direction: 'cw' | 'ccw' | null,
        facing: 'cw' | 'ccw' | 'in' | 'out' | null,
        radius: number | null
    ) {
        super(maker, 'createCircleMob')

        this.speed = speed
        this.direction = direction
        this.facing = facing
        this.radius = radius

        this.firstClickRadius = !radius
    }

    private createCircleMob = () => {
        if (!this.radius) {
            this.radius = 400
        }

        if (this.triggerMob) {
            this.circleMob = this.escaper
                .getMakingLevel()
                .circleMobs.new(this.triggerMob, this.speed, this.direction, this.facing, this.radius)

            this.circleMob.activate(true)
        }
    }

    private addBlockMob = (monster: Monster) => {
        //circle entries after the last not cancelled mob
        const nbBlockMobs = this.mobs.length
        for (let i = this.indexLastBlockNotCancelledMob + 1; i < nbBlockMobs; i++) {
            this.mobs.splice(-1, 1)
        }

        //add the block mob
        this.circleMob && this.circleMob.addBlockMob(monster)
        arrayPush(this.mobs, monster)
        this.indexLastBlockNotCancelledMob++
    }

    private cancelOneBlockMob = () => {
        if (this.circleMob && this.circleMob.removeLastBlockMob()) {
            if (this.indexLastBlockNotCancelledMob != 0) {
                this.indexLastBlockNotCancelledMob--
            }

            return true
        }

        return false
    }

    private redoOneBlockMob = () => {
        if (this.circleMob && this.indexLastBlockNotCancelledMob < this.mobs.length - 1) {
            this.indexLastBlockNotCancelledMob++
            const monster = this.mobs[this.indexLastBlockNotCancelledMob]
            this.circleMob.addBlockMob(monster)

            return true
        }

        return false
    }

    clickMade = (monster: Monster) => {
        if (!this.circleMob) {
            this.triggerMob = monster
            this.createCircleMob()

            let msg = 'Center mob selected. '
            if (this.firstClickRadius) {
                msg += 'Now click to at a chosen distance from the center mob to define the radius'
            } else {
                msg += 'Now click on monsters to form the circle'
            }

            Text.mkP(this.makerOwner, msg)
        } else {
            //vérification que le circle mob existe toujours
            if (!this.circleMob.getTriggerMob()) {
                Text.erP(this.makerOwner, 'the circle mob you are working on has been removed')
                this.escaper.destroyMake()
                return
            }
            if (
                monster.getId() === this.circleMob.getTriggerMob().getId() ||
                this.circleMob.getBlockMobs().includes(monster.getId())
            ) {
                Text.erP(this.makerOwner, 'this monster is already a block mob of this circle mob')
                return
            } else {
                this.addBlockMob(monster)
                Text.mkP(this.makerOwner, 'circle mob added')
            }
        }
    }

    doActions = () => {
        if (super.doBaseActions()) {
            if (this.firstClickRadius && this.triggerMob?.u) {
                this.firstClickRadius = false

                const x1 = GetUnitX(this.triggerMob.u)
                const y1 = GetUnitY(this.triggerMob.u)

                const x2 = this.orderX
                const y2 = this.orderY

                this.radius = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2))
                this.circleMob?.setRadius(this.radius)

                Text.mkP(this.makerOwner, `Set radius to: '${this.radius}'. Now click on monsters to form the circle`)
                return
            }

            const monster = this.escaper.getMakingLevel().monsters.getMonsterNear(this.orderX, this.orderY)

            if (!monster) {
                Text.erP(this.makerOwner, 'no monster clicked for your making level')
            } else {
                this.clickMade(monster)
            }
        }
    }

    cancelLastAction = () => {
        if (this.circleMob) {
            if (this.cancelOneBlockMob()) {
                Text.mkP(this.makerOwner, 'last block mob removed')
            } else {
                this.circleMob.destroy()
                delete this.circleMob
                Text.mkP(this.makerOwner, 'circle mob removed')
            }

            return true
        } else {
            return false
        }
    }

    redoLastAction = () => {
        if (!this.circleMob) {
            if (this.triggerMob) {
                this.createCircleMob()
                Text.mkP(this.makerOwner, 'trigger mob added for a new circle mob')
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
