import { MemoryHandler } from 'Utils/MemoryHandler'
import { getUdgTerrainTypes } from '../../../../globals'
import { Level } from '../Level/Level'

export const METEOR_NORMAL = FourCC('MND1')
export const METEOR_CHEAT = FourCC('MCD1')

export const udg_meteors: { [x: number]: Meteor } = {}

let lastInstanceId = -1

export class Meteor {
    private id: number
    private x: number
    private y: number
    private item?: item
    level?: Level
    arrayId?: number
    private deleted: boolean = false

    constructor(x: number, y: number) {
        this.x = x
        this.y = y

        this.id = ++lastInstanceId
        udg_meteors[this.id] = this
    }

    getId = () => {
        return this.id
    }

    getItem = () => {
        return this.item
    }

    removeMeteorItem = () => {
        if (this.item) {
            RemoveItem(this.item)
        }
    }

    createMeteorItem = () => {
        if (!!this.item) {
            this.removeMeteorItem()
        }

        this.item = CreateItem(METEOR_NORMAL, this.x, this.y)
        if (!this.item) {
            throw new Error('Meteor item could not be created')
        }

        if (getUdgTerrainTypes().getTerrainType(this.x, this.y)?.getKind() == 'slide') {
            SetItemDroppable(this.item, false)
        }
        SetItemUserData(this.item, this.id)
    }

    delete = () => {
        if (this.item) {
            this.removeMeteorItem()
        }

        this.deleted = true
    }

    undelete = () => {
        this.deleted = false
        this.createMeteorItem()
    }

    isDeleted = () => {
        return this.deleted
    }

    destroy = () => {
        if (this.item !== null) {
            this.removeMeteorItem()
        }

        this.level && this.level.meteors.removeMeteor(this.id)

        delete udg_meteors[this.id]
    }

    replace = () => {
        this.item && SetItemPosition(this.item, this.x, this.y)
    }

    toJson = () => {
        if (this.isDeleted()) {
            return false
        } else {
            const output = MemoryHandler.getEmptyObject<any>()

            output['x'] = R2I(this.x)
            output['y'] = R2I(this.y)

            return output
        }
    }
}
