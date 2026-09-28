import { MemoryHandler } from 'Utils/MemoryHandler'
import { IsUnitBetweenLocs, arrayPush } from '../../01_libraries/Basic_functions'
import { MecHookArray } from '../../API/MecHookArray'
import { BaseArray } from '../BaseArray'
import { Caster } from '../Caster/Caster'
import type { CasterType } from '../Caster/CasterType'
import type { Level } from '../Level/Level'
import type { Monster } from './Monster'
import { MonsterNoMove } from './MonsterNoMove'
import type { MonsterType } from './MonsterType'
import { countMonstersAccordingToMode } from './Monster_count'

export const MONSTER_NEAR_DIFF_MAX = 64

//represents the monsters in a level
export class MonsterArray extends BaseArray<Monster> {
    private level?: Level

    //hooks
    public hooks_onBeforeCreateMonsterUnit = new MecHookArray<(monster: Partial<Monster>) => boolean>()
    public hooks_onAfterCreateMonsterUnit = new MecHookArray<(monster: Partial<Monster>) => void>()

    constructor(level?: Level) {
        super(false)
        this.level = level
    }

    getLevel = () => {
        return this.level
    }

    new = (monster: Monster, createUnit: boolean) => {
        this._new(monster)

        if (createUnit) {
            monster.createUnit()
        }

        if (this.level) {
            monster.level = this.level

            if (monster instanceof MonsterNoMove) {
                monster.wander()
            }
        }
    }

    count = (mode?: string) => countMonstersAccordingToMode(this.data, mode)

    //Juste remove the monster from this level
    removeMonster = (monsterId: number) => {
        delete this.data[monsterId]
    }

    getMonsterNear = (x: number, y: number, filterMonsterClassName?: string): Monster | null => {
        for (const [_, monster] of pairs(this.data)) {
            if (monster && monster.u) {
                const xMob = GetUnitX(monster.u)
                const yMob = GetUnitY(monster.u)

                if (!filterMonsterClassName || monster.constructor.name === filterMonsterClassName) {
                    if (RAbsBJ(x - xMob) < MONSTER_NEAR_DIFF_MAX && RAbsBJ(y - yMob) < MONSTER_NEAR_DIFF_MAX) {
                        return monster
                    }
                }
            }
        }

        return null
    }

    getMonstersBetweenLocs(x1: number, y1: number, x2: number, y2: number, filterMonsterClassName?: string | string[]) {
        let filterMonsterClassNameArr: string[] | null = null
        let clearArrayAtEnd = false

        if (filterMonsterClassName) {
            if (typeof filterMonsterClassName == 'string') {
                filterMonsterClassNameArr = MemoryHandler.getEmptyArray()
                clearArrayAtEnd = true
                filterMonsterClassNameArr[0] = filterMonsterClassName
            } else {
                filterMonsterClassNameArr = filterMonsterClassName
            }
        }

        const filteredMonsters = MemoryHandler.getEmptyArray<Monster>()

        for (const [_, monster] of pairs(this.data)) {
            if (monster.u) {
                if (!filterMonsterClassNameArr || filterMonsterClassNameArr.includes(monster.constructor.name)) {
                    if (IsUnitBetweenLocs(monster.u, x1, y1, x2, y2)) {
                        arrayPush(filteredMonsters, monster)
                    }
                }
            }
        }

        if (clearArrayAtEnd) {
            filterMonsterClassNameArr && MemoryHandler.destroyArray(filterMonsterClassNameArr)
        }

        return filteredMonsters
    }

    getMonsterNoMoveNearTile = (x: number, y: number): Monster | null => {
        for (const [_, monster] of pairs(this.data)) {
            if (monster instanceof MonsterNoMove && !monster.isDeleted()) {
                if (
                    Math.floor((x - 64) / 128) === Math.floor((monster.x - 64) / 128) &&
                    Math.floor((y - 64) / 128) === Math.floor((monster.y - 64) / 128)
                ) {
                    return monster
                }
            }
        }

        return null
    }

    createMonstersUnits = () => {
        for (const [_, monster] of pairs(this.data)) {
            monster.createUnit()
        }
    }

    removeMonstersUnits = () => {
        for (const [_, monster] of pairs(this.data)) {
            monster.removeUnit()
        }
    }

    recreateMonstersUnitsOfType = (mt: MonsterType) => {
        for (const [_, monster] of pairs(this.data)) {
            if (monster.getMonsterType() === mt) {
                monster.createUnit()
            }
        }
    }

    //Destroy one monster
    clearMonster = (monsterId: number) => {
        if (this.data[monsterId]) {
            this.data[monsterId].destroy()
            delete this.data[monsterId]
            return true
        } else {
            return false
        }
    }

    //Destroy monsters of one type
    clearMonstersOfType = (mt: MonsterType) => {
        for (const [_, monster] of pairs(this.data)) {
            if (monster.getMonsterType() === mt) {
                delete this.data[monster.getId()]
                monster.destroy()
            }
        }
    }

    //Special casters
    refreshCastersOfType(ct: CasterType) {
        for (const [_, monster] of pairs(this.data)) {
            monster instanceof Caster && monster.getCasterType() === ct && monster.refresh()
        }
    }

    removeCastersOfType(ct: CasterType) {
        for (const [_, monster] of pairs(this.data)) {
            monster instanceof Caster && monster.getCasterType() === ct && monster.destroy()
        }
    }

    containsMonster(monster: Monster) {
        for (const [_, m] of pairs(this.data)) {
            if (m === monster) {
                return true
            }
        }

        return false
    }

    getLast = () => {
        let last = null

        for (const [_, monster] of pairs(this.data)) {
            last = monster
        }

        return last
    }

    removeLast = (destroy = true) => {
        const last = this.getLast()

        if (last) {
            if (destroy) {
                last.destroy()
            } else {
                last.createUnit()
            }
            delete this.data[last.id]
            return true
        }

        return false
    }

    removeAllWithoutDestroy = () => {
        while (this.removeLast(false));
    }

    onBeforeCreateMonsterUnit = (cb: () => boolean) => {
        return this.hooks_onBeforeCreateMonsterUnit.new(cb)
    }

    onAfterCreateMonsterUnit = (cb: () => any) => {
        return this.hooks_onAfterCreateMonsterUnit.new(cb)
    }
}
