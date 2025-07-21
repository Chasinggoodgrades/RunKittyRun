using WCSharp.Api;
using static WCSharp.Api.Common;

public static class FilterList
{
    public static filterfunc KittyFilter { get; private set; } = Utility.CreateFilterFunc(() => GetFilterUnit().UnitType == Constants.UNIT_KITTY);
    public static filterfunc DogFilter { get; private set; } = Utility.CreateFilterFunc(() => GetFilterUnit().UnitType == Constants.UNIT_CUSTOM_DOG);
    public static boolexpr IssuedOrderAtkOrder = Condition(() => GetIssuedOrderId() == WolfPoint.AttackOrderID);
    public static boolexpr IssuedOrderStopOrder = Condition(() => GetIssuedOrderId() == WolfPoint.StopOrderID);
    public static boolexpr IssuedOrderMoveOrder = Condition(() => GetIssuedOrderId() == WolfPoint.MoveOrderID);
    public static boolexpr IssuedOrderHoldPosiiton = Condition(() => GetIssuedOrderId() == WolfPoint.HoldPositionOrderID);
    public static boolexpr UnitTypeWolf = Condition(() => GetTriggerUnit().UnitType == Wolf.WOLF_MODEL);
}
