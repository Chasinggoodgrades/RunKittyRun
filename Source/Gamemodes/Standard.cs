using System;
using WCSharp.Api;
using static WCSharp.Api.Common;


public static class Standard
{
    private static trigger KittyReachedLevelSix;
    private static trigger KittyReachedLevelTen;
    private const float ROUND_INTERMISSION = 10.0f;
    private const float ALERT_DURATION = 7.0f;
    public static void Initialize()
    {
        RoundManager.ROUND_INTERMISSION = ROUND_INTERMISSION;
        Difficulty.Initialize();
        Windwalk.Initialize();
        SpawnChampions.Initialize();
        EasterEggManager.LoadEasterEggs();
        Utility.SimpleTimer(2.0f, () => RegisterLevelTriggers());
    }

    private static void RegisterLevelTriggers()
    {
        RegisterLevelSixTrigger();
        RegisterLevelTenTrigger();
    }

    private static void RegisterLevelSixTrigger()
    {
        // Ultimate, Protection of the Ancients
        KittyReachedLevelSix = trigger.Create();
        foreach (var kitty in Globals.ALL_KITTIES.Values)
            TriggerRegisterUnitEvent(KittyReachedLevelSix, kitty.Unit, unitevent.HeroLevel);
        KittyReachedLevelSix.AddAction(() =>
        {
            if (@event.Unit.HeroLevel == 6) AddProtectionOfAncients();
        });
    }

    private static void RegisterLevelTenTrigger()
    {
        // Ability to Purchase Relics
        KittyReachedLevelTen = trigger.Create();
        foreach(var kitty in Globals.ALL_KITTIES.Values)
            TriggerRegisterUnitEvent(KittyReachedLevelTen, kitty.Unit, unitevent.HeroLevel);
        KittyReachedLevelTen.AddAction(() =>
        {
            var unit = @event.Unit;
            if (unit.HeroLevel == 10)
            {
                var player = unit.Owner;
                Relic.EnableRelicBook(unit);
                player.DisplayTimedTextTo(ALERT_DURATION, $"{Colors.COLOR_YELLOW_ORANGE}Your may now buy relics from the shop!|r");
            }
        });
    }

    private static void AddProtectionOfAncients()
    {
        var kitty = @event.Unit;
        var player = kitty.Owner;
        kitty.AddAbility(Constants.ABILITY_PROTECTION_OF_THE_ANCIENTS);
        player.DisplayTimedTextTo(ALERT_DURATION, $"{Colors.COLOR_YELLOW_ORANGE}Congratulations on level 6! You've gained a new ability!|r");

    }
}