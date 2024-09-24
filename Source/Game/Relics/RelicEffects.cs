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
    private static float AMULET_OF_EVASIVENESS_COLLSION_REDUCTION = 0.10f; // 10%
    private static float EXTRA_REVIVE_CHANCE_SINGLE = 0.125f; // 12.5%
    private static float EXTRA_REVIVE_CHANCE_ALL = 0.02f; // 2%
    public static void Initialize()
    {
        if (Gamemode.CurrentGameMode != "Standard") return;
        RelicAbilities = RegisterAbilities();
        RegisterEvents();
    }

    private static void RegisterEvents()
    {
        RelicUsageTrigger = CreateTrigger();
        foreach (var player in Globals.ALL_PLAYERS)
            TriggerRegisterPlayerUnitEvent(RelicUsageTrigger, player, EVENT_PLAYER_UNIT_SPELL_CAST, null);
        TriggerAddAction(RelicUsageTrigger, HandleRelicUsage());
    }

    private static List<int> RegisterAbilities()
    {
        return new List<int>
        {
            Constants.ABILITY_TAKE_EM_WITH_RING_ULTIMATE,
            Constants.ABILITY_SUMMON_SHADOW_KITTY,
            Constants.ABILITY_RING_OF_FROSTBITE_RING_ULTIMATE,
        };
    }

    public static void HandleRelicEffect(player Player, item Item, bool Active)
    {
        switch (Item.TypeId)
        {
            case Constants.ITEM_AMULET_OF_EVASIVENESS:
                AmuletOfEvasiveness(Player, Active);
                break;
            case Constants.ITEM_ONE_OF_NINE:
                OneOfNineSetup(Player, Active);
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
            case Constants.ITEM_ONE_OF_NINE:
                OneOfNineSetup(Player, true);
                break;
        }
    }

    private static Action HandleRelicUsage()
    {
        return () =>
        {
            var spellCast = GetSpellAbilityId();
            var unit = GetTriggerUnit();
            var Player = GetOwningPlayer(unit);
            if (!RelicAbilities.Contains(spellCast)) return;
            switch (spellCast)
            {
                case Constants.ABILITY_TAKE_EM_WITH_RING_ULTIMATE:
                    var pointedLocation = GetSpellTargetLoc();
                    RelicOnUse.SacredRingOfSummoning(Player, pointedLocation);
                    break;
                case Constants.ABILITY_SUMMON_SHADOW_KITTY:
                    RelicOnUse.FangOfShadows(Player);
                    break;
                case Constants.ABILITY_RING_OF_FROSTBITE_RING_ULTIMATE:
                    var freezeLocation = GetSpellTargetLoc();
                    RelicOnUse.FrostbiteRing(freezeLocation);
                    break;
            }
        };
    }

    public static void BeaconOfUnitedLifeforceEffect(Kitty kitty)
    {
        if (!Utility.UnitHasItem(kitty.Unit, Constants.ITEM_BEACON_OF_UNITED_LIFEFORCE)) return;
        var chance = GetRandomReal(0.00f, 1.00f);
        if (chance > EXTRA_REVIVE_CHANCE_SINGLE) return;
        foreach (var k in Globals.ALL_KITTIES.Values)
        {
            if (k.Alive) continue;
            k.ReviveKitty(kitty);
            if (chance > EXTRA_REVIVE_CHANCE_ALL) break;
        }
    }

    private static void AmuletOfEvasiveness(player Player, bool Active)
    {
        var kitty = Globals.ALL_KITTIES[Player];

        UnitWithinRange.DeRegisterUnitWithinRangeUnit(kitty.Unit);

        if (Active)
        {
            var newCollisionRadius = CollisionDetection.DEFAULT_WOLF_COLLISION_RADIUS * (1.0f - AMULET_OF_EVASIVENESS_COLLSION_REDUCTION);
            CollisionDetection.KITTY_COLLISION_RADIUS[Player] = newCollisionRadius;
            kitty.Unit.SetScale(0.48f, 0.48f, 0.48f);
        }
        else
        {
            CollisionDetection.KITTY_COLLISION_RADIUS[Player] = CollisionDetection.DEFAULT_WOLF_COLLISION_RADIUS;
            kitty.Unit.SetScale(0.60f, 0.60f, 0.60f);
        }
        CollisionDetection.KittyRegisterCollisions(kitty);
    }

    private static void OneOfNineSetup(player Player, bool Active)
    {
        if(Program.Debug) Console.WriteLine("One of Nine is Active: " + Active);
        var kitty = Globals.ALL_KITTIES[Player];
        var cooldown = GetOneOfNineCooldown(Player);
        if (Active)
        {
            kitty.Unit.RemoveAbility(Constants.ABILITY_PROTECTION_OF_THE_ANCIENTS);
            kitty.Unit.AddAbility(Constants.ABILITY_PROTECTION_OF_THE_ANCIENTS_WITH_RELIC);
            kitty.Unit.SetAbilityCooldownRemaining(Constants.ABILITY_PROTECTION_OF_THE_ANCIENTS_WITH_RELIC, cooldown);
        }
        else
        {
            kitty.Unit.RemoveAbility(Constants.ABILITY_PROTECTION_OF_THE_ANCIENTS_WITH_RELIC);
            kitty.Unit.AddAbility(Constants.ABILITY_PROTECTION_OF_THE_ANCIENTS);
            kitty.Unit.SetAbilityCooldownRemaining(Constants.ABILITY_PROTECTION_OF_THE_ANCIENTS, cooldown);
        }

    }

    private static float GetOneOfNineCooldown(player Player)
    {
        var kitty = Globals.ALL_KITTIES[Player].Unit;
        var noRelic = Constants.ABILITY_PROTECTION_OF_THE_ANCIENTS;
        var relic = Constants.ABILITY_PROTECTION_OF_THE_ANCIENTS_WITH_RELIC;
        if(kitty.GetAbilityCooldownRemaining(noRelic) > 0.0f) 
            return kitty.GetAbilityCooldownRemaining(noRelic);
        return kitty.GetAbilityCooldownRemaining(relic);
    }

    public static void OneOfNineEffect(player Player)
    {
        var kitty = Globals.ALL_KITTIES[Player];
        if (!Utility.UnitHasItem(kitty.Unit, Constants.ITEM_ONE_OF_NINE)) return;
        if (Program.Debug) Console.WriteLine("One of Nine Effect");
        if (kitty.Unit.GetAbilityCooldownRemaining(Constants.ABILITY_PROTECTION_OF_THE_ANCIENTS_WITH_RELIC) <= 0.0f)
            IssueImmediateOrder(kitty.Unit, "divineshield");
    }

}