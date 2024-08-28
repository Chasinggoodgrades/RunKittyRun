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
        KittyReachedLevelSix = CreateTrigger();
        foreach (var kitty in Globals.ALL_KITTIES.Values)
            TriggerRegisterUnitEvent(KittyReachedLevelSix, kitty.Unit, EVENT_UNIT_HERO_LEVEL);
        KittyReachedLevelSix.AddAction(() =>
        {
            if (GetHeroLevel(GetTriggerUnit()) == 6) AddProtectionOfAncients();
        });
    }

    private static void RegisterLevelTenTrigger()
    {
        // Ability to Purchase Relics
        KittyReachedLevelTen = CreateTrigger();
        foreach(var kitty in Globals.ALL_KITTIES.Values)
            TriggerRegisterUnitEvent(KittyReachedLevelTen, kitty.Unit, EVENT_UNIT_HERO_LEVEL);
        KittyReachedLevelTen.AddAction(() =>
        {
            if (GetHeroLevel(GetTriggerUnit()) == 10)
            {
                var player = GetOwningPlayer(GetTriggerUnit());
                var kitty = Globals.ALL_KITTIES[player];
                kitty.CanBuyRelic = true;
                player.DisplayTimedTextTo(ALERT_DURATION, $"{Colors.COLOR_YELLOW_ORANGE}Your skills have grown. Visit my shop at the top right for some special wares.|r");
            }
        });
    }

    private static void AddProtectionOfAncients()
    {
        var player = GetOwningPlayer(GetTriggerUnit());
        var kitty = GetTriggerUnit();
        kitty.AddAbility(Constants.ABILITY_PROTECTION_OF_THE_ANCIENTS);
        player.DisplayTimedTextTo(ALERT_DURATION, $"{Colors.COLOR_YELLOW_ORANGE}Congratulations on level 6! You've gained a new ability!|r");

    }
}