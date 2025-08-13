export class AntiblockWand {
    private static CastEvent: Trigger
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

    private static RegisterCastEvents(): Trigger {
        let Trigger = Trigger.create()!
        for (let player of Globals.ALL_PLAYERS) Trigger.registerPlayerUnitEvent(player, EVENT_PLAYER_UNIT_SPELL_CAST)
        Trigger.addAction(SpellActions)
        return Trigger
    }

    private static SpellActions() {
        if (GetSpellAbilityId() != AbilityID) return
        let location = GetSpellTargetLoc()
        let wolvesInArea = Group.create()!
        wolvesInArea.enumUnitsInRange(location.x, location.y, Radius, null)
        let list = wolvesInArea.ToList()
        for (let wolf in list) {
            if (wolf.typeId != Wolf.WOLF_MODEL) continue
            if (NamedWolves.DNTNamedWolves.includes(Globals.ALL_WOLVES[wolf])) continue
            let wolfUnit = Globals.ALL_WOLVES[wolf]
            wolfUnit.StartWandering(true)
        }

        GC.RemoveGroup(wolvesInArea) // TODO; Cleanup:         GC.RemoveGroup(ref wolvesInArea);
        GC.RemoveList(list) // TODO; Cleanup:         GC.RemoveList(ref list);
        location.dispose()
    }
}
