using System;
using WCSharp.Api;
using static System.Reflection.Metadata.BlobBuilder;
using static WCSharp.Api.Common;
public static class UrnSoul
{
    private static rect[] UrnRegions { get; set; }
    private static unit UrnGhostUnit { get; set; }
    private static int UnitType { get; set; } = Constants.UNIT_ASTRAL_KITTY;
    private static string Name = "|cff8080ff?|r|cff6666ff?|r|cff4d4dff?|r|cff3333ff?|r|cff1a1aff?|r|cff0000ff?|r";
    private static trigger PeriodicTrigger { get; set; }
    private static trigger UrnUsageTrigger { get; set; }
    private static trigger InRangeTrigger { get; set; }
    private static float RotationTime { get; set; } = 60.0f;
    private static float InRangeDistance { get; set; } = 150.0f;
    private static int RotationIndex { get; set; } = 0;
    private static region StartEventRegion { get; set; }

    public static void Initialize()
    {
        RegisterRegions();
        UrnGhostUnit = UnitCreation();
        PeriodicTrigger = RegisterPeriodicTrigger();
        UrnUsageTrigger = RegisterUrnUsage();
        InRangeTrigger = RegisterInRangeEvent();
    }

    private static unit UnitCreation()
    {
        var x = UrnRegions[0].CenterX;
        var y = UrnRegions[0].CenterY;
        var u = unit.Create(player.NeutralPassive, UnitType, x, y, 0);
        u.HeroName = Name;
        u.SetPathing(false); // Disable Collision 
        u.AddAbility(FourCC("Agho")); // Ghost
        u.AddAbility(FourCC("Augh")); // Shade
        return u;
    }

    private static void RegisterRegions()
    {
        UrnRegions = new rect[4]; // 4 premade regions from editor / constants
        UrnRegions[0] = Regions.UrnSoulRegion1.Rect;
        UrnRegions[1] = Regions.UrnSoulRegion2.Rect;
        UrnRegions[2] = Regions.UrnSoulRegion3.Rect;
        UrnRegions[3] = Regions.UrnSoulRegion4.Rect;
    }

    private static trigger RegisterPeriodicTrigger()
    {
        var trig = trigger.Create();
        trig.RegisterTimerEvent(RotationTime, true);
        trig.AddAction(() => RotationActions());
        return trig;
    }

    private static void RotationActions()
    {
        RotationIndex = (RotationIndex + 1) % 4;
        var x = UrnRegions[RotationIndex].CenterX;
        var y = UrnRegions[RotationIndex].CenterY;
        UrnGhostUnit.IssueOrder("move", x, y);
    }

    private static trigger RegisterUrnUsage()
    {
        var trig = trigger.Create();
        foreach (var player in Globals.ALL_PLAYERS)
            trig.RegisterPlayerUnitEvent(player, playerunitevent.UseItem,
                Filter(() => GetFilterItem().TypeId == Constants.ITEM_URN_OF_A_BROKEN_SOUL));
        trig.AddAction(() => UrnUsageActions());
        return trig;
    }

    private static void UrnUsageActions()
    {
        var item = @event.ManipulatedItem;
        var player = @event.Player;
        var unit = @event.Unit;
        StartEventRegion = Regions.Urn_Soul_Region.Region;

        if(!StartEventRegion.Contains(unit)) return;

        // DRAMATIC EFFECT !!!! just writing shit to write it at this point lmao
        var e = effect.Create("Doodads\\Cinematic\\Lightningbolt\\Lightningbolt.mdl", unit.X, unit.Y);
        e.Dispose();

        // Quest text.. 4 sec delay for next part.
         player.DisplayTimedTextTo(7.0f, $"{Colors.COLOR_YELLOW}As the dust disappears you notice a faint writing above the brazier...|r");
        Utility.SimpleTimer(4.0f, () => player.DisplayTimedTextTo(15.0f,
            $"{Colors.COLOR_LAVENDER}The lost soul you seek drifts, untethered and forlorn. Seek them amidst the ever-twisting shadows, and rekindle their essence with the enigmatic touch of an energy stone, a veiled orb of secrets, and the elixir whispered of healing properties..|r"));

        // Apply next stage to the item.
        item.RemoveAbility(FourCC("AIda")); // removes temp armory bonus
        item.AddAbility(FourCC("AHta")); // adds reveal ability
    }

    private static trigger RegisterInRangeEvent()
    {
        var trig = trigger.Create();
        trig.RegisterUnitInRange(UrnGhostUnit, InRangeDistance, 
            Filter(() => GetFilterUnit().UnitType == Constants.UNIT_KITTY));
        trig.AddAction(() => InRangeActions());
        return trig;
    }

    private static void InRangeActions()
    {
        var unit = @event.Unit;

        var urn = Constants.ITEM_URN_OF_A_BROKEN_SOUL;
        var orb = Constants.ITEM_ORB_OF_MYSTERIES;
        var energyStone = Constants.ITEM_ENERGY_STONE;
        var water = Constants.ITEM_HEALING_WATER;

        // Must have these items...
        if (!Utility.UnitHasItem(unit, urn)) return;
        if (!Utility.UnitHasItem(unit, orb)) return;
        if (!Utility.UnitHasItem(unit, energyStone)) return;
        if (!Utility.UnitHasItem(unit, water)) return;

        var player = unit.Owner;
        player.DisplayTimedTextTo(10.0f, 
            $"|r|cff8080ffRestless Soul:|r |cffc878c8Could it be... Is this the moment I've yearned for? Have you come to release me from this eternal confinement? I can feel the life force coursing through my veins... AHHH...|r");

        var e = effect.Create("\"Abilities\\\\Spells\\\\Human\\\\Resurrect\\\\ResurrectCaster.mdl\"", unit, "origin");
        Utility.SimpleTimer(1.0f, () => e.Dispose());

        // Remove Items
        Utility.RemoveItemFromUnit(unit, urn);
        Utility.RemoveItemFromUnit(unit, orb);
        Utility.RemoveItemFromUnit(unit, energyStone);
        Utility.RemoveItemFromUnit(unit, water);

        AwardManager.GiveReward(unit.Owner, Awards.WW_Blue);
    }


}