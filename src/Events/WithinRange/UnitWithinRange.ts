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
        kitty.w_Collision.removeActions()
        kitty.c_Collision.removeActions()
        kitty.w_Collision.destroy()
        kitty.c_Collision.destroy()
    }

    public static DeRegisterUnitWithinRangeUnitShadow = (shadowKitty: ShadowKitty) => {
        shadowKitty.cCollision.removeActions()
        shadowKitty.wCollision.removeActions()
        shadowKitty.wCollision.destroy()
        shadowKitty.cCollision.destroy()
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
