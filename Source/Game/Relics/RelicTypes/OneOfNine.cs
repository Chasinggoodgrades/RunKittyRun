using Source;
using System;
using WCSharp.Api;
using static WCSharp.Api.Common;
public class OneOfNine : Relic
{
    public const int RelicItemID = Constants.ITEM_ONE_OF_NINE;
    private const int PreviousAbilityID = Constants.ABILITY_PROTECTION_OF_THE_ANCIENTS;
    private const int RelicAbilityID = Constants.ABILITY_PROTECTION_OF_THE_ANCIENTS_WITH_RELIC;
    private const int RelicCost = 650;
    public const string IconPath = "war3mapImported\\BTNSpell_Holy_BlessingOfProtection.blp";
    public OneOfNine() : base(
        "One of Nine",
        "A relic that grants the user a chance to dodge attacks.",
        RelicItemID,
        RelicCost,
        IconPath
        ) 
    { }

    public override void ApplyEffect(unit Unit)
    {
        Console.WriteLine("Starting Apply Effect");
        var player = Unit.Owner;
        var cooldown = GetOneOfNineCooldown(player);
        Unit.RemoveAbility(PreviousAbilityID);
        Unit.AddAbility(RelicAbilityID);
        Unit.SetAbilityCooldownRemaining(RelicAbilityID, cooldown);
        Console.WriteLine("End Apply Effect");
    }

    public override void RemoveEffect(unit Unit)
    {
        var player = Unit.Owner;
        var cooldown = GetOneOfNineCooldown(player);
        Unit.RemoveAbility(RelicAbilityID);
        Unit.AddAbility(PreviousAbilityID);
        Unit.SetAbilityCooldownRemaining(PreviousAbilityID, cooldown);
    }

    private static float GetOneOfNineCooldown(player Player)
    {
        var kitty = Globals.ALL_KITTIES[Player].Unit;
        var noRelic = Constants.ABILITY_PROTECTION_OF_THE_ANCIENTS;
        var relic = Constants.ABILITY_PROTECTION_OF_THE_ANCIENTS_WITH_RELIC;
        if (kitty.GetAbilityCooldownRemaining(noRelic) > 0.0f)
            return kitty.GetAbilityCooldownRemaining(noRelic);
        return kitty.GetAbilityCooldownRemaining(relic);
    }

    public static bool OneOfNineEffect(player Player)
    {
        var kitty = Globals.ALL_KITTIES[Player];
        if (!Utility.UnitHasItem(kitty.Unit, Constants.ITEM_ONE_OF_NINE)) return false;
        if (Program.Debug) Console.WriteLine("One of Nine Effect");
        if (kitty.Unit.GetAbilityCooldownRemaining(Constants.ABILITY_PROTECTION_OF_THE_ANCIENTS_WITH_RELIC) <= 0.0f)
        {
            IssueImmediateOrder(kitty.Unit, "divineshield");
            return true;
        }
        return false;
    }
}