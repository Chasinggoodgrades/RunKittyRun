using System;
using System.Collections.Generic;
using System.Linq;
using Source;
using WCSharp.Api;
using WCSharp.Effects;
using WCSharp.Events;
using WCSharp.Shared.Extensions;
using static WCSharp.Api.Common;
public static class ProtectionOfAncients
{
    private static trigger Trigger;
    private const string ACTIVATION_EFFECT = "war3mapImported\\Radiance Silver.mdx";
    private const string APPLY_EFFECT = "war3mapImported\\Divine Edict.mdx";
    public const float EFFECT_DELAY = 3.0f;
    private const float EFFECT_RADIUS = 150.0f;
    private const float EFFECT_RADIUS_INCREASE = 50.0f;
    public static void Initialize()
    {
        if(Gamemode.CurrentGameMode != "Standard") return;
        RegisterEvents();
    }

    private static void RegisterEvents()
    {
        Trigger = CreateTrigger();
        foreach(var player in Globals.ALL_PLAYERS)
            TriggerRegisterPlayerUnitEvent(Trigger, player, EVENT_PLAYER_UNIT_SPELL_CAST, null);
        TriggerAddAction(Trigger, ActivationEvent);
        TriggerAddCondition(Trigger, Condition(() => 
        GetSpellAbilityId() == Constants.ABILITY_PROTECTION_OF_THE_ANCIENTS || GetSpellAbilityId() == Constants.ABILITY_PROTECTION_OF_THE_ANCIENTS_WITH_RELIC));
    }

    private static void ActivationEvent()
    {
        var Unit = GetTriggerUnit();
        var player = GetTriggerPlayer();

        Globals.ALL_KITTIES[player].ProtectionActive = true;
        if(Program.Debug) Console.WriteLine("Player: " + player.Name + " activated Protection of the Ancients!");

        var actiEffect = effect.Create(ACTIVATION_EFFECT, Unit, "chest");
        var timer = CreateTimer();
        TimerStart(timer, EFFECT_DELAY, false, () =>
        {
            ApplyEffect(Unit);
            actiEffect.Dispose();
            timer.Dispose();
        });
    }

    private static void ApplyEffect(unit Unit)
    {
        var owningPlayer = GetOwningPlayer(Unit);
        var actiEffect = effect.Create(APPLY_EFFECT, Unit.X, Unit.Y);
        actiEffect.Dispose();
        EndEffectActions(owningPlayer);
    }

    private static bool AoEEffectFilter()
    {
        // Append units only if they're dead and a kitty circle. 
        var unit = GetFilterUnit();
        if (GetUnitTypeId(unit) != Constants.UNIT_KITTY_CIRCLE) return false;

        var kitty = Globals.ALL_KITTIES[GetOwningPlayer(unit)].Unit;
        if (kitty.Alive) return false; 

        return true;
    }

    private static void EndEffectActions(player Player)
    {
        // Get all units within range of the player unit (kitty) and revive them
        var tempGroup = CreateGroup();
        var kitty = Globals.ALL_KITTIES[Player];
        var levelOfAbility = GetUnitAbilityLevel(kitty.Unit, Constants.ABILITY_PROTECTION_OF_THE_ANCIENTS);
        var levelOfRelic = GetUnitAbilityLevel(kitty.Unit, Constants.ABILITY_PROTECTION_OF_THE_ANCIENTS_WITH_RELIC);
        if(levelOfRelic > 0) levelOfAbility = levelOfRelic;
        var effectRadius = EFFECT_RADIUS + (levelOfAbility * EFFECT_RADIUS_INCREASE);
        var reviveCount = 0;
        kitty.ProtectionActive = false;
        GroupEnumUnitsInRange(tempGroup, GetUnitX(kitty.Unit), GetUnitY(kitty.Unit), effectRadius, Filter(() => AoEEffectFilter()));
        foreach (var unit in tempGroup.ToList())
        {
            var playerToRevive = Globals.ALL_KITTIES[GetOwningPlayer(unit)];
            playerToRevive.ReviveKitty(kitty);
            reviveCount++;
            if (reviveCount >= Challenges.DIVINITY_TENDRILS_COUNT) Challenges.DivinityTendrils(Player);

        }
        tempGroup.Dispose();

    }
}