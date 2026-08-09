using System;
using WCSharp.Api;
using WCSharp.Api.Enums;
using static WCSharp.Api.Common;

public class ProtectionOfAncients
{
    private const string ACTIVATION_EFFECT = "war3mapImported\\Radiance Silver.mdx";
    private const string APPLY_EFFECT = "war3mapImported\\Divine Edict.mdx";
    private const float EFFECT_RADIUS = 150.0f;
    private const float EFFECT_RADIUS_INCREASE = 50.0f;
    private const int POTA_NO_RELIC = Constants.ABILITY_PROTECTION_OF_THE_ANCIENTS;
    private const int POTA_WITH_RELIC = Constants.ABILITY_PROTECTION_OF_THE_ANCIENTS_WITH_RELIC;
    public const float EFFECT_DELAY = 3.0f;

    private const int UPGRADE_LEVEL_2_REQUIREMENT = 9;
    private const int UPGRADE_LEVEL_3_REQUIREMENT = 12;
    private const float INVULNERABLE_DURATION = 1.0f;

    private static trigger CastTrigger;
    private static trigger LevelUpTrigger;
    private static trigger HotkeyTrigger;
    private static trigger LevelSixTrigger;

    public Kitty Kitty { get; }
    public bool HitLevel6 { get; private set; } = false;
    public bool UpgradeLevel2Obtained { get; private set; } = false;
    public bool UpgradeLevel3Obtained { get; private set; } = false;

    public ProtectionOfAncients(Kitty kitty)
    {
        Kitty = kitty;
        RegisterKittyEvents();
    }

    /// <summary>
    /// Creates the shared triggers used by every ProtectionOfAncients instance. Must be called
    /// before any Kitty (and therefore ProtectionOfAncients) instances are created.
    /// </summary>
    public static void Initialize()
    {
        RegisterCastTrigger();
        RegisterHotKeyTrigger();
        RegisterLevelSixTrigger();
        RegisterUpgradeLevelTrigger();
    }

    private void RegisterKittyEvents()
    {
        HotkeyTrigger.RegisterPlayerKeyEvent(Kitty.Player, OSKEY_RCONTROL, MetaKey.Control, true);
    }

    public void Reset()
    {
        HitLevel6 = false;
        UpgradeLevel2Obtained = false;
        UpgradeLevel3Obtained = false;
        Kitty.Unit.RemoveAbility(Constants.ABILITY_PROTECTION_OF_THE_ANCIENTS);
        Kitty.Unit.RemoveAbility(Constants.ABILITY_PROTECTION_OF_THE_ANCIENTS_WITH_RELIC);
    }

    public static void ResetProtectionOfAncients(player player)
    {
        var kitty = Globals.ALL_KITTIES[player];
        kitty?.ProtectionOfAncients?.Reset();
    }

    /// <summary>
    /// Applies the Protection of the Ancients ability to the unit based on the hero level.
    /// </summary>
    /// <param name="unit"></param>
    /// <returns>Returns the integer level the ability was set to.</returns>
    public static int SetProtectionOfAncientsLevel(unit unit)
    {
        var kitty = Globals.ALL_KITTIES[unit.Owner];
        return kitty?.ProtectionOfAncients?.SetLevel(unit) ?? 0;
    }

