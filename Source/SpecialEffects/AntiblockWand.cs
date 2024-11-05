using System;
using WCSharp.Api;
using WCSharp.Shared.Extensions;
public static class AntiblockWand
{
    private static trigger CastEvent;
    private static int AbilityID;
    private static float Radius;

    /// <summary>
    /// Register's antiblock wand cast's. Only works in standard mode.
    /// </summary>
    public static void Initialize()
    {
        if (Gamemode.CurrentGameMode != "Standard") return;
        AbilityID = Constants.ABILITY_ANTI_BLOCK_WAND_ITEM;
        Radius = 250.0f;
        CastEvent = RegisterCastEvents();
    }

    private static trigger RegisterCastEvents()
    {
        var Trigger = trigger.Create();
        foreach(var player in Globals.ALL_PLAYERS)
            Trigger.RegisterPlayerUnitEvent(player, playerunitevent.SpellCast);
        Trigger.AddAction(SpellActions);
        return Trigger;
    }


    private static void SpellActions()
    {
        if (@event.SpellAbilityId != AbilityID) return;
        var location = @event.SpellTargetLoc;
        var wolvesInArea = group.Create();
        Console.WriteLine("Antiblock wand casted");
        wolvesInArea.EnumUnitsInRange(location.X, location.Y, Radius, null);
        var list = wolvesInArea.ToList();
        foreach (var wolf in list)
        {
            if (wolf.UnitType != Wolf.WOLF_MODEL) continue;
            var wolfUnit = Globals.ALL_WOLVES[wolf];
            Console.WriteLine($"Wolf {wolfUnit.Unit.Name} moved");
            wolfUnit.WolfMove();
        }


        wolvesInArea.Dispose();
        list.Clear();
        location.Dispose();
    }
}