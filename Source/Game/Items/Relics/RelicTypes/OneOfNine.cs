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
    private static new string IconPath = "war3mapImported\\BTNSpell_Holy_BlessingOfProtection.blp";
    public OneOfNine() : base(
        $"|cffff4500One of Nine|r",
        $"Autocasts Protection of the Ancients if it is available. {Colors.COLOR_LIGHTBLUE}(Passive)|r",
        RelicItemID,
        RelicCost,
        IconPath
        ) 
    {
        Upgrades.Add(new RelicUpgrade(0, $"Cooldown of your ultimate is reduced by an additional 3 seconds per upgrade level.", 15, 800));
        Upgrades.Add(new RelicUpgrade(1, $"Your ultimate no longer costs mana.", 20, 1000));
    }

    public override void ApplyEffect(unit Unit)
    {
        var player = Unit.Owner;
        var cooldown = GetOneOfNineCooldown(player);
        Unit.RemoveAbility(PreviousAbilityID);
        Unit.AddAbility(RelicAbilityID);
        var abilityLevel = ProtectionOfAncients.SetProtectionOfAncientsLevel(Unit);
        Unit.SetAbilityCooldownRemaining(RelicAbilityID, cooldown);
        RemoveManaCost(Unit, abilityLevel);
    }

    public override void RemoveEffect(unit Unit)
    {
        var player = Unit.Owner;
        var cooldown = GetOneOfNineCooldown(player);
        Unit.RemoveAbility(RelicAbilityID);
        Unit.AddAbility(PreviousAbilityID);
        ProtectionOfAncients.SetProtectionOfAncientsLevel(Unit);
        Unit.SetAbilityCooldownRemaining(PreviousAbilityID, cooldown);
    }

    public static float GetOneOfNineCooldown(player Player)
    {
        var kitty = Globals.ALL_KITTIES[Player].Unit;
        var noRelic = Constants.ABILITY_PROTECTION_OF_THE_ANCIENTS;
        var relic = Constants.ABILITY_PROTECTION_OF_THE_ANCIENTS_WITH_RELIC;
        var reduction = GetOneOfNineReduction(Player);

        // remaining cooldown depending on relic or no relic 
        float cooldown = kitty.GetAbilityCooldownRemaining(noRelic) > 0.0f
            ? kitty.GetAbilityCooldownRemaining(noRelic)
            : kitty.GetAbilityCooldownRemaining(relic);

        cooldown -= reduction;

        return Math.Max(0.0f, cooldown); // gotta make sure its not negative
    }


    public static float GetOneOfNineReduction(player Player)
    {
        return PlayerUpgrades.GetPlayerUpgrades(Player).GetUpgradeLevel(typeof(OneOfNine)) * 3.0f;
    }

    /// <summary>
    /// Upgrade Level 2: Removes mana cost from the ability.
    /// </summary>
    /// <param name="Unit"></param>
    /// <param name="abilityLevel"></param>
    private void RemoveManaCost(unit Unit, int abilityLevel)
    {
        var upgradeLevel = PlayerUpgrades.GetPlayerUpgrades(Unit.Owner).GetUpgradeLevel(GetType());
        if (upgradeLevel < 2) return;
        var ability = Unit.GetAbility(RelicAbilityID);
        Unit.SetAbilityManaCost(RelicAbilityID, abilityLevel - 1, 0);
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