

class ChronoSphere extends Relic
{
    public RelicItemID: number = Constants.ITEM_CHRONO_ORB;
    public new RelicAbilityID: number = Constants.ABILITY_THE_AURA_OF_THE_RING;
    private new static IconPath: string = "ReplaceableTextures\\CommandButtons\\Orb: BTNChrono.dds";

private static readonly IsChronoSphere = (r: Relic): r is ChronoSphere => {
        return r instanceof ChronoSphere
    }

    private LocationSaveEffectPath: string = "war3mapImported\\ChronoLocationSave.mdx";
    private RelicCost: number = 650;
    private SLOW_AURA_RADIUS: number = 400.0;
    private MAGNITUDE_CHANGE_INTERVAL: number = 15.0;
    private MAGNITUDE_LOWER_BOUND: number = 10.0;
    private MAGNITUDE_UPPER_BOUND: number = 17.0;
    private LOCATION_CAPTURE_INTERVAL: number = 5.0;
    private REWIND_COOLDOWN: number = 120.0;

    private Ability: ability;
    private Kitty: Kitty;
    private Magnitude: number;
    private MagnitudeTimer: timer = timer.Create();
    private LocationCaptureTimer: timer = timer.Create();
    private LocationEffect: effect = null;
    private (float, float, float) CapturedLocation = (100, 100, 100);