    private int SetLevel(unit unit)
    {
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
            if ((abilityLevel == 2 && !UpgradeLevel2Obtained) ||
                (abilityLevel == 3 && !UpgradeLevel3Obtained))
            {
                Kitty.Player.DisplayTimedTextTo(7.0f, $"{Colors.COLOR_YELLOW_ORANGE}Congratulations on level {heroLevel}! You've upgraded your ultimate to level {abilityLevel}!|r");
            }

            if (abilityLevel == 2)
            {
                UpgradeLevel2Obtained = true;
            }
            else if (abilityLevel == 3)
            {
                UpgradeLevel3Obtained = true;
                UpgradeLevel2Obtained = false;  // Ensure the player is only tracked in one state
            }
        }
        return abilityLevel;
    }

    private static void RegisterUpgradeLevelTrigger()
    {
        LevelUpTrigger = trigger.Create();
        Blizzard.TriggerRegisterAnyUnitEventBJ(LevelUpTrigger, playerunitevent.HeroLevel);
        LevelUpTrigger.AddCondition(Condition(() => @event.Unit.HeroLevel >= UPGRADE_LEVEL_2_REQUIREMENT));
        LevelUpTrigger.AddAction(UpgradeLevelDispatch);
    }

    private static void UpgradeLevelDispatch()
    {
        SetProtectionOfAncientsLevel(@event.Unit);
    }

    private static void RegisterLevelSixTrigger()
    {
        LevelSixTrigger ??= trigger.Create();
        Blizzard.TriggerRegisterAnyUnitEventBJ(LevelSixTrigger, playerunitevent.HeroLevel);
        LevelSixTrigger.AddAction(LevelSixDispatch);
    }

    private static void LevelSixDispatch()
    {
        var unit = @event.Unit;
        var kitty = Globals.ALL_KITTIES[unit.Owner];
        kitty?.ProtectionOfAncients?.OnHeroLevelForUltimate(unit);
    }

    private void OnHeroLevelForUltimate(unit unit)
    {
        if (HitLevel6) return;
        if (unit.HeroLevel < 6) return;
        HitLevel6 = true;
        unit.AddAbility(Constants.ABILITY_PROTECTION_OF_THE_ANCIENTS);
        Kitty.Player.DisplayTimedTextTo(7.0f, $"{Colors.COLOR_YELLOW_ORANGE}Congratulations on level 6! You've gained a new ability!{Colors.COLOR_RESET}");
    }

    private static void RegisterCastTrigger()
    {
        CastTrigger = trigger.Create();
        Blizzard.TriggerRegisterAnyUnitEventBJ(CastTrigger, playerunitevent.SpellCast);
        CastTrigger.AddCondition(Condition(() => @event.SpellAbilityId == Constants.ABILITY_PROTECTION_OF_THE_ANCIENTS || @event.SpellAbilityId == Constants.ABILITY_PROTECTION_OF_THE_ANCIENTS_WITH_RELIC));
        CastTrigger.AddAction(ActivationEventDispatch);
    }

    private static void RegisterHotKeyTrigger()
    {
        HotkeyTrigger = CreateTrigger();
        HotkeyTrigger.AddAction(HotKeyEventsDispatch);
    }

    private static void HotKeyEventsDispatch()
    {
        var kitty = Globals.ALL_KITTIES[@event.Player];
        kitty?.ProtectionOfAncients?.OnHotkeyPressed();
    }

    private void OnHotkeyPressed()
    {
        if (!Kitty.Alive) return; // cannot cast if dead obviously.
        Kitty.Unit.IssueOrder("divineshield");
        Kitty.Unit.IssueOrder(WolfPoint.MoveOrderID, Kitty.APMTracker.LastX, Kitty.APMTracker.LastY);
    }

    private static void ActivationEventDispatch()
    {
        var kitty = Globals.ALL_KITTIES[@event.Player];
        kitty?.ProtectionOfAncients?.ActivationEvent(@event.Unit);
    }

    private void ActivationEvent(unit Unit)
    {
        var relic = Constants.ABILITY_PROTECTION_OF_THE_ANCIENTS_WITH_RELIC;

        Kitty.ProtectionActive = true;

        // Short delay to let the ability actually hit cooldown first. Then call.. Give a .03 delay.
        Utility.SimpleTimer(0.03f, () => Unit.SetAbilityCooldownRemaining(relic, OneOfNine.GetOneOfNineCooldown(Kitty.Player)));

        var actiEffect = effect.Create(ACTIVATION_EFFECT, Unit, "chest");

        Utility.SimpleTimer(EFFECT_DELAY, () =>
        {
            ApplyEffect(Unit);
            GC.RemoveEffect(ref actiEffect);
        });
    }

    private void ApplyEffect(unit Unit)
    {
        var actiEffect = effect.Create(APPLY_EFFECT, Unit.X, Unit.Y);
        if (!Kitty.Unit.Alive) Kitty.Invulnerable = true; // unit genuinely dead
        GC.RemoveEffect(ref actiEffect);
        EndEffectActions();
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

    private void EndEffectActions()
    {
        // Get all units within range of the player unit (kitty) and revive them
        var tempGroup = group.Create(); // consider changing this to a static group
        var levelOfAbility = Kitty.Unit.GetAbilityLevel(Constants.ABILITY_PROTECTION_OF_THE_ANCIENTS);
        var levelOfRelic = Kitty.Unit.GetAbilityLevel(Constants.ABILITY_PROTECTION_OF_THE_ANCIENTS_WITH_RELIC);
        if (levelOfRelic > 0) levelOfAbility = levelOfRelic;
        var effectRadius = EFFECT_RADIUS + (levelOfAbility * EFFECT_RADIUS_INCREASE);
        var reviveCount = 0;
        var filter = Utility.CreateFilterFunc(AoEEffectFilter);

        Kitty.ProtectionActive = false;
        tempGroup.EnumUnitsInRange(Kitty.Unit.X, Kitty.Unit.Y, effectRadius, filter);

        while (true)
        {
            var unit = tempGroup.First;
            if (unit == null) break;
            tempGroup.Remove(unit);

            var playerToRevive = Globals.ALL_KITTIES[unit.Owner];
            if (Kitty.TeamID != playerToRevive.TeamID) continue; // don't revive other team members.
            // SELF.. Shouldn't get save points for reviving yourself.
            if (Kitty.Unit == playerToRevive.Unit)
            {
                Kitty.ReviveKitty();
            }
            else // Other players get revived and then kitty (person casting ult, gets the save points)
            {
                playerToRevive.Invulnerable = true; // players that are dead nearby that get revived will have invul for 1 sec as well.
                Utility.SimpleTimer(INVULNERABLE_DURATION, () => playerToRevive.Invulnerable = false);
                playerToRevive.ReviveKitty(Kitty);
            }
            reviveCount++;
            // Give Divinity Tendrils if meets challenge requiremnet.
            if (reviveCount >= Challenges.DIVINITY_TENDRILS_COUNT) Challenges.DivinityTendrils(Kitty.Player);
        }

        Utility.SimpleTimer(INVULNERABLE_DURATION, () => Kitty.Invulnerable = false);

        GC.RemoveGroup(ref tempGroup);
        GC.RemoveFilterFunc(ref filter);
    }
}
