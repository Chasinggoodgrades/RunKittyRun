using System.Collections.Generic;
using WCSharp.Api;

public static class Standard
{
    private static trigger KittyReachedLevelSix;
    private static trigger KittyReachedLevelTen;
    private const float ROUND_INTERMISSION = 10.0f;
    private const float ALERT_DURATION = 7.0f;
    private static List<player> HitLevel6;
    private static List<player> CanBuyRelics;

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
        RegisterLevelTriggers();
    }

    private static void RegisterLevelTriggers()
    {
        HitLevel6 = new List<player>();
        CanBuyRelics = new List<player>();
        RegisterLevelSixTrigger();
        RegisterLevelTenTrigger();
    }

    private static void RegisterLevelSixTrigger()
    {
        // Ultimate, Protection of the Ancients
        KittyReachedLevelSix = trigger.Create();
        Blizzard.TriggerRegisterAnyUnitEventBJ(KittyReachedLevelSix, playerunitevent.HeroLevel);
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
        Blizzard.TriggerRegisterAnyUnitEventBJ(KittyReachedLevelTen, playerunitevent.HeroLevel);
        KittyReachedLevelTen.AddAction(() =>
        {
            try
            {
                if (CanBuyRelics.Contains(@event.Unit.Owner)) return;
                if (@event.Unit.HeroLevel < Relic.RequiredLevel) return;
                CanBuyRelics.Add(@event.Unit.Owner);
                RelicUtil.EnableRelicBook(@event.Unit);
                RelicUtil.DisableRelicAbilities(@event.Unit);
                ProtectionOfAncients.SetProtectionOfAncientsLevel(@event.Unit);
                @event.Unit.Owner.DisplayTimedTextTo(ALERT_DURATION, $"{Colors.COLOR_TURQUOISE}You may now buy relics from the shop!{Colors.COLOR_RESET}");
            }
            catch (System.Exception e)
            {
                Logger.Warning($"Error in RegisterLevelTenTrigger {e.Message}");
            }
        });
    }
}
