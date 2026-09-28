import { MemoryHandler } from 'Utils/MemoryHandler'
import { arrayPush, sortArrayOfObjectsByIds } from '../01_libraries/Basic_functions'

type BaseModel = { getId?: () => number; destroy: () => void; toJson: () => {} }

export abstract class BaseArray<T extends BaseModel> {
    private manageIds = false

    protected lastInstanceId = -1
    protected data: { [x: number]: T } = {}

    constructor(manageIds: boolean) {
        this.manageIds = manageIds
    }

    protected _new = (v: T) => {
        if (this.manageIds) {
            this.data[++this.lastInstanceId] = v
        } else {
            const id = v.getId?.()

            if (!id) {
                throw `BaseArray: _new: v.getId() is null (${this.constructor.name})`
            }

            this.data[id] = v
        }

        return this.lastInstanceId
    }

    count = () => {
        let n = 0

        for (const [_k, _v] of pairs(this.data)) {
            n++
        }

        return n
    }

    get = (id: number): T | null => this.data[id] || null

    forAll(cb: (v: T, id: number) => void) {
        for (const [id, element] of pairs(this.data)) {
            cb(element, id)
        }
    }

    forAllReversed(cb: (v: T, id: number) => void) {
        const keys: number[] = []

        for (const [id, _element] of pairs(this.data)) {
            arrayPush(keys, id)
        }

        keys.sort((a, b) => b - a)

        for (const id of keys) {
            cb(this.data[id], id)
        }
    }

    getAll = () => this.data

    toJson: () => any = () => {
        const outputArray = MemoryHandler.getEmptyArray<{ [x: string | number]: any }[]>()

        for (const [_, element] of pairs(this.data)) {
            const json = element.toJson()
            if (!!json) {
                arrayPush(outputArray, json)
            }
        }

        return sortArrayOfObjectsByIds(outputArray)
    }

    destroyOne = (id: number) => {
        if (this.data[id]) {
            this.data[id].destroy()
            delete this.data[id]
            return true
        } else {
            return false
        }
    }

    destroy = () => {
        for (const [id, v] of pairs(this.data)) {
            v.destroy()
            delete this.data[id]
        }
        this.lastInstanceId = -1
    }

    // First index is 0
    getLastInstanceId = () => this.lastInstanceId + 1

    getFirst = () => {
        for (const [_, element] of pairs(this.data)) {
            return element
        }
    }
}
