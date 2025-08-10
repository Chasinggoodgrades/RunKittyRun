class RelicUtil {
    public static DisableRelicBook(Unit: unit) {
        return Unit.DisableAbility(Constants.ABILITY_BOOK_OF_RELICS, true, true)
    }

    public static EnableRelicBook(Unit: unit) {
        return Unit.DisableAbility(Constants.ABILITY_BOOK_OF_RELICS, false, false)
    }

    public static DisableRelicAbilities(Unit: unit) {
        Unit.DisableAbility(Constants.ABILITY_TAKE_EM_WITH_RING_ULTIMATE, false, true)
        Unit.DisableAbility(Constants.ABILITY_RING_OF_FROSTBITE_RING_ULTIMATE, false, true)
        Unit.DisableAbility(Constants.ABILITY_SUMMON_SHADOW_KITTY, false, true)
        Unit.DisableAbility(Constants.ABILITY_TRANSLOCATE, false, true)
    }

    public static EnableRelicAbilities(Unit: unit) {
        Unit.DisableAbility(Constants.ABILITY_TAKE_EM_WITH_RING_ULTIMATE, false, false)
        Unit.DisableAbility(Constants.ABILITY_RING_OF_FROSTBITE_RING_ULTIMATE, false, false)
        Unit.DisableAbility(Constants.ABILITY_SUMMON_SHADOW_KITTY, false, false)
        Unit.DisableAbility(Constants.ABILITY_TRANSLOCATE, false, false)
    }

    /// <summary>
    /// Technically does the job it's assigned to do, however it toggles the multiboard in the process. Should be fixed later. TODO:
    /// </summary>
    /// <param name="Unit"></param>
    public static CloseRelicBook(Unit: unit) {
        let player = Unit.Owner
        if (!player.IsLocal) return
        ForceUICancel()
    }

    public static CloseRelicBook(Player: player) {
        if (!Player.IsLocal) return
        ForceUICancel()
    }

    /// <summary>
    ///
    /// </summary>
    /// <param name="unit"></param>
    /// <param name="itemID"></param>
    /// <param name="abilityID"></param>
    public static SetRelicCooldowns(unit: unit, itemID: number, abilityID: number, cooldown: number = 0) {
        // Get item from unit.. Drop it.. Set Cooldown of it, and set cooldown of ability on the unit to cooldown
        let item = Utility.UnitGetItem(unit, itemID)
        let itemAbility = item.GetAbility(abilityID)
        let unitAbility = unit.GetAbility(abilityID)
        let itemSlot = Utility.GetSlotOfItem(unit, itemID)

        let unitCooldown: number = BlzGetAbilityRealLevelField(unitAbility, ABILITY_RLF_COOLDOWN, 0)
        let itemCooldown: number = BlzGetAbilityRealLevelField(itemAbility, ABILITY_RLF_COOLDOWN, 0)

        cooldown = cooldown == 0 ? Math.Min(unitCooldown, itemCooldown) : cooldown
        if (Globals.ALL_KITTIES[unit.Owner].Alive) unit.RemoveItem(item)
        unit.SetAbilityCooldownRemaining(abilityID, cooldown)
        unit.AddItem(item)
        unit.DropItem(item, itemSlot)
        unit.SetAbilityCooldownRemaining(abilityID, cooldown)
    }

    public static SetAbilityCooldown(unit: unit, itemID: number, abilityID: number, cooldown: number) {
        let item = Utility.UnitGetItem(unit, itemID)
        let itemSlot = Utility.GetSlotOfItem(unit, itemID)
        let unitAbility = unit.GetAbility(abilityID)
        if (Globals.ALL_KITTIES[unit.Owner].Alive) unit.RemoveItem(item)
        BlzSetAbilityRealLevelField(unitAbility, ABILITY_RLF_COOLDOWN, 0, cooldown)
        unit.AddItem(item)
        unit.DropItem(item, itemSlot)
        let itemAbility = item.GetAbility(abilityID)
        BlzSetAbilityRealLevelField(itemAbility, ABILITY_RLF_COOLDOWN, 0, cooldown)
    }
}
