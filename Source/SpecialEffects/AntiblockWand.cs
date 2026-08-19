using System;
using WCSharp.Api;
using WCSharp.Shared.Extensions;

public static class AntiblockWand
{
    private static trigger CastEvent;
    private static int AbilityID;
    private static int AbilitySpellID;
    private static float Radius;

    /// <summary>
    /// Register's antiblock wand cast's. Only works in standard mode.
    /// </summary>
    public static void Initialize()
    {
        AbilityID = Constants.ABILITY_ANTI_BLOCK_WAND_ITEM;
        AbilitySpellID = Constants.ABILITY_ANTIBLOCK_SPELL;
        Radius = 250.0f;
        CastEvent = RegisterCastEvents();
        CreateAntiblockSpell();
    }

    public static void CreateAntiblockSpell()
    {
        //if (Gamemode.CurrentGameMode == GameMode.Solo) return;
        AddAntiblockAbility();
    }

    private static void AddAntiblockAbility()
    {
        foreach (var kitty in Globals.ALL_KITTIES_LIST)
        {
            kitty.Unit.AddAbility(AbilitySpellID);
        }
    }

    private static trigger RegisterCastEvents()
    {
        var Trigger = trigger.Create();
        foreach (var player in Globals.ALL_PLAYERS)
            Trigger.RegisterPlayerUnitEvent(player, playerunitevent.SpellCast);
        Trigger.AddAction(SpellActions);
        return Trigger;
    }

    private static void SpellActions()
    {
        if (@event.SpellAbilityId != AbilityID && @event.SpellAbilityId != AbilitySpellID) return;
        var unit =  @event.Unit;
        var location = @event.SpellTargetLoc;
        var wolvesInArea = group.Create();
        wolvesInArea.EnumUnitsInRange(location.X, location.Y, Radius, null);
        var list = wolvesInArea.ToList();
        foreach (var wolf in list)
        {
            if (wolf.UnitType != Wolf.WOLF_MODEL) continue;
            if (NamedWolves.DNTNamedWolves.Contains(Globals.ALL_WOLVES[wolf])) continue;
            var wolfUnit = Globals.ALL_WOLVES[wolf];
            wolfUnit.StartWandering(true);
        }

        GC.RemoveGroup(ref wolvesInArea);
        GC.RemoveList(ref list);
        location.Dispose();
        Utility.SimpleTimer(0.10f, () => unit.IssueOrder(WolfPoint.StopOrderID));
    }
}
