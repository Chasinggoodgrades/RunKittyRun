using System;
using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;


public static class Standard
{
    private static trigger KittyReachedLevelSix;
    private static trigger KittyReachedLevelTen;
    private const float ROUND_INTERMISSION = 10.0f;
    private const float ALERT_DURATION = 7.0f;
    private static List<player> HitLevel6;
    private static List<player> HitLevel10;
    public static void Initialize()
    {
        RoundManager.ROUND_INTERMISSION = ROUND_INTERMISSION;
        Difficulty.Initialize();
        Windwalk.Initialize();
        SpawnChampions.Initialize();
        EasterEggManager.LoadEasterEggs();
        AntiblockWand.Initialize();
        Utility.SimpleTimer(2.0f, () => RegisterLevelTriggers());
    }

    private static void RegisterLevelTriggers()
    {
        HitLevel6 = new List<player>();
        HitLevel10 = new List<player>();
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
            if (HitLevel6.Contains(@event.Unit.Owner)) return;
            if (@event.Unit.HeroLevel < 6) return;
            HitLevel6.Add(@event.Unit.Owner);
            ProtectionOfAncients.AddProtectionOfAncients(@event.Unit);
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
            if (HitLevel10.Contains(@event.Unit.Owner)) return;
            if (@event.Unit.HeroLevel < 10) return;
            HitLevel10.Add(@event.Unit.Owner);
            Relic.EnableRelicBook(@event.Unit);
            Relic.DisableRelicAbilities(@event.Unit);
            @event.Unit.Owner.DisplayTimedTextTo(ALERT_DURATION, $"{Colors.COLOR_YELLOW_ORANGE}Your may now buy relics from the shop!|r");
        });
    }
}