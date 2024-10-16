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
            Trigger.RegisterPlayerUnitEvent(player, playerunitevent.SpellCast, null);
        Trigger.AddAction(ActivationEvent);
        Trigger.AddCondition(Condition(() => 
        @event.SpellAbilityId == Constants.ABILITY_PROTECTION_OF_THE_ANCIENTS || @event.SpellAbilityId == Constants.ABILITY_PROTECTION_OF_THE_ANCIENTS_WITH_RELIC));
    }

    private static void ActivationEvent()
    {
        var Unit = @event.Unit;
        var player = @event.Player;

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
        var owningPlayer = Unit.Owner;
        var actiEffect = effect.Create(APPLY_EFFECT, Unit.X, Unit.Y);
        actiEffect.Dispose();
        EndEffectActions(owningPlayer);
    }

    private static bool AoEEffectFilter()
    {
        // Append units only if they're dead and a kitty circle. 
        var unit = GetFilterUnit();
        var player = unit.Owner;
        if (unit.UnitType != Constants.UNIT_KITTY_CIRCLE) return false;

        var kitty = Globals.ALL_KITTIES[player].Unit;
        if (kitty.Alive) return false; 

        return true;
    }

    private static void EndEffectActions(player Player)
    {
        // Get all units within range of the player unit (kitty) and revive them
        var tempGroup = group.Create();
        var kitty = Globals.ALL_KITTIES[Player];
        var levelOfAbility = kitty.Unit.GetAbilityLevel(Constants.ABILITY_PROTECTION_OF_THE_ANCIENTS);
        var levelOfRelic = kitty.Unit.GetAbilityLevel(Constants.ABILITY_PROTECTION_OF_THE_ANCIENTS_WITH_RELIC);
        if(levelOfRelic > 0) levelOfAbility = levelOfRelic;
        var effectRadius = EFFECT_RADIUS + (levelOfAbility * EFFECT_RADIUS_INCREASE);
        var reviveCount = 0;
        kitty.ProtectionActive = false;
        GroupEnumUnitsInRange(tempGroup, GetUnitX(kitty.Unit), GetUnitY(kitty.Unit), effectRadius, Filter(() => AoEEffectFilter()));
        foreach (var unit in tempGroup.ToList())
        {
            var playerToRevive = Globals.ALL_KITTIES[unit.Owner];
            playerToRevive.ReviveKitty(kitty);
            reviveCount++;
            if (reviveCount >= Challenges.DIVINITY_TENDRILS_COUNT) Challenges.DivinityTendrils(Player);

        }
        tempGroup.Dispose();

    }
}