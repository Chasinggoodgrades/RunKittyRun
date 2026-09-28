import { Text } from 'core/01_libraries/Text'
import { MakeMonsterAction } from '../MakeLastActions/MakeMonsterAction'
import { MonsterMultiplePatrols } from '../../04_STRUCTURES/Monster/MonsterMultiplePatrols'
import { MonsterType } from '../../04_STRUCTURES/Monster/MonsterType'
import { Make } from '../Make/Make'
import { LandmarkForMake } from '../Make/LandmarkForMake'

export class MakeMonsterMultiplePatrols extends Make {
    private mt: MonsterType
    private mode: string //normal ou string
    private lastX: number[] = []
    private lastY: number[] = []
    private lastLocId: number
    private locPointeur: number
    private landmarkForMake?: LandmarkForMake
    private monster?: MonsterMultiplePatrols

    constructor(maker: unit, mode: string, mt: MonsterType) {
        super(maker, 'monsterCreateMultiplePatrols')

        if (mode !== 'normal' && mode !== 'string') {
            throw this.constructor.name + ' : wrong mode "' + mode + '"'
        }

        this.mt = mt
        this.mode = mode
        this.lastLocId = -1
        this.locPointeur = -1
    }

    getMonsterType = (): MonsterType => {
        return this.mt
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

    saveLoc = (x: number, y: number) => {
        this.locPointeur = this.locPointeur + 1
        this.lastX[this.locPointeur] = x
        this.lastY[this.locPointeur] = y
        this.lastLocId = this.locPointeur
        this.setUnitLastClicPosition(x, y)
        this.escaper.destroyCancelledActions()
    }

    unsaveLoc = (): boolean => {
        if (this.locPointeur < 0) {
            return false
        }

        this.monster && this.monster.destroyLastLoc()

        this.locPointeur = this.locPointeur - 1
        if (this.locPointeur >= 0) {
            this.setUnitLastClicPosition(this.lastX[this.locPointeur], this.lastY[this.locPointeur])
        } else {
            this.landmarkForMake && this.landmarkForMake.destroy()
            delete this.landmarkForMake
            this.monster && this.monster.removeUnit()
        }
        return true
    }

    setMonster = (monster: MonsterMultiplePatrols) => {
        if (this.monster) {
            this.monster.destroy()
        }
        this.monster = monster
    }

    cancelLastAction = () => {
        return this.unsaveLoc()
    }

    redoLastAction = () => {
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
            let erreur: number

            if (this.getLocPointeur() >= 0) {
                if (this.monster) {
                    erreur = this.monster.addNewLoc(this.orderX, this.orderY)
                    if (erreur > 0) {
                        if (erreur === 2) {
                            Text.erP(this.makerOwner, 'Too close to the last location !')
                        }
                        if (erreur === 1) {
                            Text.erP(this.makerOwner, 'Too close to the first location !')
                        }
                    } else {
                        this.saveLoc(this.orderX, this.orderY)
                    }
                }
            } else {
                MonsterMultiplePatrols.destroyLocs()
                MonsterMultiplePatrols.storeNewLoc(this.orderX, this.orderY)
                this.saveLoc(this.orderX, this.orderY)

                const monster = new MonsterMultiplePatrols(this.getMonsterType(), this.getMode())
                this.escaper.getMakingLevel().monsters.new(monster, true)
                this.setMonster(monster)
            }
        }
    }
}
