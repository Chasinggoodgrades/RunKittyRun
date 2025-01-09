using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public class ChronoSphere : Relic
{
    public const int RelicItemID = Constants.ITEM_CHRONO_ORB;
    public const int RelicAbilityID = Constants.ABILITY_THE_AURA_OF_THE_RING;
    private static new string IconPath = "ReplaceableTextures\\CommandButtons\\BTNChrono Orb.dds";
    private const string LocationSaveEffectPath = "war3mapImported\\ChronoLocationSave.mdx";
    private const int RelicCost = 650;
    private const float SLOW_AURA_RADIUS = 400.0f;
    private const float MAGNITUDE_CHANGE_INTERVAL = 15.0f;
    private const float MAGNITUDE_LOWER_BOUND = 10.0f;
    private const float MAGNITUDE_UPPER_BOUND = 15.0f;
    private const float LOCATION_CAPTURE_INTERVAL = 5.0f;
    //private static List <player> OnCooldown = new List<player>();

    private ability Ability;
    private player Owner;
    private timer MagnitudeTimer;
    private timer LocationCaptureTimer;
    private effect LocationEffect;
    private (float, float, float) CapturedLocation; // x, y, facing
    private bool OnCooldown = false;

    public ChronoSphere() : base(
        $"{Colors.COLOR_YELLOW}Chrono Sphere",
        $"Slows time around you, slowing wolves by 10% within {(int)SLOW_AURA_RADIUS} yards.{Colors.COLOR_LIGHTBLUE}(Passive)|r",
        RelicAbilityID,
        RelicItemID,
        RelicCost,
        IconPath
        )
    {
        Upgrades.Add(new RelicUpgrade(0, $"Every {MAGNITUDE_CHANGE_INTERVAL.ToString("F2")} seconds, the magnitude of the slowing aura will change between {MAGNITUDE_LOWER_BOUND.ToString("F2")}% - {MAGNITUDE_UPPER_BOUND.ToString("F2")}% effectiveness.", 15, 800));
        Upgrades.Add(new RelicUpgrade(1, $"Every {LOCATION_CAPTURE_INTERVAL.ToString("F2")} seconds, your location is captured. If you were to die, you'll reverse time to that location. {Colors.COLOR_LIGHTBLUE}(1min 30sec cooldown)|r", 20, 1000));
    }

    public override void ApplyEffect(unit Unit)
    {
        var item = Utility.UnitGetItem(Unit, RelicItemID);
        item.AddAbility(RelicAbilityID);
        Owner = Unit.Owner;
        Ability = item.GetAbility(RelicAbilityID);
        RotatingSlowAura();
        RotatingLocationCapture();
    }

    public override void RemoveEffect(unit Unit)
    {
        MagnitudeTimer?.Pause();
        MagnitudeTimer?.Dispose();
        LocationCaptureTimer?.Pause();
        LocationCaptureTimer?.Dispose();
        LocationEffect?.Dispose();
    }

    private void SetAbilityData()
    {
        Ability.SetMovementSpeedIncreasePercent_Oae1(0, RandomMagnitude());
        Ability.SetAreaOfEffect_aare(0, SLOW_AURA_RADIUS);
    }

    // Upgrade level 1, rotating aura slow 
    private void RotatingSlowAura()
    {
        var upgradeLevel = PlayerUpgrades.GetPlayerUpgrades(Globals.ALL_KITTIES[Owner].Player).GetUpgradeLevel(typeof(ChronoSphere));
        if(upgradeLevel <= 0) return;
        MagnitudeTimer = timer.Create();
        MagnitudeTimer.Start(MAGNITUDE_CHANGE_INTERVAL, true, () => SetAbilityData());
        SetAbilityData();
    }

    // Upgrade Level 2 Location Capture
    private void RotatingLocationCapture()
    {
        var upgradeLevel = PlayerUpgrades.GetPlayerUpgrades(Globals.ALL_KITTIES[Owner].Player).GetUpgradeLevel(typeof(ChronoSphere));
        if(upgradeLevel <= 1) return;
        LocationCaptureTimer = timer.Create();
        LocationCaptureTimer.Start(LOCATION_CAPTURE_INTERVAL, true, () => CaptureLocation());
        CaptureLocation();
    }

    private void CaptureLocation()
    {
        var unit = Globals.ALL_KITTIES[Owner].Unit;
        CapturedLocation = (unit.X, unit.Y, unit.Facing);
        LocationEffect = effect.Create(LocationSaveEffectPath, unit.X, unit.Y);
        Utility.SimpleTimer(0.25f, LocationEffect.Dispose);
    }

    private float RandomMagnitude()
    {
        var upgradeLevel = PlayerUpgrades.GetPlayerUpgrades(Globals.ALL_KITTIES[Owner].Player).GetUpgradeLevel(typeof(ChronoSphere));
        var lowerBound = (MAGNITUDE_LOWER_BOUND / 100.0f) * -1.0f;
        var upperBound = (MAGNITUDE_UPPER_BOUND / 100.0f) * -1.0f;
        if(upgradeLevel == 0) return lowerBound;
        return GetRandomReal(lowerBound, upperBound);
    }

    private void RewindTime()
    {
        var kitty = Globals.ALL_KITTIES[Owner];
        kitty.Invulnerable = true;
        kitty.Unit.SetPosition(CapturedLocation.Item1, CapturedLocation.Item2);
        kitty.Unit.SetFacing(CapturedLocation.Item3);
        kitty.Unit.IsPaused = true;
        
        if(kitty.Player.IsLocal) PanCameraToTimed(kitty.Unit.X, kitty.Unit.Y, 0.0f);
        Utility.SimpleTimer(2.0f, () =>
        { 
            kitty.Unit.IsPaused = false;
            Utility.SimpleTimer(1.0f, () => kitty.Invulnerable = false);
        });
    }

    public static bool RewindDeath(unit unit)
    {
        var relic = Globals.ALL_KITTIES[unit.Owner].Relics.Find(r => r is ChronoSphere) as ChronoSphere;
        if(relic == null) return false;
        if(relic.OnCooldown) return false;
        var upgradeLevel = PlayerUpgrades.GetPlayerUpgrades(unit.Owner).GetUpgradeLevel(typeof(ChronoSphere));
        if(upgradeLevel < 2) return false;
        relic.RewindTime();
        relic.OnCooldown = true;
        Utility.SimpleTimer(90.0f, () => relic.OnCooldown = false);
        return true;
    }

}