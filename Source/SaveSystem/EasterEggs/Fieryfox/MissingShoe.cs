using System;
using WCSharp.Api;
using static WCSharp.Api.Common;
public static class MissingShoe
{
    private static trigger TimerEvent;
    private static trigger TurnInEvent;
    private static int ItemID;
    private static item Shoe;
    private static float TurnInRange;

    public static void Initialize()
    {
        if(Gamemode.CurrentGameMode != "Standard") return;
        RegisterSpawnEvent();
        ItemID = Constants.ITEM_FIERYFOXES_S_MISSING_SHOE;
        TurnInRange = 200.0f;
    }

    private static void RegisterSpawnEvent()
    {
        // Between 10 mins - 15mins currently.
        var randomTime = GetRandomReal(600.0f, 900.0f);
        TimerEvent = trigger.Create();
        TimerEvent.RegisterTimerEvent(randomTime, false);
        TimerEvent.AddAction(EventStart);
    }

    private static void RegisterTurnInEvent()
    {
        TurnInEvent = trigger.Create();
        TurnInEvent.RegisterUnitInRange(SpawnChampions.Fieryfox2023, TurnInRange, null);
        TurnInEvent.AddAction(TurnInActions);
    }

    // Ping Event + Shoe Spawn
    private static void EventStart()
    {
        var randomWolfRegion = RegionList.WolfRegions[GetRandomInt(0, RegionList.WolfRegions.Length - 1)];
        var randomX = GetRandomReal(randomWolfRegion.Rect.MinX, randomWolfRegion.Rect.MaxX);
        var randomY = GetRandomReal(randomWolfRegion.Rect.MinY, randomWolfRegion.Rect.MaxY);
        Shoe = item.Create(ItemID, randomX, randomY);
        PingMinimapEx(randomX, randomY, 10.0f, 255, 0, 0, true);
        RegisterTurnInEvent();
    }

    private static void TurnInActions()
    {
        if (!@event.Unit.HasItem(Shoe)) return;
        @event.Unit.RemoveItem(Shoe);
        SpawnChampions.Fieryfox2023.AddItem(Shoe);
        AwardManager.GiveRewardAll(Awards.Red_Tendrils);
    }

}