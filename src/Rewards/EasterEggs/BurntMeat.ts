

class BurntMeat
{
    private static StanDeath: trigger = trigger.Create();
    private static StanTurnIn: trigger = trigger.Create();
    private static StanDeathActions: triggeraction;
    private static StanTurnInActions: triggeraction;
    private ITEM_CLOAK_FLAMES: number = Constants.ITEM_CLOAK_OF_FLAMES;
    private ITEM_BURNT_MEAT: number = Constants.ITEM_WOLF_MEAT;
    private static List<unit> Completed = new List<unit>();

    public static FlamesDropChance(k: Kitty)
    {
        let randomRoll = GetRandomInt(1, 100);
        if (randomRoll > 8) return; // 8% chance
        k.Unit.AddItem(ITEM_CLOAK_FLAMES);
    }

    public static RegisterDeathTrigger()
    {
        StanDeath.RegisterUnitEvent(NamedWolves.StanWolf.Unit, unitevent.Death);
        if (StanDeathActions != null) return;
        RegisterTurnInTrigger();
        StanDeathActions = StanDeath.AddAction(ErrorHandler.Wrap(() =>
        {
            let killer = @event.KillingUnit;
            if (killer == null) return;
            NamedWolves.StanWolf.Texttag?.Dispose();
            Utility.RemoveItemFromUnit(killer, ITEM_CLOAK_FLAMES);
            killer.AddItem(ITEM_BURNT_MEAT);
            Completed.Add(killer);
        }));
    }

    private static RegisterTurnInTrigger()
    {
        Blizzard.TriggerRegisterUnitInRangeSimple(StanTurnIn, 200, SpawnChampions.Stan2025);
        if (StanTurnInActions != null) return;
        StanTurnInActions = StanTurnIn.AddAction(ErrorHandler.Wrap(() =>
        {
            let unit = GetTriggerUnit();
            let player = unit.Owner;
            if (!Completed.Contains(unit)) return;
            player.DisplayTimedTextTo(8.0, "vriend: Bedankt, moet: slide: eens: proberen: je! (friend: Thanks, should: try: slide: you!)");
            Challenges.VioletWindwalk(player);
            Utility.RemoveItemFromUnit(unit, ITEM_BURNT_MEAT);
            Completed.Remove(unit);
        }));
    }
}
