class UnitWithinRange {
    private static RegisterUnitWithinRangeSuper(
        u: unit,
        range: number,
        cleanOnKilled: boolean,
        filter: Func<bool>,
        execution: trigger
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
        kitty.w_Collision.Dispose()
        kitty.c_Collision.Dispose()
        kitty.w_Collision = null
        kitty.c_Collision = null
    }

    public static DeRegisterUnitWithinRangeUnit(kitty: ShadowKitty) {
        kitty.cCollision.ClearActions()
        kitty.wCollision.ClearActions()
        kitty.wCollision.Dispose()
        kitty.cCollision.Dispose()
        kitty.wCollision = null
        kitty.cCollision = null
    }

    public static RegisterUnitWithinRangeTrigger(u: unit, range: number, filter: Func<bool>, execution: trigger) {
        return RegisterUnitWithinRangeSuper(u, range, false, filter, execution)
    }
}
