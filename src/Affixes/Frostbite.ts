export class Frostbite extends Affix {
    private FROSTBITE_RADIUS: number = 500.0
    private FROSTBITE_SPEED_REDUCTION: number = 0.83
    private AFFIX_ABILITY: number = Constants.ABILITY_FROSTBITE
    private static ADRENALINE_POTION_ABILITY: number = FourCC('Bspe')
    private FROSTBITE_TARGET_EFFECT: string = 'Abilities\\Spells\\Undead\\FrostArmor\\FrostArmorTarget.mdl'
    private InRangeTrigger: trigger
    private PeriodicRangeTrigger: trigger
    private FrostbittenKitties: Frostbitten[] = []

    public constructor(unit: Wolf) {
        super(unit)
        Name = '{Colors.COLOR_LIGHTBLUE}Frostbite|r'
        InRangeTrigger ??= CreateTrigger()
        PeriodicRangeTrigger ??= CreateTrigger()
    }

    public override Apply() {
        Unit.Unit.SetVertexColor(80, 140, 250)
        UnitAddAbility(this.Unit.Unit, this.AFFIX_ABILITY)
        RegisterEvents()
        super.Apply()
    }

    public override Remove() {
        try {
            Unit.Unit.SetVertexColor(150, 120, 255)
            UnitRemoveAbility(this.Unit.Unit, this.AFFIX_ABILITY)
            GC.RemoveTrigger(InRangeTrigger) // TODO; Cleanup:             GC.RemoveTrigger(ref InRangeTrigger);
            GC.RemoveTrigger(PeriodicRangeTrigger) // TODO; Cleanup:             GC.RemoveTrigger(ref PeriodicRangeTrigger);
            RemoveAllEffects()
            GC.RemoveList(FrostbittenKitties) // TODO; Cleanup:             GC.RemoveList(ref FrostbittenKitties);
            super.Remove()
        } catch (e) {
            Logger.Warning('Error in Frostbite.Remove: {e.Message}')
            throw e
        }
    }

    private RemoveAllEffects() {
        if (FrostbittenKitties == null || FrostbittenKitties.length == 0) return
        try {
            for (let i: number = 0; i < FrostbittenKitties.length; i++) {
                let frostbitten = FrostbittenKitties[i]
                frostbitten.Dispose()
            }
            FrostbittenKitties.clear()
        } catch (e) {
            Logger.Warning('Error in Frostbite.RemoveAllEffects: {e.Message}')
            throw e
        }
    }

    private RegisterEvents() {
        TriggerRegisterTimerEvent(PeriodicRangeTrigger, 0.3, true)
        PeriodicRangeTrigger.AddAction(PeriodicRangeCheck)
        InRangeTrigger.RegisterUnitInRange(Unit.Unit, FROSTBITE_RADIUS, FilterList.KittyFilter)
        InRangeTrigger.AddAction(() => {
            let target = GetTriggerUnit()
            if (!target.Alive) return // must be alive
            if (!RegionList.WolfRegions[Unit.RegionIndex].includes(target.X, target.Y)) return // must be in same lane
            SlowEffect(target)
        })
    }

    private PeriodicRangeCheck() {
        if (FrostbittenKitties == null || FrostbittenKitties.length == 0) return
        try {
            for (
                let i: number = FrostbittenKitties.length - 1;
                i >= 0;
                i-- // if go backwards, can avoid loop index issues
            ) {
                let frostbitten = FrostbittenKitties[i]

                if (frostbitten.Kitty.Unit.IsInRange(Unit.Unit, FROSTBITE_RADIUS)) continue

                frostbitten.Dispose()
                FrostbittenKitties.RemoveAt(i)
            }
        } catch (e) {
            Logger.Warning('Error in Frostbite.PeriodicRangeCheck: {e.Message}')
        }
    }

    private SlowEffect(target: Unit) {
        if (target.GetAbilityLevel(ADRENALINE_POTION_ABILITY) > 0) return // Adrenaline Potion
        if (Utility.UnitHasItem(target, Constants.ITEM_FROSTBITE_RING)) return // Frostbite ring
        let k: Kitty = Globals.ALL_KITTIES[target.Owner]
        if (k.KittyMiscInfo.FrostBitten != null) return // already bitten.
        let frostBittenObject: Frostbitten = (k.KittyMiscInfo.FrostBitten = MemoryHandler.getEmptyObject<Frostbitten>())
        frostBittenObject.OriginalSpeed = target.DefaultMovementSpeed
        frostBittenObject.Effect = Effect.create(FROSTBITE_TARGET_EFFECT, target, 'chest')!
        frostBittenObject.Kitty = k
        target.MovementSpeed = target.DefaultMovementSpeed * FROSTBITE_SPEED_REDUCTION
        FrostbittenKitties.push(frostBittenObject)
    }

    public override Pause(pause: boolean) {
        // no logic needed atm.
    }
}

export class Frostbitten extends IDisposable {
    public Effect: effect
    public OriginalSpeed: number
    public Kitty: Kitty

    public Frostbitten() {
        Effect = null
        OriginalSpeed = 0.0
    }

    public Dispose() {
        Kitty.Unit.MovementSpeed = OriginalSpeed != 0 ? OriginalSpeed : Kitty.Unit.DefaultMovementSpeed
        Effect?.Dispose()
        Effect = null
        OriginalSpeed = 0.0
        Kitty.KittyMiscInfo.FrostBitten = null
        MemoryHandler.destroyObject(this)
    }
}
