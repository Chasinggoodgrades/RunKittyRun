import { MemoryHandler } from 'Utils/MemoryHandler'
import { arrayPush, IsItemBetweenLocs } from '../../01_libraries/Basic_functions'
import { BaseArray } from '../BaseArray'
import type { Level } from '../Level/Level'
import { MONSTER_NEAR_DIFF_MAX } from '../Monster/MonsterArray'
import { Meteor } from './Meteor'

export class MeteorArray extends BaseArray<Meteor> {
    private level: Level

    constructor(level: Level) {
        super(false)
        this.level = level
    }

    new = (meteor: Meteor, createMeteor: boolean) => {
        this._new(meteor)
        createMeteor && meteor.createMeteorItem()
        meteor.level = this.level
    }

    newFromJson = (meteorsJson: { [x: string]: any }[]) => {
        for (let m of meteorsJson) {
            const meteor = new Meteor(m.x, m.y)
            this.new(meteor, false)
        }
    }

    removeMeteor = (meteorId: number) => {
        delete this.data[meteorId]
    }

    clearMeteor = (meteorId: number): boolean => {
        if (this.data[meteorId]) {
            this.data[meteorId].destroy()
            delete this.data[meteorId]
            return true
        } else {
            return false
        }
    }

    createMeteorsItems = () => {
        for (const [_, meteor] of pairs(this.data)) {
            meteor.createMeteorItem()
        }
    }

    removeMeteorsItems = () => {
        for (const [_, meteor] of pairs(this.data)) {
            meteor.removeMeteorItem()
        }
    }

    getMeteorNear = (x: number, y: number) => {
        for (const [_, meteor] of pairs(this.data)) {
            const item = meteor.getItem()
            if (item) {
                const xMeteor = GetItemX(item)
                const yMeteor = GetItemY(item)
                if (RAbsBJ(x - xMeteor) < MONSTER_NEAR_DIFF_MAX && RAbsBJ(y - yMeteor) < MONSTER_NEAR_DIFF_MAX) {
                    return meteor
                }
            }
        }

        return null
    }

    getMeteorsBetweenLocs(x1: number, y1: number, x2: number, y2: number) {
        const arr = MemoryHandler.getEmptyArray<Meteor>()

        for (const [_, meteor] of pairs(this.data)) {
            const item = meteor.getItem()

            if (item && IsItemBetweenLocs(item, x1, y1, x2, y2)) {
                arrayPush(arr, meteor)
            }
        }

        return arr
    }
}
