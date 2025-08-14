import { Kitty } from 'src/Game/Entities/Kitty/Kitty'
import { ShadowKitty } from 'src/Game/Entities/ShadowKitty'
import { Trigger, Unit } from 'w3ts'

export class UnitWithinRange {
    private static RegisterUnitWithinRangeSuper(
        u: Unit,
        range: number,
        cleanOnKilled: boolean,
        filter: () => boolean,
        execution: Trigger
    ) {
        if (range <= 0) {
            return false
        }

        TriggerRegisterUnitInRange(execution, u, range, Condition(filter))

        return true
    }

    public static DeRegisterUnitWithinRangeUnit(kitty: Kitty) {
        kitty.w_Collision.ClearActions()
        kitty.c_Collision.ClearActions()
        kitty.w_Collision.destroy()
        kitty.c_Collision.destroy()
        kitty.w_Collision = null
        kitty.c_Collision = null
    }

    public static DeRegisterUnitWithinRangeUnitShadow(kitty: ShadowKitty) {
        kitty.cCollision.ClearActions()
        kitty.wCollision.ClearActions()
        kitty.wCollision.destroy()
        kitty.cCollision.destroy()
        kitty.wCollision = null
        kitty.cCollision = null
    }

    public static RegisterUnitWithinRangeTrigger(u: Unit, range: number, filter: () => boolean, execution: Trigger) {
        return UnitWithinRange.RegisterUnitWithinRangeSuper(u, range, false, filter, execution)
    }
}
