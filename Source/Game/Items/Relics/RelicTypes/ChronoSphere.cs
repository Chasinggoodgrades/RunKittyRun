﻿using System;
using WCSharp.Api;
using static WCSharp.Api.Common;

public class ChronoSphere : Relic
{
    public const int RelicItemID = Constants.ITEM_CHRONO_ORB;
    public new const int RelicAbilityID = Constants.ABILITY_THE_AURA_OF_THE_RING;
    private new static string IconPath = "ReplaceableTextures\\CommandButtons\\BTNChrono Orb.dds";
    private static readonly Predicate<Relic> IsChronoSphere = r => r is ChronoSphere;
    private const string LocationSaveEffectPath = "war3mapImported\\ChronoLocationSave.mdx";
    private const int RelicCost = 650;
    private const float SLOW_AURA_RADIUS = 400.0f;
    private const float MAGNITUDE_CHANGE_INTERVAL = 15.0f;
    private const float MAGNITUDE_LOWER_BOUND = 10.0f;
    private const float MAGNITUDE_UPPER_BOUND = 14.0f;
    private const float LOCATION_CAPTURE_INTERVAL = 5.0f;
    private const float REWIND_COOLDOWN = 150.0f;

    private ability Ability;
    private Kitty Kitty;
    private float Magnitude;
    private AchesTimers MagnitudeTimer = ObjectPool.GetEmptyObject<AchesTimers>();
    private AchesTimers LocationCaptureTimer = ObjectPool.GetEmptyObject<AchesTimers>();
    private effect LocationEffect = null;
    private (float, float, float) CapturedLocation; // x, y, facing

    public ChronoSphere() : base(
        $"{Colors.COLOR_YELLOW}Chrono Sphere",
        $"Slows time around you, slowing wolves by 10% within {(int)SLOW_AURA_RADIUS} range.{Colors.COLOR_LIGHTBLUE}(Passive)|r",
        RelicAbilityID,
        RelicItemID,
        RelicCost,
        IconPath
        )
    {
        Upgrades.Add(new RelicUpgrade(0, $"Every {MAGNITUDE_CHANGE_INTERVAL.ToString("F2")} seconds, the magnitude of the slowing aura will change between {MAGNITUDE_LOWER_BOUND.ToString("F2")}% - {MAGNITUDE_UPPER_BOUND.ToString("F2")}% effectiveness.", 15, 800));
        Upgrades.Add(new RelicUpgrade(1, $"Every {LOCATION_CAPTURE_INTERVAL.ToString("F2")} seconds, your location is captured. If you were to die, you'll reverse time to that location. {Colors.COLOR_LIGHTBLUE}(2min 30sec cooldown)|r", 20, 1000));
    }

    public override void ApplyEffect(unit Unit)
    {
        Kitty = Globals.ALL_KITTIES[Unit.Owner];
        Utility.SimpleTimer(0.1f, RotatingSlowAura);
        RotatingLocationCapture();
    }

    public override void RemoveEffect(unit Unit)
    {
        MagnitudeTimer?.Dispose();
        LocationCaptureTimer?.Dispose();
        GC.RemoveEffect(ref LocationEffect);
    }

    private void SetAbilityData()
    {
        var item = Utility.UnitGetItem(Kitty.Unit, RelicItemID);
        Ability = item.GetAbility(RelicAbilityID);
        Magnitude = RandomMagnitude();
        Ability.SetMovementSpeedIncreasePercent_Oae1(0, Magnitude);
        Ability.SetAreaOfEffect_aare(0, SLOW_AURA_RADIUS);
        item.ExtendedDescription = $"{Colors.COLOR_YELLOW}The possessor of this mystical orb emits a temporal distortion field, slowing the movement of all enemies within a 400 range by {Colors.COLOR_LAVENDER}{Math.Abs(Magnitude * 100).ToString("F0")}%.|r |cffadd8e6(Passive)|r\r\n";
    }

    // Upgrade level 1, rotating aura slow
    private void RotatingSlowAura()
    {
        var upgradeLevel = PlayerUpgrades.GetPlayerUpgrades(Kitty.Player).GetUpgradeLevel(typeof(ChronoSphere));
        if (upgradeLevel <= 0) return;

        MagnitudeTimer.Timer.Start(MAGNITUDE_CHANGE_INTERVAL, true, SetAbilityData);
        SetAbilityData();
    }