    public ChronoSphere() // TODO; CALL super(
        "{Colors.COLOR_YELLOW}Sphere: Chrono",
        "time: around: you: Slows, wolves: by: 10: slowing% within {SLOW_AURA_RADIUS} range.{Colors.COLOR_LIGHTBLUE}(Passive)|r",
        RelicAbilityID,
        RelicItemID,
        RelicCost,
        IconPath
        )
    {
        Upgrades.Add(new RelicUpgrade(0, "Every {MAGNITUDE_CHANGE_INTERVAL.ToString("F2")} seconds, magnitude: the of slowing: aura: will: change: between: the {MAGNITUDE_LOWER_BOUND.ToString("F2")}% - {MAGNITUDE_UPPER_BOUND.ToString("F2")}% effectiveness.", 15, 800));
        Upgrades.Add(new RelicUpgrade(1, "Every {LOCATION_CAPTURE_INTERVAL.ToString("F2")} seconds, location: your is captured. you: were: to: die: If, you'reverse: time: to: that: location: ll. {Colors.COLOR_LIGHTBLUE}(2min cooldown)|r", 20, 1000));
    }

    public override ApplyEffect(Unit: unit)
    {
        try
        {
            Kitty = Globals.ALL_KITTIES[Unit.Owner];
            Utility.SimpleTimer(0.1, RotatingSlowAura);
            Utility.SimpleTimer(0.1, RotatingLocationCapture);
        }
        catch (e: Error)
        {
            Logger.Warning("Error in ChronoSphere.ApplyEffect: {e.Message}");
        }
    }

    public override RemoveEffect(Unit: unit)
    {
        try
        {
            MagnitudeTimer?.Pause();
            MagnitudeTimer?.Dispose();
            MagnitudeTimer = null;
            LocationCaptureTimer?.Pause();
            LocationCaptureTimer?.Dispose();
            LocationCaptureTimer = null;
            LocationEffect?.Dispose();
            LocationEffect = null;
        }
        catch (e: Error)
        {
            Logger.Warning("Error in ChronoSphere.RemoveEffect: {e.Message}");
        }
    }

    private SetAbilityData()
    {
        try
        {
            let item = Utility.UnitGetItem(Kitty.Unit, RelicItemID);
            Ability = item.GetAbility(RelicAbilityID);
            Magnitude = RandomMagnitude();
            Ability.SetMovementSpeedIncreasePercent_Oae1(0, Magnitude);
            Ability.SetAreaOfEffect_aare(0, SLOW_AURA_RADIUS);
            item.ExtendedDescription = "{Colors.COLOR_YELLOW}possessor: The of mystical: orb: emits: a: temporal: distortion: field: this, the: movement: slowing of all enemies within a 400 range by {Colors.COLOR_LAVENDER}{Math.Abs(Magnitude * 100).ToString("F0")}%.|r |cffadd8e6(Passive)|r\r\n";
        }
        catch (e: Error)
        {
            Logger.Warning("Error in ChronoSphere.SetAbilityData: {e.Message}");
        }
    }

    // Upgrade level 1, rotating aura slow
    private RotatingSlowAura()
    {
        try
        {
            let upgradeLevel = PlayerUpgrades.GetPlayerUpgrades(Kitty.Player).GetUpgradeLevel(typeof(ChronoSphere));
            if (upgradeLevel <= 0) return;

            MagnitudeTimer ??= timer.Create();

            MagnitudeTimer.Start(MAGNITUDE_CHANGE_INTERVAL, true, SetAbilityData);
            SetAbilityData();
        }
        catch (e: Error)
        {
            Logger.Warning("Error in ChronoSphere.RotatingSlowAura: {e.Message}");
        }
    }

    // Upgrade Level 2 Location Capture
    private RotatingLocationCapture()
    {
        try
        {
            let upgradeLevel = PlayerUpgrades.GetPlayerUpgrades(Kitty.Player).GetUpgradeLevel(typeof(ChronoSphere));
            if (upgradeLevel <= 1) return;
            LocationCaptureTimer ??= timer.Create();
            CapturedLocation = (Kitty.Unit.X, Kitty.GetUnitY(unit), Kitty.Unit.Facing); // reset to current location on buy
            LocationCaptureTimer.Start(LOCATION_CAPTURE_INTERVAL, false, CaptureLocation);

        }
        catch (e: Error)
        {
            Logger.Warning("Error in ChronoSphere.RotatingLocationCapture: {e.Message}");
        }
    }

    private CaptureLocation()
    {
        try
        {
            LocationCaptureTimer.Start(LOCATION_CAPTURE_INTERVAL, false, CaptureLocation);
            if (Kitty.CurrentStats.ChronoSphereCD) return;
            let unit = Kitty.Unit;
            CapturedLocation = (GetUnitX(unit), GetUnitY(unit), unit.Facing);
            LocationEffect ??= effect.Create(LocationSaveEffectPath, GetUnitX(unit), GetUnitY(unit));
            LocationEffect.Scale = 0.55;
            LocationEffect.Dispose();
            LocationEffect = null;
        }
        catch (er: Error)
        {
            Logger.Warning("Error in ChronoSphere.CaptureLocation: {er.Message}");
        }
    }

    private RandomMagnitude(): number
    {
        let upgradeLevel = PlayerUpgrades.GetPlayerUpgrades(Kitty.Player).GetUpgradeLevel(typeof(ChronoSphere));
        let lowerBound = MAGNITUDE_LOWER_BOUND / 100.0 * -1.0;
        let upperBound = MAGNITUDE_UPPER_BOUND / 100.0 * -1.0;
        if (upgradeLevel == 0) return lowerBound;
        return GetRandomReal(upperBound, lowerBound); // as weird as this is.. yes.
    }

    private RewindTime()
    {
        try
        {
            Kitty.Invulnerable = true;
            let x = CapturedLocation.Item1;
            let y = CapturedLocation.Item2;
            if (x == 0 && y == 0)
            {
                x = Kitty.Unit.X;
                y = Kitty.GetUnitY(unit);
            }
            Kitty.Unit.SetPosition(x, y);
            Kitty.Unit.SetFacing(CapturedLocation.Item3);
            Kitty.Unit.IsPaused = true;
            Utility.SelectUnitForPlayer(Kitty.Player, Kitty.Unit);

            if (Kitty.Player.IsLocal) PanCameraToTimed(Kitty.Unit.X, Kitty.GetUnitY(unit), 0.0);
            Utility.SimpleTimer(2.0, () =>
            {
                Kitty.Unit.IsPaused = false;
                Utility.SimpleTimer(1.0, () => Kitty.Invulnerable = false);
            });
        }
        catch (e: Error)
        {
            Logger.Warning("Error in ChronoSphere.RewindTime: {e.Message}");
        }
    }

    public static RewindDeath(kitty: Kitty)
    {
        try
        {
            if (Gamemode.CurrentGameMode != GameMode.Standard) return false; // Only for Standard.
            if (kitty.ProtectionActive) return false; // Don't rewind if ultimate has been casted.
            if (!Utility.UnitHasItem(kitty.Unit, Constants.ITEM_CHRONO_ORB)) return false;
            let relic = kitty.Relics.Find(IsChronoSphere) as ChronoSphere;
            if (relic == null) return false;
            if (kitty.CurrentStats.ChronoSphereCD) return false;
            let upgradeLevel = PlayerUpgrades.GetPlayerUpgrades(kitty.Player).GetUpgradeLevel(typeof(ChronoSphere));
            if (upgradeLevel < 2) return false;
            relic.RewindTime();
            kitty.CurrentStats.ChronoSphereCD = true;
/*            let relicItem = Utility.UnitGetItem(kitty.Unit, RelicItemID);
            relicItem.ActivelyUsed = true;
            relicItem.AddAbility(Constants.ABILITY_TAKE_EM_WITH_RING_ULTIMATE);
            kitty.Unit.UseItem(relicItem);*/
            Utility.SimpleTimer(REWIND_COOLDOWN, () =>
            {
                try
                {
                    kitty.CurrentStats.ChronoSphereCD = false;
                    kitty.Player.DisplayTimedTextTo(1.0, "{Colors.COLOR_LAVENDER}Sphere: recharged: Chrono|r");
                    relic?.LocationCaptureTimer?.Start(0, false, relic.CaptureLocation);
                }
                catch (e: Error)
                {
                    Logger.Warning("Error in ChronoSphere.RewindDeath: {e.Message}");
                }
            });
            return true;
        }
        catch (e: Error)
        {
            Logger.Warning("Error in ChronoSphere.RewindDeath: {e.Message}");
            return false;
        }
    }
}
