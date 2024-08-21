using Source;
using System;
using System.Collections.Generic;
using WCSharp.Api;
using WCSharp.Shared.Extensions;
using static WCSharp.Api.Common;

public static class RelicEffects
{
    private static trigger RelicUsageTrigger;
    private static List<int> RelicAbilities;
    public static void Initialize()
    {
        if (Gamemode.CurrentGameMode != "Standard") return;
        RegisterEvents();
        RegisterAbilities();
    }

    private static void RegisterEvents()
    {
        RelicUsageTrigger = CreateTrigger();
        foreach (var player in Globals.ALL_PLAYERS)
            TriggerRegisterPlayerUnitEvent(RelicUsageTrigger, player, EVENT_PLAYER_UNIT_SPELL_CAST, null);
        TriggerAddAction(RelicUsageTrigger, HandleRelicUsage(GetTriggerPlayer()));
    }

    private static void RegisterAbilities()
    {
        // Active Ability Relics, add to this list.
        RelicAbilities = new List<int>
        {
            Constants.ABILITY_TAKE_EM_WITH_RING_ULTIMATE,
            Constants.ABILITY_SUMMON_SHADOW_KITTY,
            Constants.ABILITY_RING_OF_FROSTBITE_RING_ULTIMATE,
        };
    }

    public static void ApplyRelicEffect(player Player, item Item)
    {
        switch (Item.TypeId)
        {
            case Constants.ITEM_AMULET_OF_EVASIVENESS:
                AmuletOfEvasiveness(Player, false);
                break;
            case Constants.ITEM_BEACON_OF_UNITED_LIFEFORCE:
                BeaconOfUnitedLifeforce(Player, false);
                break;
            case Constants.ITEM_ONE_OF_NINE:
                OneOfNine(Player, false);
                break;
        }
    }

    public static void RemoveRelicEffect(player Player, item Item)
    {
        switch (Item.TypeId)
        {
            case Constants.ITEM_AMULET_OF_EVASIVENESS:
                AmuletOfEvasiveness(Player, true);
                break;
            case Constants.ITEM_BEACON_OF_UNITED_LIFEFORCE:
                BeaconOfUnitedLifeforce(Player, true);
                break;
            case Constants.ITEM_ONE_OF_NINE:
                OneOfNine(Player, true);
                break;
        }
    }

    private static Action HandleRelicUsage(player Player)
    {
        return () =>
        {
            var spellCast = GetSpellAbilityId();
            if (!RelicAbilities.Contains(spellCast)) return;
            switch (spellCast)
            {
                case Constants.ABILITY_TAKE_EM_WITH_RING_ULTIMATE:
                    var pointedLocation = GetSpellTargetLoc();
                    SacredRingOfSummoning(Player, pointedLocation);
                    break;
                case Constants.ABILITY_SUMMON_SHADOW_KITTY:
                    FangOfShadows(Player);
                    break;
                case Constants.ABILITY_RING_OF_FROSTBITE_RING_ULTIMATE:
                    var freezeLocation = GetSpellTargetLoc();
                    RelicOnUse.FrostbiteRing(freezeLocation);
                    break;
            }
        };
    }

    private static void SacredRingOfSummoning(player Player, location targetedPoint)
    {


        targetedPoint.Dispose();
    }

    private static void FangOfShadows(player Player)
    {

    }

    private static void BeaconOfUnitedLifeforce(player Player, bool remove)
    {
        if (!remove)
        {
            // Apply Effects
        }
        else
        {
            // Remove Effects
        }
    }

    private static void AmuletOfEvasiveness(player Player, bool remove)
    {
        if (!remove)
        {
            // Apply Effects
        }
        else
        {
            // Remove Effects
        }
    }

    private static void OneOfNine(player Player, bool remove)
    {
        if(Program.Debug) Console.WriteLine("One of Nine");
        if(!remove)
        {
            // Apply Effects
        }
        else
        {
            // Remove Effects
        }
    }

}