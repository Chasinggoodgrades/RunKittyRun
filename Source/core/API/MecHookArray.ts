import { MemoryHandler } from 'Utils/MemoryHandler'
import { arrayPush } from 'core/01_libraries/Basic_functions'
import { MecHook } from './MecHook'

export class MecHookArray<T extends (...args: any) => any> {
    private hooks = MemoryHandler.getEmptyArray<MecHook<T>>()

    public new = (cb: T) => {
        const hook = new MecHook<T>(cb)
        arrayPush(this.hooks, hook)
        hook.mecHookArray = this
        return hook.getId()
    }

    public destroy = (id: number) => {
        const hook = this.hooks[id]
        if (!!hook) {
            ;(this.hooks as any)[id] = null
            return true
        } else {
            return false
        }
    }

    public getHooks = () => this.hooks
}

export function CombineHooks<T extends (...args: any) => void>(
    ha1: MecHookArray<T> | undefined,
    ha2: MecHookArray<T> | undefined
) {
    const outHookArray = MemoryHandler.getEmptyArray<MecHook<T>>()

    if (ha1) {
        for (const value of ha1.getHooks()) {
            arrayPush(outHookArray, value)
        }
    }

    if (ha2) {
        for (const value of ha2.getHooks()) {
            arrayPush(outHookArray, value)
        }
    }

    return outHookArray
}
