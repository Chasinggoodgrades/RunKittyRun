import { arrayValuesRound, GetLocDist } from 'core/01_libraries/Basic_functions'
import { Constants } from 'core/01_libraries/Constants'
import { udg_monsters } from '../../../../globals'
import { errorHandler } from '../../../Utils/mapUtils'
import { Natives } from '../../wc3_natives_unsecured/Natives'
import { IsHero } from '../Escaper/Escaper_functions'
import type { ContactAreaBuilder } from './ContactChunks'
import { requestContactChunksRebuild } from './ContactChunks'
import { Monster } from './Monster'
import { NewPatrolMonster } from './Monster_functions'
import { MonsterType } from './MonsterType'

const NewRegion = (x: number, y: number): region => {
    let r = Rect(x - 16, y - 16, x + 16, y + 16)
    let R = CreateRegion()
    RegionAddRect(R, r)
    RemoveRect(r)
    return R
}

const MonsterMultiplePatrols_move_Actions = () => {
    let monster: Monster
    let MMP: MonsterMultiplePatrols
    if (IsHero(Natives.UGetTriggerUnit())) {
        return
    }
    monster = udg_monsters[GetUnitUserData(Natives.UGetTriggerUnit())]
    if (monster instanceof MonsterMultiplePatrols) {
        if (monster.getCurrentTrigger() == Natives.UGetTriggeringTrigger()) {
            monster.nextMove()
        }
    }
}

export class MonsterMultiplePatrols extends Monster {
    static X: number[] = []
    static Y: number[] = []

    private currentMove: number
    private sens: number //0 : normal toujours positif, 1 : sens normal avec changement, 2 : sens inversé avec changement

    x: number[] = []
    y: number[] = []
    private r: region[] = []
    private t: trigger[] = []
    private currentTrigger?: trigger

    constructor(mt: MonsterType, mode: string, forceId: number | null = null) {
        super(mt, forceId)

        //mode == "normal" (0, 1, 2, 3, 0 , 1...) ou mode == "string" (0, 1, 2, 3, 2, 1...)
        if (mode !== 'normal' && mode !== 'string') {
            throw this.constructor.name + ' : wrong mode "' + mode + '"'
        }

        if (mode === 'normal') {
            this.sens = 0
        } else {
            this.sens = 1
        }

        MonsterMultiplePatrols.X.forEach((x, n) => {
            const y = MonsterMultiplePatrols.Y[n]

            this.x[n] = x
            this.y[n] = y
            this.r[n] = NewRegion(x, y)
            this.t[n] = CreateTrigger()
            DisableTrigger(this.t[n])
            TriggerAddAction(this.t[n], errorHandler(MonsterMultiplePatrols_move_Actions))
            TriggerRegisterEnterRegionSimple(this.t[n], this.r[n])
        })

        this.currentMove = -1
        MonsterMultiplePatrols.destroyLocs()
    }

    static count = () => {
        let n = 0

        for (const [_, monster] of pairs(udg_monsters)) {
            if (monster instanceof MonsterMultiplePatrols) {
                n++
            }
        }

        return n
    }

    static storeNewLoc(x: number, y: number) {
        const nbLocsBefore = MonsterMultiplePatrols.X.length
        MonsterMultiplePatrols.X[nbLocsBefore] = x
        MonsterMultiplePatrols.Y[nbLocsBefore] = y
        return true
    }

    static destroyLocs() {
        MonsterMultiplePatrols.X = []
        MonsterMultiplePatrols.Y = []
    }

    getContactAreaLabel(): string {
        return this.circleMobParent ? super.getContactAreaLabel() : 'multiplePatrol'
    }

    protected describeOwnContactArea(area: ContactAreaBuilder) {
        for (let i = 0; i < this.x.length; i++) {
            if (i === 0) {
                area.addPoint(this.x[i], this.y[i])
            } else {
                area.addSegment(this.x[i - 1], this.y[i - 1], this.x[i], this.y[i])
            }
        }

        // the last leg, walked back to the first point in "normal" mode
        if (this.sens === 0 && this.x.length > 2) {
            area.addSegment(this.x[this.x.length - 1], this.y[this.y.length - 1], this.x[0], this.y[0])
        }
    }

    getCurrentTrigger = () => {
        return this.currentTrigger
    }

