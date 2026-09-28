import { BaseArray } from '../BaseArray'
import type { Level } from './Level'
import { VisibilityModifier } from './VisibilityModifier'

export class VisibilityModifierArray extends BaseArray<VisibilityModifier> {
    private level: Level

    constructor(level: Level) {
        super(true)
        this.level = level
    }

    new = (x1: number, y1: number, x2: number, y2: number) => {
        const visibilityModifier = new VisibilityModifier(x1, y1, x2, y2)

        const id = this._new(visibilityModifier)

        visibilityModifier.level = this.level
        visibilityModifier.id = id

        return visibilityModifier
    }

    newFromExisting = (vm: VisibilityModifier) => {
        this._new(vm)
        return vm
    }

    newFromJson = (visibilitiesJson: { [x: string]: any }[]) => {
        for (let v of visibilitiesJson) {
            this.new(v.x1, v.y1, v.x2, v.y2)
        }
    }

    removeVisibility = (arrayId: number) => {
        delete this.data[arrayId]
    }

    removeAllVisibilityModifiers = () => {
        for (const [_, vm] of pairs(this.data)) {
            vm.destroy()
        }
    }

    // Unused
    // removeLasts = (numberOfVMToRemove: number): boolean => {
    //     const vms = this.data
    //         .filter(vm => vm !== undefined)
    //         .reverse()

    //     let i = numberOfVMToRemove
    //     while (i > 0 && vms.length > 0) {
    //         vms[0].destroy()
    //         vms.shift()
    //         i = i - 1
    //     }
    //     return i === 0
    // }

    activate = (activ: boolean) => {
        for (const [_, vm] of pairs(this.data)) {
            vm.activate(activ)
        }
    }
}
