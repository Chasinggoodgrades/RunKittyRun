using System;
using WCSharp.Api;
using static WCSharp.Api.Common;
public static class RelicUtil
{
    public static void DisableRelicBook(unit Unit) => Unit.DisableAbility(Constants.ABILITY_BOOK_OF_RELICS, true, true);

    public static void EnableRelicBook(unit Unit) => Unit.DisableAbility(Constants.ABILITY_BOOK_OF_RELICS, false, false);

    public static void DisableRelicAbilities(unit Unit)
    {
        Unit.DisableAbility(Constants.ABILITY_TAKE_EM_WITH_RING_ULTIMATE, false, true);
        Unit.DisableAbility(Constants.ABILITY_RING_OF_FROSTBITE_RING_ULTIMATE, false, true);
        Unit.DisableAbility(Constants.ABILITY_SUMMON_SHADOW_KITTY, false, true);
        Unit.DisableAbility(Constants.ABILITY_TRANSLOCATE, false, true);
    }

    public static void EnableRelicAbilities(unit Unit)
    {
        Unit.DisableAbility(Constants.ABILITY_TAKE_EM_WITH_RING_ULTIMATE, false, false);
        Unit.DisableAbility(Constants.ABILITY_RING_OF_FROSTBITE_RING_ULTIMATE, false, false);
        Unit.DisableAbility(Constants.ABILITY_SUMMON_SHADOW_KITTY, false, false);
        Unit.DisableAbility(Constants.ABILITY_TRANSLOCATE, false, false);
    }

    /// <summary>
    /// Technically does the job it's assigned to do, however it toggles the multiboard in the process. Should be fixed later. TODO:
    /// </summary>
    /// <param name="Unit"></param>
    public static void CloseRelicBook(unit Unit)
    {
        var player = Unit.Owner;
        if (!player.IsLocal) return;
        ForceUICancel();
    }

    public static void CloseRelicBook(player Player)
    {
        if (!Player.IsLocal) return;
        ForceUICancel();
    }

    /// <summary>
    /// 
    /// </summary>
    /// <param name="unit"></param>
    /// <param name="itemID"></param>
    /// <param name="abilityID"></param>
    public static void SetRelicCooldowns(unit unit, int itemID, int abilityID, float cooldown = 0)
    {
        // Get item from unit.. Drop it.. Set Cooldown of it, and set cooldown of ability on the unit to cooldown
        var item = Utility.UnitGetItem(unit, itemID);
        var itemAbility = item.GetAbility(abilityID);
        var unitAbility = unit.GetAbility(abilityID);
        float unitCooldown = BlzGetAbilityRealLevelField(unitAbility, ABILITY_RLF_COOLDOWN, 0);
        float itemCooldown = BlzGetAbilityRealLevelField(itemAbility, ABILITY_RLF_COOLDOWN, 0);

        cooldown = (cooldown == 0) ? Math.Min(unitCooldown, itemCooldown) : cooldown;
        unit.RemoveItem(item);
        unit.SetAbilityCooldownRemaining(abilityID, cooldown);
        unit.AddItem(item);
        unit.SetAbilityCooldownRemaining(abilityID, cooldown);
    }

    public static void SetAbilityCooldown(unit unit, int itemID, int abilityID, float cooldown)
    {
        var item = Utility.UnitGetItem(unit, itemID);
        var unitAbility = unit.GetAbility(abilityID);
        unit.RemoveItem(item);
        BlzSetAbilityRealLevelField(unitAbility, ABILITY_RLF_COOLDOWN, 0, cooldown);
        unit.AddItem(item);
        var itemAbility = item.GetAbility(abilityID);
        BlzSetAbilityRealLevelField(itemAbility, ABILITY_RLF_COOLDOWN, 0, cooldown);
    }
}