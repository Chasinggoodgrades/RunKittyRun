using static WCSharp.Api.Common;
using WCSharp.Api;
using System;

public class ShardOfTranslocation : Relic
{
    public const int RelicItemID = Constants.ITEM_SHARD_OF_TRANSLOCATION;
    public static int RelicAbilityID = Constants.ABILITY_TRANSLOCATE;
    private static int RelicCost = 650;
    private static float DEFAULT_BLINK_RANGE = 400.0f;
    private static float UPGRADE_BLINK_RANGE = 600.0f;
    private static float CooldownReduction = 15.0f;
    private static new string IconPath = "ReplaceableTextures/CommandButtons/BTNShardOfTranslocation.blp";
    private float MaxBlinkRange = DEFAULT_BLINK_RANGE;
    private trigger CastEventTrigger;

    public ShardOfTranslocation() : base(
        "|c7eb66ff1Shard of Translocation|r",
        $"Teleports the user to a targeted location within {DEFAULT_BLINK_RANGE} range, restricted to lane bounds.{Colors.COLOR_ORANGE}(Active)|r",
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
        Unit.DisableAbility(Constants.ABILITY_TRANSLOCATE, false, false);
    }

    public override void RemoveEffect(unit Unit)
    {
        CastEventTrigger.Dispose();
        CastEventTrigger = null;
        Unit.DisableAbility(Constants.ABILITY_TRANSLOCATE, false, true);
    }

    private void RegisterTrigger(unit Unit)
    {
        var player = Unit.Owner;
        CastEventTrigger = trigger.Create();
        CastEventTrigger.RegisterPlayerUnitEvent(player, playerunitevent.SpellCast, null);
        CastEventTrigger.AddAction(() => TeleportActions());
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
                BlzEndUnitAbilityCooldown(unit, RelicAbilityID);
                return;
            }

            TeleportUnit(unit, targetLoc);
            SetCooldown(unit);
            targetLoc.Dispose();
            targetLoc = null;
        }
        catch (Exception e)
        {
            player.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_RED}Translocation Relic: An error occurred. Please report this to the developer.");
            //Console.WriteLine(e.Message);
        }
    }

    private void UpdateBlinkRange(unit unit)
    {
        var upgradeLevel = PlayerUpgrades.GetPlayerUpgrades(unit.Owner).GetUpgradeLevel(GetType());
        MaxBlinkRange = upgradeLevel >= 1 ? UPGRADE_BLINK_RANGE : DEFAULT_BLINK_RANGE;
    }

    private void SetCooldown(unit unit)
    {
        var reduction = 0.0f;
        if (PlayerUpgrades.GetPlayerUpgrades(unit.Owner).GetUpgradeLevel(GetType()) == 2)
            reduction = CooldownReduction;
        var cooldown = unit.GetAbilityCooldown(RelicAbilityID, 0);
        unit.SetAbilityCooldownRemaining(RelicAbilityID, cooldown - reduction);
    }

    private void TeleportUnit(unit unit, location targetLoc)
    {
        var x = targetLoc.X;
        var y = targetLoc.Y;
        var distance = WCSharp.Shared.Util.DistanceBetweenPoints(unit, x, y);

        if (distance > MaxBlinkRange)
        {
            var angle = Atan2(y - unit.Y, x - unit.X);
            x = unit.X + MaxBlinkRange * Cos(angle);
            y = unit.Y + MaxBlinkRange * Sin(angle);
        }
        unit.SetPosition(x, y);
    }

    private static bool EligibleLocation(location targetLoc, int currentSafezone)
    {
        var SAFEZONES = Globals.SAFE_ZONES;
        if (SAFEZONES[currentSafezone].Region.Contains(targetLoc.X, targetLoc.Y)) return true;
        if (currentSafezone > 0 && SAFEZONES[currentSafezone - 1].Region.Contains(targetLoc.X, targetLoc.Y)) return true;
        if (currentSafezone < SAFEZONES.Count - 1 && SAFEZONES[currentSafezone + 1].Region.Contains(targetLoc.X, targetLoc.Y) && currentSafezone < 13) return true;
        if (WolfRegionEligible(targetLoc, currentSafezone)) return true;
        return false;
    }

    private static bool WolfRegionEligible(location targetLoc, int currentSafezone)
    {
        var WOLF_AREAS = RegionList.WolfRegions;
        if (WOLF_AREAS[currentSafezone].Contains(targetLoc.X, targetLoc.Y)) return true;
        if (currentSafezone > 0 && WOLF_AREAS[currentSafezone - 1].Contains(targetLoc.X, targetLoc.Y)) return true;
        if (WOLF_AREAS[currentSafezone + 1].Contains(targetLoc.X, targetLoc.Y)) return true;
        if(currentSafezone == 13 || currentSafezone == 14)
        {
            if (WOLF_AREAS[14].Contains(targetLoc.X, targetLoc.Y)) return true;
            if (WOLF_AREAS[15].Contains(targetLoc.X, targetLoc.Y)) return true;
            if (WOLF_AREAS[16].Contains(targetLoc.X, targetLoc.Y)) return true;
        }
        return false;
    }



}