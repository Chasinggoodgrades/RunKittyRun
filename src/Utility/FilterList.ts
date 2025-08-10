

class FilterList
{
    public static KittyFilter: filterfunc = Utility.CreateFilterFunc(()  { return GetFilterUnit().UnitType == Constants.UNIT_KITTY); }
    public static KittyFilterOrShadow: filterfunc = Utility.CreateFilterFunc(()  { return GetFilterUnit().UnitType == Constants.UNIT_KITTY || GetFilterUnit().UnitType == Constants.UNIT_SHADOWKITTY_RELIC_SUMMON); }
    public static DogFilter: filterfunc = Utility.CreateFilterFunc(()  { return GetFilterUnit().UnitType == Constants.UNIT_CUSTOM_DOG); }
    public static IssuedOrderAtkOrder: boolexpr = Condition(()  { return GetIssuedOrderId() == WolfPoint.AttackOrderID); }
    public static IssuedOrderStopOrder: boolexpr = Condition(()  { return GetIssuedOrderId() == WolfPoint.StopOrderID); }
    public static IssuedOrderMoveOrder: boolexpr = Condition(()  { return GetIssuedOrderId() == WolfPoint.MoveOrderID); }
    public static IssuedOrderHoldPosiiton: boolexpr = Condition(()  { return GetIssuedOrderId() == WolfPoint.HoldPositionOrderID); }
    public static UnitTypeWolf: boolexpr = Condition(()  { return GetTriggerUnit().UnitType == Wolf.WOLF_MODEL); }
}
