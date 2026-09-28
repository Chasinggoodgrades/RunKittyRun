import { MakeMonsterAction } from '../MakeLastActions/MakeMonsterAction'
import {
    HIDE,
    MonsterTeleport,
    MONSTER_TELEPORT_PERIOD_MAX,
    MONSTER_TELEPORT_PERIOD_MIN,
    WAIT,
} from '../../04_STRUCTURES/Monster/MonsterTeleport'
import { MonsterType } from '../../04_STRUCTURES/Monster/MonsterType'
import { Make } from '../Make/Make'
import { LandmarkForMake } from '../Make/LandmarkForMake'

export class MakeMonsterTeleport extends Make {
    private mt: MonsterType
    private period: number
    private angle: number
    private mode: string //normal ou string
    private lastX: number[] = []
    private lastY: number[] = []
    private lastLocId: number
    private locPointeur: number
    private landmarkForMake?: LandmarkForMake
    private monster?: MonsterTeleport

    constructor(maker: unit, mode: string, mt: MonsterType, period: number, angle: number) {
        super(maker, 'monsterCreateTeleport')

        if (mode !== 'normal' && mode !== 'string') {
            throw this.constructor.name + ' : wrong mode "' + mode + '"'
        }

        if (period < MONSTER_TELEPORT_PERIOD_MIN || period > MONSTER_TELEPORT_PERIOD_MAX) {
            throw this.constructor.name + ' : wrong periode "' + period + '"'
        }

        this.mt = mt
        this.mode = mode
        this.period = period
        this.angle = angle
        this.lastLocId = -1
        this.locPointeur = -1
    }

    getMonsterType = (): MonsterType => {
        return this.mt
    }

    getPeriod = (): number => {
        return this.period
    }

    getAngle = (): number => {
        return this.angle
    }

    getMode = (): string => {
        return this.mode
    }

    getMonster = () => {
        return this.monster
    }

    nextMonster = () => {
        this.lastLocId = -1
        this.locPointeur = -1
        this.landmarkForMake && this.landmarkForMake.destroy()
        delete this.landmarkForMake

        if (this.monster) {
            this.escaper.newAction(new MakeMonsterAction(this.escaper.getMakingLevel(), this.monster))
            delete this.monster
        }
    }

    addWaitPeriod = (): boolean => {
        if (this.locPointeur < 0) {
            return false
        }
        if (this.saveLoc(WAIT, WAIT)) {
            this.monster && this.monster.addNewLoc(WAIT, WAIT)
            return true
        }
        return false
    }

    addHidePeriod = (): boolean => {
        if (this.locPointeur < 0) {
            return false
        }
        if (this.saveLoc(HIDE, HIDE)) {
            this.monster && this.monster.addNewLoc(HIDE, HIDE)
            return true
        }
        return false
    }

    getLocPointeur = (): number => {
        return this.locPointeur
    }

    setUnitLastClicPosition = (x: number, y: number) => {
        if (!this.landmarkForMake) {
            this.landmarkForMake = new LandmarkForMake(this.escaper, x, y)
        } else {
            this.landmarkForMake.move(x, y)
        }
    }

    saveLoc = (x: number, y: number): boolean => {
        //delete MonsterTeleport.NB_MAX_LOC
        // if (this.locPointeur >= MonsterTeleport.NB_MAX_LOC - 1) {
        //     return false
        // }
        this.locPointeur = this.locPointeur + 1
        this.lastX[this.locPointeur] = x
        this.lastY[this.locPointeur] = y
        this.lastLocId = this.locPointeur
        if (!(x === y && (x === WAIT || x === HIDE))) {
            this.setUnitLastClicPosition(x, y)
        }
        this.escaper.destroyCancelledActions()
        return true
    }

    unsaveLoc = (): boolean => {
        let x: number
        let y: number
        let i: number
        if (this.locPointeur < 0) {
            return false
        }
        this.monster && this.monster.destroyLastLoc()
        this.locPointeur = this.locPointeur - 1
        if (this.locPointeur >= 0) {
            x = this.lastX[this.locPointeur]
            y = this.lastY[this.locPointeur]
            i = this.locPointeur
            while (true) {
                if (i < 0 || !(x === y && (x === WAIT || x === HIDE))) break
                i = i - 1
                x = this.lastX[i]
                y = this.lastY[i]
            }
            if (i >= 0) {
                this.setUnitLastClicPosition(this.lastX[i], this.lastY[i])
            } else {
                this.landmarkForMake && this.landmarkForMake.destroy()
                delete this.landmarkForMake
            }
        } else {
            this.landmarkForMake && this.landmarkForMake.destroy()
            delete this.landmarkForMake
        }
        return true
    }

    setMonster = (monster: MonsterTeleport) => {
        if (this.monster) {
            this.monster.destroy()
        }
        this.monster = monster
    }

    cancelLastAction = (): boolean => {
        return this.unsaveLoc()
    }

    redoLastAction = (): boolean => {
        if (this.locPointeur < this.lastLocId) {
            this.locPointeur = this.locPointeur + 1
            this.monster && this.monster.addNewLoc(this.lastX[this.locPointeur], this.lastY[this.locPointeur])
            this.setUnitLastClicPosition(this.lastX[this.locPointeur], this.lastY[this.locPointeur])
            return true
        }
        return false
    }

    destroy = () => {
        if (this.monster) {
            this.escaper.newAction(new MakeMonsterAction(this.escaper.getMakingLevel(), this.monster))
        }

        this.landmarkForMake && this.landmarkForMake.destroy()
        delete this.landmarkForMake

        super.destroy()
    }

    doActions = () => {
        if (super.doBaseActions()) {
            if (this.getLocPointeur() >= 0) {
                if (this.monster) {
                    this.monster.addNewLoc(this.orderX, this.orderY)
                    this.saveLoc(this.orderX, this.orderY)
                }
            } else {
                MonsterTeleport.destroyLocs()
                MonsterTeleport.storeNewLoc(this.orderX, this.orderY)
                this.saveLoc(this.orderX, this.orderY)

                const monster = new MonsterTeleport(
                    this.getMonsterType(),
                    this.getPeriod(),
                    this.getAngle(),
                    this.getMode()
                )
                this.escaper.getMakingLevel().monsters.new(monster, true)
                this.setMonster(monster)
            }
        }
    }
}
