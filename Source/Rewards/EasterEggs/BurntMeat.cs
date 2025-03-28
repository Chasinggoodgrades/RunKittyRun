﻿using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class BurntMeat
{
    private static trigger StanDeath = trigger.Create();
    private static trigger StanTurnIn = trigger.Create();
    private static triggeraction StanDeathActions;
    private static triggeraction StanTurnInActions;
    private const int ITEM_CLOAK_FLAMES = Constants.ITEM_CLOAK_OF_FLAMES;
    private const int ITEM_BURNT_MEAT = Constants.ITEM_WOLF_MEAT;
    private static List<unit> Completed = new List<unit>();

    public static void FlamesDropChance(Kitty k)
    {
        var randomRoll = GetRandomInt(1, 100);
        if (randomRoll > 8) return; // 8% chance
        k.Unit.AddItem(ITEM_CLOAK_FLAMES);
    }

    public static void RegisterDeathTrigger()
    {
        StanDeath.RegisterUnitEvent(NamedWolves.StanWolf.Unit, unitevent.Death);
        if (StanDeathActions != null) return;
        RegisterTurnInTrigger();
        StanDeathActions = StanDeath.AddAction(ErrorHandler.Wrap(() =>
        {
            var killer = @event.KillingUnit;
            if (killer == null) return;
            NamedWolves.StanWolf.Texttag?.Dispose();
            Utility.RemoveItemFromUnit(killer, ITEM_CLOAK_FLAMES);
            killer.AddItem(ITEM_BURNT_MEAT);
            Completed.Add(killer);
        }));
    }

    private static void RegisterTurnInTrigger()
    {
        Blizzard.TriggerRegisterUnitInRangeSimple(StanTurnIn, 200f, SpawnChampions.Stan2025);
        if (StanTurnInActions != null) return;
        StanTurnInActions = StanTurnIn.AddAction(ErrorHandler.Wrap(() =>
        {
            var unit = @event.Unit;
            var player = unit.Owner;
            if (!Completed.Contains(unit)) return;
            player.DisplayTimedTextTo(8.0f, $"Bedankt vriend, je moet slide eens proberen! (Thanks friend, you should try slide!)");
            Challenges.VioletWindwalk(player);
            Utility.RemoveItemFromUnit(unit, ITEM_BURNT_MEAT);
            Completed.Remove(unit);
        }));
    }
}
