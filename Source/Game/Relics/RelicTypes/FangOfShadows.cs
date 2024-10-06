using System;
using WCSharp.Api;
using static WCSharp.Api.Common;
public class FangOfShadows : Relic
{
    public const int RelicItemID = Constants.ITEM_FANG_OF_SHADOWS;
    private const int RelicAbilityID = Constants.ABILITY_SUMMON_SHADOW_KITTY;
    private static float SHADOW_KITTY_SUMMON_DURATION = 75.0f;
    private trigger Trigger;
    public FangOfShadows() : base(
        "Fang of Shadows",
        "Summons a shadow kitty that deals damage to enemies.",
        RelicItemID)
    {
    }

    public override void ApplyEffect(unit Unit)
    {
        Trigger = CreateTrigger();
        TriggerRegisterUnitEvent(Trigger, Unit, EVENT_UNIT_SPELL_EFFECT);
        TriggerAddCondition(Trigger, Condition(() => GetSpellAbilityId() == RelicAbilityID));
        TriggerAddAction(Trigger, () => SummonShadowKitty(GetOwningPlayer(Unit)));
        Unit.AddAbility(RelicAbilityID);
    }

    public override void RemoveEffect(unit Unit)
    {
        Unit.RemoveAbility(RelicAbilityID);
    }

    private static void SummonShadowKitty(player Player)
    {
        Console.WriteLine("Fang of Shadows");
        var sk = ShadowKitty.ALL_SHADOWKITTIES[Player];
        sk.SummonShadowKitty();
        Utility.SimpleTimer(SHADOW_KITTY_SUMMON_DURATION, () => sk.KillShadowKitty());
    }
}