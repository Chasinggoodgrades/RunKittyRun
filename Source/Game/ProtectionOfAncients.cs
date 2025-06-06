﻿using System;
using System.Collections.Generic;
using WCSharp.Api;
using WCSharp.Api.Enums;
using static WCSharp.Api.Common;

public static class ProtectionOfAncients
{
    private const string ACTIVATION_EFFECT = "war3mapImported\\Radiance Silver.mdx";
    private const string APPLY_EFFECT = "war3mapImported\\Divine Edict.mdx";
    public const float EFFECT_DELAY = 3.0f;
    private const float EFFECT_RADIUS = 150.0f;
    private const float EFFECT_RADIUS_INCREASE = 50.0f;
    private const int POTA_NO_RELIC = Constants.ABILITY_PROTECTION_OF_THE_ANCIENTS;
    private const int POTA_WITH_RELIC = Constants.ABILITY_PROTECTION_OF_THE_ANCIENTS_WITH_RELIC;

    private static trigger Trigger;
    private static trigger LevelUpTrigger;
    private static trigger HotkeyTrigger;

    private static readonly int UPGRADE_LEVEL_2_REQUIREMENT = 9;
    private static readonly int UPGRADE_LEVEL_3_REQUIREMENT = 12;

    private static readonly float INVULNERABLE_DURATION = 1.0f;
    private static List<player> UpgradeLevel2 = new List<player>();
    private static List<player> UpgradeLevel3 = new List<player>();

    public static void Initialize()
    {
        if (Gamemode.CurrentGameMode != "Standard") return;
        RegisterEvents();
        RegisterUpgradeLevelEvents();
    }

    /// <summary>
    /// Gives the unit the ProtectionOfAncients Ability.
    /// </summary>
    /// <param name="unit"></param>
    public static void AddProtectionOfAncients(unit unit)
    {
        var player = unit.Owner;
        unit.AddAbility(Constants.ABILITY_PROTECTION_OF_THE_ANCIENTS);
        player.DisplayTimedTextTo(7.0f, $"{Colors.COLOR_YELLOW_ORANGE}Congratulations on level 6! You've gained a new ability!|r");
    }

    /// <summary>
    /// Applies the Protection of the Ancients ability to the unit based on the hero level.
    /// </summary>
    /// <param name="unit"></param>
    /// <returns>Returns the integer level the ability was set to.</returns>
    public static int SetProtectionOfAncientsLevel(unit unit)
    {
        var player = unit.Owner;
        var heroLevel = unit.HeroLevel;

        if (unit.UnitType != Constants.UNIT_KITTY) return 0;

        // Return early if the hero level is below 6
        if (heroLevel < 6) return 0;

        // Determine ability level based on hero level
        int abilityLevel = heroLevel >= UPGRADE_LEVEL_3_REQUIREMENT ? 3 :
                           heroLevel >= UPGRADE_LEVEL_2_REQUIREMENT ? 2 : 0;

        if (abilityLevel > 0)
        {
            unit.SetAbilityLevel(POTA_NO_RELIC, abilityLevel);
            unit.SetAbilityLevel(POTA_WITH_RELIC, abilityLevel);

            // Display the message only if the player is achieving this level for the first time
            if ((abilityLevel == 2 && !UpgradeLevel2.Contains(player)) ||
                (abilityLevel == 3 && !UpgradeLevel3.Contains(player)))
            {
                player.DisplayTimedTextTo(7.0f, $"{Colors.COLOR_YELLOW_ORANGE}Congratulations on level {heroLevel}! You've upgraded your ultimate to level {abilityLevel}!|r");
            }

            if (abilityLevel == 2)
            {
                UpgradeLevel2.Add(player);
            }
            else if (abilityLevel == 3)
            {
                UpgradeLevel3.Add(player);
                UpgradeLevel2.Remove(player);  // Ensure the player is only in one list
            }
        }
        return abilityLevel;
    }

    private static void RegisterUpgradeLevelEvents()
    {
        LevelUpTrigger = trigger.Create();
        Blizzard.TriggerRegisterAnyUnitEventBJ(LevelUpTrigger, playerunitevent.HeroLevel);
        LevelUpTrigger.AddCondition(Condition(() => @event.Unit.HeroLevel >= UPGRADE_LEVEL_2_REQUIREMENT));
        LevelUpTrigger.AddAction(() => SetProtectionOfAncientsLevel(@event.Unit));
    }

