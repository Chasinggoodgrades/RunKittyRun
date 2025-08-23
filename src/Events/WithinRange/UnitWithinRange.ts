import { Kitty } from 'src/Game/Entities/Kitty/Kitty'
import { ShadowKitty } from 'src/Game/Entities/ShadowKitty'
import { Trigger, Unit } from 'w3ts'

export class UnitWithinRange {
    private static RegisterUnitWithinRangeSuper = (
        u: Unit,
        range: number,
        cleanOnKilled: boolean,
        filter: () => boolean,
        execution: Trigger
    ) => {
        if (range <= 0) {
            return false
        }

        execution.registerUnitInRage(u.handle, range, Condition(filter))

        return true
    }

    public static DeRegisterUnitWithinRangeUnit = (kitty: Kitty) => {
        if (!kitty.c_Collision || !kitty.w_Collision) return
        kitty.w_Collision.removeActions()
        kitty.c_Collision.removeActions()
        kitty.w_Collision.destroy()
        kitty.c_Collision.destroy()
        kitty.w_Collision = null as never
        kitty.c_Collision = null as never
    }

    public static DeRegisterUnitWithinRangeUnitShadow = (shadowKitty: ShadowKitty) => {
        if (!shadowKitty.cCollision || !shadowKitty.wCollision) return
        shadowKitty.cCollision.removeActions()
        shadowKitty.wCollision.removeActions()
        shadowKitty.wCollision.destroy()
        shadowKitty.cCollision.destroy()
        shadowKitty.wCollision = null as never
        shadowKitty.cCollision = null as never
    }

    public static RegisterUnitWithinRangeTrigger = (
        u: Unit,
        range: number,
        filter: () => boolean,
        execution: Trigger
    ) => {
        return UnitWithinRange.RegisterUnitWithinRangeSuper(u, range, false, filter, execution)
    }
}