    // Upgrade Level 2 Location Capture
    private void RotatingLocationCapture()
    {
        try
        {
            var upgradeLevel = PlayerUpgrades.GetPlayerUpgrades(Kitty.Player).GetUpgradeLevel(typeof(ChronoSphere));
            if (upgradeLevel <= 1) return;
            CapturedLocation = (Kitty.Unit.X, Kitty.Unit.Y, Kitty.Unit.Facing); // reset to current location on buy
            LocationCaptureTimer.Timer.Start(LOCATION_CAPTURE_INTERVAL, false, CaptureLocation);
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in ChronoSphere.RotatingLocationCapture: {e.Message}");
        }
    }

    private void CaptureLocation()
    {
        try
        {
            // Console.WriteLine($"Capturing Location {Kitty.CurrentStats.ChronoSphereCD}");
            LocationCaptureTimer.Timer.Start(LOCATION_CAPTURE_INTERVAL, false, CaptureLocation);
            if (Kitty.CurrentStats.ChronoSphereCD) return;
            var unit = Kitty.Unit;
            CapturedLocation = (unit.X, unit.Y, unit.Facing);
            LocationEffect = effect.Create(LocationSaveEffectPath, unit.X, unit.Y);
            LocationEffect.Scale = 0.55f;
            LocationEffect.Dispose();
        }
        catch (Exception er)
        {
            Logger.Warning($"Error in ChronoSphere.CaptureLocation: {er.Message}");
        }
    }

    private float RandomMagnitude()
    {
        var upgradeLevel = PlayerUpgrades.GetPlayerUpgrades(Kitty.Player).GetUpgradeLevel(typeof(ChronoSphere));
        var lowerBound = MAGNITUDE_LOWER_BOUND / 100.0f * -1.0f;
        var upperBound = MAGNITUDE_UPPER_BOUND / 100.0f * -1.0f;
        if (upgradeLevel == 0) return lowerBound;
        return GetRandomReal(upperBound, lowerBound); // as weird as this is.. yes.
    }

    private void RewindTime()
    {
        try
        {
            Kitty.Invulnerable = true;
            var x = CapturedLocation.Item1;
            var y = CapturedLocation.Item2;
            if (x == 0 && y == 0)
            {
                x = Kitty.Unit.X;
                y = Kitty.Unit.Y;
            }
            Kitty.Unit.SetPosition(x, y);
            Kitty.Unit.SetFacing(CapturedLocation.Item3);
            Kitty.Unit.IsPaused = true;
            Utility.SelectUnitForPlayer(Kitty.Player, Kitty.Unit);

            if (Kitty.Player.IsLocal) PanCameraToTimed(Kitty.Unit.X, Kitty.Unit.Y, 0.0f);
            Utility.SimpleTimer(2.0f, () =>
            {
                Kitty.Unit.IsPaused = false;
                Utility.SimpleTimer(1.0f, () => Kitty.Invulnerable = false);
            });
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in ChronoSphere.RewindTime: {e.Message}");
        }
    }

    public static bool RewindDeath(Kitty kitty)
    {
        try
        {
            if (Gamemode.CurrentGameMode != "Standard") return false; // Only for Standard.
            if (kitty.ProtectionActive) return false; // Don't rewind if ultimate has been casted.
            if (!Utility.UnitHasItem(kitty.Unit, Constants.ITEM_CHRONO_ORB)) return false;
            var relic = kitty.Relics.Find(IsChronoSphere) as ChronoSphere;
            if (relic == null) return false;
            if (kitty.CurrentStats.ChronoSphereCD) return false;
            var upgradeLevel = PlayerUpgrades.GetPlayerUpgrades(kitty.Player).GetUpgradeLevel(typeof(ChronoSphere));
            if (upgradeLevel < 2) return false;
            relic.RewindTime();
            kitty.CurrentStats.ChronoSphereCD = true;
            Utility.SimpleTimer(REWIND_COOLDOWN, () =>
            {
                kitty.CurrentStats.ChronoSphereCD = false;
                kitty.Player.DisplayTimedTextTo(1.0f, $"{Colors.COLOR_LAVENDER}Chrono Sphere recharged|r");
                relic?.LocationCaptureTimer?.Timer.Start(0, false, relic.CaptureLocation);
            });
            return true;
        }
        catch (Exception e)
        {
            Logger.Warning($"Error in ChronoSphere.RewindDeath: {e.Message}");
            return false;
        }
    }
}
