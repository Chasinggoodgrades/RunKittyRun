using System;
using WCSharp.Api;
using static WCSharp.Api.Common;
public class FangOfShadows : Relic
{
    public const int RelicItemID = Constants.ITEM_FANG_OF_SHADOWS;
    private const int RelicAbilityID = Constants.ABILITY_SUMMON_SHADOW_KITTY;
    private const int TeleportAbilityID = Constants.ABILITY_APPEAR_AT_SHADOWKITTY;
    private const int RelicCost = 650;
    private static new string IconPath = "ReplaceableTextures\\CommandButtons\\BTNRingVioletSpider.blp";
    private static float SHADOW_KITTY_SUMMON_DURATION = 75.0f;
    private trigger SummonTrigger = trigger.Create();
    private trigger TeleTrigger = trigger.Create();
    public FangOfShadows() : base(
        $"{Colors.COLOR_PURPLE}Fang of Shadows",
        $"Ability to summon a shadowy image for {Colors.COLOR_CYAN}{(int)SHADOW_KITTY_SUMMON_DURATION} seconds|r or until death. Teleport to the illusion at will.|r " +
        $"{Colors.COLOR_ORANGE}(Active)|r {Colors.COLOR_LIGHTBLUE}(4min) (Cooldown reduced by 50% at safezones.)|r",
        RelicItemID,
        RelicCost,
        IconPath
        )
    {
    }

    public override void ApplyEffect(unit Unit)
    {
        RegisterTriggers(Unit);
        Unit.DisableAbility(RelicAbilityID, false, false);
    }

    public override void RemoveEffect(unit Unit)
    {
        DeregisterTriggers();
        Unit.DisableAbility(RelicAbilityID, true, true);
    }

    private void RegisterTriggers(unit Unit)
    {
        SummonTrigger.RegisterUnitEvent(Unit, unitevent.SpellCast);
        SummonTrigger.AddCondition(Condition(() => @event.SpellAbilityId == RelicAbilityID));
        SummonTrigger.AddAction(() => SummonShadowKitty(Unit.Owner));

        TeleTrigger.RegisterUnitEvent(Unit, unitevent.SpellCast);
        TeleTrigger.AddCondition(Condition(() => @event.SpellAbilityId == TeleportAbilityID));
        TeleTrigger.AddAction(() => TeleportToShadowKitty());
    }

    private void DeregisterTriggers()
    {
        SummonTrigger.Dispose();
        SummonTrigger = null;
        TeleTrigger.Dispose();
        TeleTrigger = null;
    }

    private static void SummonShadowKitty(player Player)
    {
        Console.WriteLine("Fang of Shadows");
        var sk = ShadowKitty.ALL_SHADOWKITTIES[Player];
        sk.SummonShadowKitty();
        Utility.SimpleTimer(SHADOW_KITTY_SUMMON_DURATION, () => sk.KillShadowKitty());
    }

    private static void TeleportToShadowKitty()
    {
        var sk = ShadowKitty.ALL_SHADOWKITTIES[@event.Player];
        sk.TeleportToShadowKitty();
    }
}