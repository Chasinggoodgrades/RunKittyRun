class AntiblockWand {
    private static CastEvent: trigger
    private static AbilityID: number
    private static Radius: number

    /// <summary>
    /// Register's antiblock wand cast's. Only works in standard mode.
    /// </summary>
    public static Initialize() {
        if (Gamemode.CurrentGameMode != GameMode.Standard) return
        AbilityID = Constants.ABILITY_ANTI_BLOCK_WAND_ITEM
        Radius = 250.0
        CastEvent = RegisterCastEvents()
    }

    private static RegisterCastEvents(): trigger {
        let Trigger = CreateTrigger()
        for (let player in Globals.ALL_PLAYERS) Trigger.RegisterPlayerUnitEvent(player, playerunitevent.SpellCast)
        Trigger.AddAction(SpellActions)
        return Trigger
    }

    private static SpellActions() {
        if (GetSpellAbilityId() != AbilityID) return
        let location = GetSpellTargetLoc()
        let wolvesInArea = group.Create()
        wolvesInArea.EnumUnitsInRange(location.X, location.Y, Radius, null)
        let list = wolvesInArea.ToList()
        for (let wolf in list) {
            if (wolf.UnitType != Wolf.WOLF_MODEL) continue
            if (NamedWolves.DNTNamedWolves.Contains(Globals.ALL_WOLVES[wolf])) continue
            let wolfUnit = Globals.ALL_WOLVES[wolf]
            wolfUnit.StartWandering(true)
        }

        GC.RemoveGroup(wolvesInArea) // TODO; Cleanup:         GC.RemoveGroup(ref wolvesInArea);
        GC.RemoveList(list) // TODO; Cleanup:         GC.RemoveList(ref list);
        location.Dispose()
    }
}