    disableTrigger(id: number) {
        DisableTrigger(this.t[id])
    }

    activateMove(id: number) {
        EnableTrigger(this.t[id])
        this.currentTrigger = this.t[id]
        this.u && IssuePointOrder(this.u, 'move', this.x[id], this.y[id])
    }

    nextMove = () => {
        const lastLocInd = this.x.length - 1
        this.disableTrigger(this.currentMove)

        if (this.sens === 0 || this.sens === 1) {
            if (this.currentMove >= lastLocInd) {
                if (this.sens === 0) {
                    this.currentMove = 0
                } else {
                    this.sens = 2
                    this.currentMove = this.currentMove - 1
                }
            } else {
                this.currentMove = this.currentMove + 1
            }
        } else {
            if (this.currentMove <= 0) {
                this.sens = 1
                this.currentMove = 1
            } else {
                this.currentMove = this.currentMove - 1
            }
        }

        this.activateMove(this.currentMove)
    }

    createUnit = () => {
        if (this.x.length < 2) {
            return //need at least 2 locations to create a unit
        }

        super.createUnit(() =>
            this.mt ? NewPatrolMonster(this.mt, this.x[0], this.y[0], this.x[1], this.y[1]) : undefined
        )

        this.currentMove = 1
        if (this.sens === 2) {
            this.sens = 1
        }
        EnableTrigger(this.t[1])
        this.currentTrigger = this.t[1]
    }

    getX = (id: number) => {
        return this.x[id]
    }

    getY = (id: number): number => {
        return this.y[id]
    }

    destroyLastLoc = (): boolean => {
        const lastLocInd = this.x.length - 1

        if (lastLocInd < 0) {
            return false
        }

        DestroyTrigger(this.t[lastLocInd])
        RemoveRegion(this.r[lastLocInd])

        delete this.t[lastLocInd]
        delete this.r[lastLocInd]
        delete this.x[lastLocInd]
        delete this.y[lastLocInd]
        requestContactChunksRebuild()

        if (lastLocInd === 1) {
            this.removeUnit()
        }

        if (lastLocInd === this.currentMove) {
            this.currentMove = this.currentMove - 1
            this.activateMove(this.currentMove)
        }

        return true
    }

    addNewLocAt(id: number, x: number, y: number) {
        this.x[id] = x
        this.y[id] = y
        this.r[id] = NewRegion(x, y)
        this.t[id] = CreateTrigger()
        DisableTrigger(this.t[id])
        TriggerAddAction(this.t[id], errorHandler(MonsterMultiplePatrols_move_Actions))
        TriggerRegisterEnterRegionSimple(this.t[id], this.r[id])
        requestContactChunksRebuild() // one more leg it can be touched along
    }

    setLocAt(id: number, x: number, y: number) {
        this.x[id] = x
        this.y[id] = y
        RemoveRegion(this.r[id])
        this.r[id] = NewRegion(x, y)
        DestroyTrigger(this.t[id])
        this.t[id] = CreateTrigger()
        DisableTrigger(this.t[id])
        TriggerAddAction(this.t[id], errorHandler(MonsterMultiplePatrols_move_Actions))
        TriggerRegisterEnterRegionSimple(this.t[id], this.r[id])
        requestContactChunksRebuild()
    }

    addNewLoc(x: number, y: number) {
        let lastLocInd = this.x.length - 1

        if (GetLocDist(this.getX(lastLocInd), this.getY(lastLocInd), x, y) <= Constants.PATROL_DISTANCE_MIN) {
            return 2
        }

        if (
            lastLocInd >= 0 &&
            this.sens === 0 &&
            GetLocDist(this.x[0], this.y[0], x, y) <= Constants.PATROL_DISTANCE_MIN
        ) {
            return 1
        }

        lastLocInd++

        this.addNewLocAt(lastLocInd, x, y)
        if (lastLocInd === 1) {
            this.createUnit()
        }

        return 0
    }

    destroy = () => {
        while (this.destroyLastLoc()) {}
        super.destroy()
    }

    toJson() {
        const output = super.toJson()
        if (output) {
            output['mode'] = this.sens > 0 ? 'string' : 'normal'
            output['xArr'] = arrayValuesRound(this.x)
            output['yArr'] = arrayValuesRound(this.y)
        }
        return output
    }
}
