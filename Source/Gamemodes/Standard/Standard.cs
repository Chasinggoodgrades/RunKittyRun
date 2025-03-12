using System.Collections.Generic;
using WCSharp.Api;


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
        RoundManager.ROUND_INTERMISSION = Source.Program.Debug ? 0.0f : ROUND_INTERMISSION;
        Difficulty.Initialize();
        Windwalk.Initialize();
        SpawnChampions.Initialize();
        PlayerUpgrades.Initialize();
        RollerSkates.Initialize();
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
        Blizzard.TriggerRegisterAnyUnitEventBJ(KittyReachedLevelSix, playerunitevent.HeroLevel);
        _ = KittyReachedLevelSix.AddAction(() =>
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
        Blizzard.TriggerRegisterAnyUnitEventBJ(KittyReachedLevelTen, playerunitevent.HeroLevel);
        _ = KittyReachedLevelTen.AddAction(() =>
        {
            if (HitLevel10.Contains(@event.Unit.Owner)) return;
            if (@event.Unit.HeroLevel < 10) return;
            HitLevel10.Add(@event.Unit.Owner);
            RelicUtil.EnableRelicBook(@event.Unit);
            RelicUtil.DisableRelicAbilities(@event.Unit);
            _ = ProtectionOfAncients.SetProtectionOfAncientsLevel(@event.Unit);
            @event.Unit.Owner.DisplayTimedTextTo(ALERT_DURATION, $"{Colors.COLOR_YELLOW_ORANGE}You may now buy relics from the shop!|r");
        });
    }
}