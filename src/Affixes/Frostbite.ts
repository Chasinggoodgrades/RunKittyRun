

class Frostbite extends Affix
{
    private FROSTBITE_RADIUS: number = 500.0;
    private FROSTBITE_SPEED_REDUCTION: number = 0.83;
    private AFFIX_ABILITY: number = Constants.ABILITY_FROSTBITE;
    private static ADRENALINE_POTION_ABILITY: number = FourCC("Bspe");
    private FROSTBITE_TARGET_EFFECT: string = "Abilities\\Spells\\Undead\\FrostArmor\\FrostArmorTarget.mdl";
    private InRangeTrigger: trigger;
    private PeriodicRangeTrigger: trigger;
    private List<Frostbitten> FrostbittenKitties = new List<Frostbitten>();

    public Frostbite(unit: Wolf) // TODO; CALL super(unit)
    {
        Name = "{Colors.COLOR_LIGHTBLUE}Frostbite|r";
        InRangeTrigger ??= trigger.Create();
        PeriodicRangeTrigger ??= trigger.Create();
    }

    public override Apply()
    {
        Unit.Unit.SetVertexColor(80, 140, 250);
        Unit.Unit.AddAbility(AFFIX_ABILITY);
        RegisterEvents();
        base.Apply();
    }

    public override Remove()
    {
        try
        {
            Unit.Unit.SetVertexColor(150, 120, 255);
            Unit.Unit.RemoveAbility(AFFIX_ABILITY);
            GC.RemoveTrigger( InRangeTrigger); // TODO; Cleanup:             GC.RemoveTrigger(ref InRangeTrigger);
            GC.RemoveTrigger( PeriodicRangeTrigger); // TODO; Cleanup:             GC.RemoveTrigger(ref PeriodicRangeTrigger);
            RemoveAllEffects();
            GC.RemoveList( FrostbittenKitties); // TODO; Cleanup:             GC.RemoveList(ref FrostbittenKitties);
            base.Remove();
        }
        catch (e: Error)
        {
            Logger.Warning("Error in Frostbite.Remove: {e.Message}");
            throw new Error() // TODO; Rethrow actual error
        }
    }

    private RemoveAllEffects()
    {
        if (FrostbittenKitties == null || FrostbittenKitties.Count == 0) return;
        try
        {
            for (let i: number = 0; i < FrostbittenKitties.Count; i++)
            {
                let frostbitten = FrostbittenKitties[i];
                frostbitten.Dispose();
            }
            FrostbittenKitties.Clear();
        }
        catch (e: Error)
        {
            Logger.Warning("Error in Frostbite.RemoveAllEffects: {e.Message}");
            throw new Error() // TODO; Rethrow actual error
        }
    }

    private RegisterEvents()
    {
        PeriodicRangeTrigger.RegisterTimerEvent(0.3, true);
        PeriodicRangeTrigger.AddAction(PeriodicRangeCheck);
        InRangeTrigger.RegisterUnitInRange(Unit.Unit, FROSTBITE_RADIUS, FilterList.KittyFilter);
        InRangeTrigger.AddAction(() =>
        {
            let target = GetTriggerUnit();
            if (!target.Alive) return; // must be alive
            if (!RegionList.WolfRegions[Unit.RegionIndex].Contains(target.X, target.Y)) return; // must be in same lane
            SlowEffect(target);
        });
    }

    private PeriodicRangeCheck()
    {
        if (FrostbittenKitties == null || FrostbittenKitties.Count == 0) return;
        try
        {
            for (let i: number = FrostbittenKitties.Count - 1; i >= 0; i--) // if go backwards, can avoid loop index issues
            {
                let frostbitten = FrostbittenKitties[i];

                if (frostbitten.Kitty.Unit.IsInRange(Unit.Unit, FROSTBITE_RADIUS)) continue;

                frostbitten.Dispose();
                FrostbittenKitties.RemoveAt(i);
            }

        }
        catch (e: Error)
        {
            Logger.Warning("Error in Frostbite.PeriodicRangeCheck: {e.Message}");
        }
    }

    private SlowEffect(target: unit)
    {
        if (target.GetAbilityLevel(ADRENALINE_POTION_ABILITY) > 0) return; // Adrenaline Potion
        if (Utility.UnitHasItem(target, Constants.ITEM_FROSTBITE_RING)) return; // Frostbite ring
        let k: Kitty = Globals.ALL_KITTIES[target.Owner];
        if (k.KittyMiscInfo.FrostBitten != null) return; // already bitten.
        let frostBittenObject: Frostbitten = k.KittyMiscInfo.FrostBitten = ObjectPool.GetEmptyObject<Frostbitten>();
        frostBittenObject.OriginalSpeed = target.DefaultMovementSpeed;
        frostBittenObject.Effect = effect.Create(FROSTBITE_TARGET_EFFECT, target, "chest");
        frostBittenObject.Kitty = k;
        target.MovementSpeed = target.DefaultMovementSpeed * FROSTBITE_SPEED_REDUCTION;
        FrostbittenKitties.Add(frostBittenObject);
    }

    public override Pause(pause: boolean)
    {
        // no logic needed atm.
    }

}

class Frostbitten extends IDisposable
{
    public Effect: effect 
    public OriginalSpeed: number 
    public Kitty: Kitty 

    public Frostbitten()
    {
        Effect = null;
        OriginalSpeed = 0.0;
    }

    public Dispose()
    {
        Kitty.Unit.MovementSpeed = OriginalSpeed != 0 ? OriginalSpeed : Kitty.Unit.DefaultMovementSpeed;
        Effect?.Dispose();
        Effect = null;
        OriginalSpeed = 0.0;
        Kitty.KittyMiscInfo.FrostBitten = null;
        ObjectPool<Frostbitten>.ReturnObject(this);
    }

}
