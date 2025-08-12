export class MissingShoe {
    private static TimerEvent: trigger
    private static TurnInEvent: trigger
    private static ItemID: number
    private static Shoe: item
    private static TurnInRange: number

    public static Initialize() {
        RegisterSpawnEvent()
        ItemID = Constants.ITEM_FIERYFOX_S_MISSING_SHOE
        TurnInRange = 200.0
    }

    private static RegisterSpawnEvent() {
        // Between 10 mins - 15mins currently.
        let randomTime = GetRandomReal(600.0, 900.0)
        TimerEvent = CreateTrigger()
        TriggerRegisterTimerEvent(TimerEvent, randomTime, false)
        TimerEvent.AddAction(ErrorHandler.Wrap(EventStart))
    }

    private static RegisterTurnInEvent() {
        TurnInEvent = CreateTrigger()
        TurnInEvent.RegisterUnitInRange(SpawnChampions.Fieryfox2023, TurnInRange, null)
        TurnInEvent.RegisterUnitInRange(SpawnChampions.Fieryfox2024, TurnInRange, null)
        TurnInEvent.AddAction(ErrorHandler.Wrap(TurnInActions))
    }

    // Ping Event + Shoe Spawn
    private static EventStart() {
        let randomWolfRegion = RegionList.WolfRegions[GetRandomInt(0, RegionList.WolfRegions.length - 1)]
        let randomX = GetRandomReal(randomWolfRegion.Rect.MinX, randomWolfRegion.Rect.MaxX)
        let randomY = GetRandomReal(randomWolfRegion.Rect.MinY, randomWolfRegion.Rect.MaxY)
        Shoe = item.Create(ItemID, randomX, randomY)
        PingMinimapEx(randomX, randomY, 10.0, 255, 0, 0, true)
        RegisterTurnInEvent()
    }

    private static TurnInActions() {
        if (!GetTriggerUnit().HasItem(Shoe)) return
        GetTriggerUnit().removeItem(Shoe)
        SpawnChampions.Fieryfox2023.AddItem(Shoe)
        AwardManager.GiveRewardAll('RedTendrils')
    }
}