    private static void RegisterEvents()
    {
        Trigger = trigger.Create();
        Blizzard.TriggerRegisterAnyUnitEventBJ(Trigger, playerunitevent.SpellCast);
        Trigger.AddCondition(Condition(() => @event.SpellAbilityId == Constants.ABILITY_PROTECTION_OF_THE_ANCIENTS || @event.SpellAbilityId == Constants.ABILITY_PROTECTION_OF_THE_ANCIENTS_WITH_RELIC));
        Trigger.AddAction(ActivationEvent);

        HotkeyTrigger = CreateTrigger();
        foreach(var p in Globals.ALL_PLAYERS)
        {
            HotkeyTrigger.RegisterPlayerKeyEvent(p, OSKEY_RCONTROL, MetaKey.Control, true);
        }
        HotkeyTrigger.AddAction(RegisterHotKeyEvents);
    }

    private static void RegisterHotKeyEvents()
    {
        player p = @event.Player;
        Kitty k = Globals.ALL_KITTIES[p];

        if (!k.Alive) return; // cannot cast if dead obviously.
        k.Unit.IssueOrder("divineshield");
        k.Unit.IssueOrder(WolfPoint.MoveOrderID, k.APMTracker.LastX, k.APMTracker.LastY);
    }

    private static void ActivationEvent()
    {
        var Unit = @event.Unit;
        var player = @event.Player;
        var kitty = Globals.ALL_KITTIES[player];
        var relic = Constants.ABILITY_PROTECTION_OF_THE_ANCIENTS_WITH_RELIC;

        Globals.ALL_KITTIES[player].ProtectionActive = true;

        // Short delay to let the ability actually hit cooldown first. Then call.. Give a .03 delay.
        Utility.SimpleTimer(0.03f, () => Unit.SetAbilityCooldownRemaining(relic, OneOfNine.GetOneOfNineCooldown(player)));

        var actiEffect = effect.Create(ACTIVATION_EFFECT, Unit, "chest");

        Utility.SimpleTimer(EFFECT_DELAY, () =>
        {
            ApplyEffect(Unit);
            GC.RemoveEffect(ref actiEffect);
        });
    }

    private static void ApplyEffect(unit Unit)
    {
        var owningPlayer = Unit.Owner;
        var kitty = Globals.ALL_KITTIES[owningPlayer];
        var actiEffect = effect.Create(APPLY_EFFECT, Unit.X, Unit.Y);
        if (!kitty.Unit.Alive) kitty.Invulnerable = true; // unit genuinely dead
        GC.RemoveEffect(ref actiEffect);
        EndEffectActions(owningPlayer);
    }

    private static bool AoEEffectFilter()
    {
        // Append units only if they're dead and a kitty circle.
        var unit = GetFilterUnit();
        var player = unit.Owner;
        if (unit.UnitType != Constants.UNIT_KITTY_CIRCLE) return false;

        var kitty = Globals.ALL_KITTIES[player].Unit;
        return !kitty.Alive;
    }

    private static void EndEffectActions(player Player)
    {
        // Get all units within range of the player unit (kitty) and revive them
        var tempGroup = group.Create();
        var kitty = Globals.ALL_KITTIES[Player];
        var levelOfAbility = kitty.Unit.GetAbilityLevel(Constants.ABILITY_PROTECTION_OF_THE_ANCIENTS);
        var levelOfRelic = kitty.Unit.GetAbilityLevel(Constants.ABILITY_PROTECTION_OF_THE_ANCIENTS_WITH_RELIC);
        if (levelOfRelic > 0) levelOfAbility = levelOfRelic;
        var effectRadius = EFFECT_RADIUS + (levelOfAbility * EFFECT_RADIUS_INCREASE);
        var reviveCount = 0;
        var filter = Utility.CreateFilterFunc(AoEEffectFilter);

        kitty.ProtectionActive = false;
        tempGroup.EnumUnitsInRange(kitty.Unit.X, kitty.Unit.Y, effectRadius, filter);

        while (true)
        {
            var unit = tempGroup.First;
            if (unit == null) break;
            tempGroup.Remove(unit);

            var playerToRevive = Globals.ALL_KITTIES[unit.Owner];
            // SELF.. Shouldn't get save points for reviving yourself.
            if (kitty.Unit == playerToRevive.Unit)
            {
                kitty.ReviveKitty();
            }
            else // Other players get revived and then kitty (person casting ult, gets the save points)
            {
                playerToRevive.Invulnerable = true; // players that are dead nearby that get revived will have invul for 1 sec as well.
                Utility.SimpleTimer(INVULNERABLE_DURATION, () => playerToRevive.Invulnerable = false);
                playerToRevive.ReviveKitty(kitty);
            }
            reviveCount++;
            // Give Divinity Tendrils if meets challenge requiremnet.
            if (reviveCount >= Challenges.DIVINITY_TENDRILS_COUNT) Challenges.DivinityTendrils(Player);
        }

        Utility.SimpleTimer(INVULNERABLE_DURATION, () => kitty.Invulnerable = false);

        GC.RemoveGroup(ref tempGroup);
        GC.RemoveFilterFunc(ref filter);
    }
}
