import { udg_monsters } from '../../../../globals'
import { arrayValuesRound } from '../../01_libraries/Basic_functions'
import { Natives } from '../../wc3_natives_unsecured/Natives'
import type { ContactAreaBuilder } from './ContactChunks'
import { requestContactChunksRebuild } from './ContactChunks'
import { Monster } from './Monster'
import { MonsterType } from './MonsterType'
import { NewImmobileMonster } from './Monster_functions'

export const WAIT = 1000000
export const HIDE = 2000000
export const MONSTER_TELEPORT_PERIOD_MIN = 0.1
export const MONSTER_TELEPORT_PERIOD_MAX = 10

const MonsterTeleport_move_Actions = () => {
    const monsterTP = MonsterTeleport.anyMonsterTeleportTimerId2MonsterTeleport.get(
        GetHandleId(Natives.UGetExpiredTimer())
    )
    if (monsterTP) {
        monsterTP.nextMove()
    }
}

export class MonsterTeleport extends Monster {
    static X: number[] = []
    static Y: number[] = []

    static anyMonsterTeleportTimerId2MonsterTeleport = new Map<number, MonsterTeleport>()

    private currentLoc: number
    private sens: number //0 : normal toujours positif, 1 : sens normal avec changement, 2 : sens inversé avec changement

    private period: number
    private angle: number

    private x: number[] = []
    private y: number[] = []
    private t: timer

    constructor(mt: MonsterType, period: number, angle: number, mode: string, forceId: number | null = null) {
        super(mt, forceId)

        //mode == "normal" (0, 1, 2, 3, 0 , 1...) ou mode == "string" (0, 1, 2, 3, 2, 1...)
        if (mode !== 'normal' && mode !== 'string') {
            throw this.constructor.name + ' : wrong mode "' + mode + '"'
        }

        if (period < MONSTER_TELEPORT_PERIOD_MIN || period > MONSTER_TELEPORT_PERIOD_MAX) {
            throw this.constructor.name + ' : wrong period "' + period + '"'
        }

        if (mode === 'normal') {
            this.sens = 0
        } else {
            this.sens = 1
        }

        this.angle = angle
        this.period = period

        this.t = CreateTimer()
        MonsterTeleport.anyMonsterTeleportTimerId2MonsterTeleport.set(GetHandleId(this.t), this)

        MonsterTeleport.X.forEach((x, n) => {
            const y = MonsterTeleport.Y[n]

            this.x[n] = x
            this.y[n] = y
        })

        this.currentLoc = -1
        MonsterTeleport.destroyLocs()
    }

    static count = () => {
        let n = 0

        for (const [_, monster] of pairs(udg_monsters)) {
            if (monster instanceof MonsterTeleport) {
                n++
            }
        }

        return n
    }

    static storeNewLoc(x: number, y: number) {
        const nbLocsBefore = MonsterTeleport.X.length
        MonsterTeleport.X[nbLocsBefore] = x
        MonsterTeleport.Y[nbLocsBefore] = y
        return true
    }

    static destroyLocs() {
        MonsterTeleport.X = []
        MonsterTeleport.Y = []
    }

    removeUnit() {
        super.removeUnit()
        PauseTimer(this.t)
    }

    killUnit = () => {
        super.killUnit()
        PauseTimer(this.t)
    }

    setPeriod(period: number) {
        if (period < MONSTER_TELEPORT_PERIOD_MIN || period > MONSTER_TELEPORT_PERIOD_MAX) {
            return false
        }

        this.period = period
        if (this.u && IsUnitAliveBJ(this.u)) {
            TimerStart(this.t, this.period, true, MonsterTeleport_move_Actions)
        }
        return true
    }

    getPeriod = () => {
        return this.period
    }

    createUnit = () => {
        if (this.x.length < 1) {
            return //need at least 1 location to create a unit
        }

        super.createUnit(() => (this.mt ? NewImmobileMonster(this.mt, this.x[0], this.y[0], this.angle) : undefined))

        this.currentLoc = 0
        if (this.sens === 2) {
            this.sens = 1
        }

        TimerStart(this.t, this.period, true, MonsterTeleport_move_Actions)
    }

    nextMove = () => {
        const lastLocInd = this.x.length - 1

        if (this.sens === 0 || this.sens === 1) {
            if (this.currentLoc >= lastLocInd) {
                if (this.sens === 0) {
                    this.currentLoc = 0
                } else {
                    this.sens = 2
                    this.currentLoc = this.currentLoc - 1
                }
            } else {
                this.currentLoc = this.currentLoc + 1
            }
        } else {
            if (this.currentLoc <= 0) {
                this.sens = 1
                this.currentLoc = 1
            } else {
                this.currentLoc = this.currentLoc - 1
            }
        }

        if (this.u) {
            let x = this.getX(this.currentLoc)
            let y = this.getY(this.currentLoc)

            if (x === HIDE && y === HIDE) {
                ShowUnit(this.u, false)
            } else if (x !== WAIT || y !== WAIT) {
                if (IsUnitHidden(this.u)) {
                    ShowUnit(this.u, true)
                    if (this.mt && !this.mt.isClickable()) {
                        UnitRemoveAbility(this.u, FourCC('Aloc'))
                        UnitAddAbility(this.u, FourCC('Aloc'))
                    }
                }
                SetUnitX(this.u, x)
                SetUnitY(this.u, y)
            }
        }
    }

    getContactAreaLabel(): string {
        return this.circleMobParent ? super.getContactAreaLabel() : 'teleport'
    }

    protected describeOwnContactArea(area: ContactAreaBuilder) {
        for (let i = 0; i < this.x.length; i++) {
            const x = this.x[i]
            const y = this.y[i]

            // WAIT and HIDE are orders rather than places: the monster does not go there
            if (x !== WAIT && x !== HIDE && y !== WAIT && y !== HIDE) {
                area.addPoint(x, y)
            }
        }
    }

    getX = (id: number): number => {
        return this.x[id]
    }

    getY = (id: number): number => {
        return this.y[id]
    }

    addNewLocAt = (id: number, x: number, y: number) => {
        this.x[id] = x
        this.y[id] = y
        requestContactChunksRebuild() // one more place it can be touched at
    }

    addNewLoc = (x: number, y: number): boolean => {
        let newLastLocInd = this.x.length

        this.addNewLocAt(newLastLocInd, x, y)
        if (newLastLocInd === 0) {
            this.createUnit()
        }

        return true
    }

    destroyLastLoc = (): boolean => {
        let lastLocInd = this.x.length - 1

        if (lastLocInd < 0) {
            return false
        }

        if (lastLocInd === 0) {
            PauseTimer(this.t)
            this.u && RemoveUnit(this.u)
        }

        delete this.x[lastLocInd]
        delete this.y[lastLocInd]
        requestContactChunksRebuild()

        return true
    }

    destroy = () => {
        MonsterTeleport.anyMonsterTeleportTimerId2MonsterTeleport.delete(GetHandleId(this.t))
        DestroyTimer(this.t)
        super.destroy()
    }

    toJson() {
        const output = super.toJson()
        if (output) {
            output['mode'] = this.sens > 0 ? 'string' : 'normal'
            output['period'] = this.period
            output['angle'] = R2I(this.angle)
            output['xArr'] = arrayValuesRound(this.x)
            output['yArr'] = arrayValuesRound(this.y)
        }
        return output
    }
}
