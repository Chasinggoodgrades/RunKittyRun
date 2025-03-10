using System;
using WCSharp.Api;
using static WCSharp.Api.Common;

public class ShardOfTranslocation : Relic
{
    public const int RelicItemID = Constants.ITEM_SHARD_OF_TRANSLOCATION;
    public const int RelicAbilityID = Constants.ABILITY_TRANSLOCATE;
    private static int RelicCost = 650;
    private static float DEFAULT_BLINK_RANGE = 400.0f;
    private static float UPGRADE_BLINK_RANGE = 600.0f;
    private static float DEFAULT_COOLDOWN = 90.0f;
    private static float CooldownReduction = 15.0f;
    private unit Owner;
    private static new string IconPath = "ReplaceableTextures/CommandButtons/BTNShardOfTranslocation.blp";
    private float MaxBlinkRange = DEFAULT_BLINK_RANGE;
    private trigger CastEventTrigger;

    public ShardOfTranslocation() : base(
        "|c7eb66ff1Shard of Translocation|r",
        $"Teleports the user to a targeted location within {DEFAULT_BLINK_RANGE} range, restricted to lane bounds.{Colors.COLOR_ORANGE}(Active) {Colors.COLOR_LIGHTBLUE}(1min 30 sec cooldown).|r",
        RelicAbilityID,
        RelicItemID,
        RelicCost,
        IconPath
        )
    {
        Upgrades.Add(new RelicUpgrade(0, $"Extends the teleport range to {UPGRADE_BLINK_RANGE} yrds within lane bounds.", 15, 800));
        Upgrades.Add(new RelicUpgrade(1, $"Cooldown reduced by 15 seconds.", 20, 1000));
    }

    public override void ApplyEffect(unit Unit)
    {
        RegisterTrigger(Unit);
        UpdateBlinkRange(Unit);
        Owner = Unit;
        Unit.DisableAbility(Constants.ABILITY_TRANSLOCATE, false, false);
        Utility.SimpleTimer(0.1f, () => SetAbilityData(Unit));
    }

    public override void RemoveEffect(unit Unit)
    {
        GC.RemoveTrigger(ref CastEventTrigger);
        Unit.DisableAbility(Constants.ABILITY_TRANSLOCATE, false, true);
    }

    private void RegisterTrigger(unit Unit)
    {
        var player = Unit.Owner;
        CastEventTrigger = trigger.Create();
        _ = CastEventTrigger.RegisterPlayerUnitEvent(player, playerunitevent.SpellCast, null);
        _ = CastEventTrigger.AddAction(() => TeleportActions());
    }

    private void TeleportActions()
    {
        if (!Globals.GAME_ACTIVE) return;
        if (@event.SpellAbilityId != RelicAbilityID) return;
        var unit = @event.Unit;
        var targetLoc = @event.SpellTargetLoc;
        var player = unit.Owner;
        var currentSafezone = Globals.PLAYERS_CURRENT_SAFEZONE[player];
        try
        {

            if (!EligibleLocation(targetLoc, currentSafezone))
            {
                player.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_RED}Invalid location. Must be within safezone bounds.");
                Utility.SimpleTimer(0.1f, () => RelicUtil.SetRelicCooldowns(Owner, RelicItemID, RelicAbilityID, 1));
                Utility.SimpleTimer(0.15f, () => Utility.UnitAddMana(Owner, 200));
                return;
            }

            TeleportUnit(unit, targetLoc);
            RelicUtil.CloseRelicBook(player);
            Utility.SimpleTimer(0.1f, () => RelicUtil.SetRelicCooldowns(Owner, RelicItemID, RelicAbilityID));
            GC.RemoveLocation(ref targetLoc);
        }
        catch (Exception e)
        {
            Logger.Critical(e.Message);
            throw;
        }
    }

    private void UpdateBlinkRange(unit unit)
    {
        var upgradeLevel = PlayerUpgrades.GetPlayerUpgrades(unit.Owner).GetUpgradeLevel(GetType());
        MaxBlinkRange = upgradeLevel >= 1 ? UPGRADE_BLINK_RANGE : DEFAULT_BLINK_RANGE;
        if (upgradeLevel >= 1) Utility.SimpleTimer(0.1f, () => SetItemTooltip(unit));
    }

    private void SetItemTooltip(unit unit)
    {
        var item = Utility.UnitGetItem(unit, RelicItemID);
        item.ExtendedDescription = $"{Colors.COLOR_YELLOW_ORANGE}The holder of this shard can harness arcane energy to blink to a new location within {Colors.COLOR_LAVENDER}{MaxBlinkRange.ToString("F2")}|r range.|nThe shard recharges over time.|n|cffff8c00Allows the holder to teleport within lane bounds.|r |cffadd8e6(Activate)|r\r";
    }

    /// <summary>
    /// Sets ability cooldown and radius based on upgrade level.
    /// </summary>
    /// <param name="Unit"></param>
    private void SetAbilityData(unit Unit)
    {
        _ = Unit.GetAbility(RelicAbilityID);
        var upgradeLevel = PlayerUpgrades.GetPlayerUpgrades(Unit.Owner).GetUpgradeLevel(GetType());

        var cooldown = upgradeLevel >= 2 // lvl 2 upgrade
            ? DEFAULT_COOLDOWN - CooldownReduction
            : DEFAULT_COOLDOWN;

        // Set cooldown based on the upgrade lvl.
        RelicUtil.SetAbilityCooldown(Unit, RelicItemID, RelicAbilityID, cooldown);
    }

    private void TeleportUnit(unit unit, location targetLoc)
    {
        var x = targetLoc.X;
        var y = targetLoc.Y;
        var distance = WCSharp.Shared.Util.DistanceBetweenPoints(unit, x, y);

        if (distance > MaxBlinkRange)
        {
            var angle = Atan2(y - unit.Y, x - unit.X);
            x = unit.X + (MaxBlinkRange * Cos(angle));
            y = unit.Y + (MaxBlinkRange * Sin(angle));
        }
        unit.SetPosition(x, y);
    }

    private static bool EligibleLocation(location targetLoc, int currentSafezone)
    {
        var SAFEZONES = Globals.SAFE_ZONES;
        return SAFEZONES[currentSafezone].Region.Contains(targetLoc.X, targetLoc.Y) || (currentSafezone > 0 && SAFEZONES[currentSafezone - 1].Region.Contains(targetLoc.X, targetLoc.Y)) || (currentSafezone < SAFEZONES.Count - 1 && SAFEZONES[currentSafezone + 1].Region.Contains(targetLoc.X, targetLoc.Y) && currentSafezone < 13) || WolfRegionEligible(targetLoc, currentSafezone);
    }

    private static bool WolfRegionEligible(location targetLoc, int currentSafezone)
    {
        var WOLF_AREAS = RegionList.WolfRegions;
        if (WOLF_AREAS[currentSafezone].Contains(targetLoc.X, targetLoc.Y)) return true;
        if (currentSafezone > 0 && WOLF_AREAS[currentSafezone - 1].Contains(targetLoc.X, targetLoc.Y)) return true;
        if (WOLF_AREAS[currentSafezone + 1].Contains(targetLoc.X, targetLoc.Y)) return true;
        if (currentSafezone == 13 || currentSafezone == 14)
        {
            if (WOLF_AREAS[14].Contains(targetLoc.X, targetLoc.Y)) return true;
            if (WOLF_AREAS[15].Contains(targetLoc.X, targetLoc.Y)) return true;
            if (WOLF_AREAS[16].Contains(targetLoc.X, targetLoc.Y)) return true;
        }
        return false;
    }



}