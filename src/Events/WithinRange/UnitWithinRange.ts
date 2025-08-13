export class UnitWithinRange {
    private static RegisterUnitWithinRangeSuper(
        u: Unit,
        range: number,
        cleanOnKilled: boolean,
        filter: Func<bool>,
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
        kitty.w_Collision.dispose()
        kitty.c_Collision.dispose()
        kitty.w_Collision = null
        kitty.c_Collision = null
    }

    public static DeRegisterUnitWithinRangeUnit(kitty: ShadowKitty) {
        kitty.cCollision.ClearActions()
        kitty.wCollision.ClearActions()
        kitty.wCollision.dispose()
        kitty.cCollision.dispose()
        kitty.wCollision = null
        kitty.cCollision = null
    }

    public static RegisterUnitWithinRangeTrigger(u: Unit, range: number, filter: Func<bool>, execution: Trigger) {
        return RegisterUnitWithinRangeSuper(u, range, false, filter, execution)
    }
}
