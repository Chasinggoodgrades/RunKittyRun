class Howler extends Affix {
    private HOWL_RADIUS: number = 900.0
    private AFFIX_ABILITY: number = Constants.ABILITY_HOWLER
    private ROAR_EFFECT: string = 'Abilities\\Spells\\NightElf\\BattleRoar\\RoarCaster.mdl'
    private MIN_HOWL_TIME: number = 10.0
    private MAX_HOWL_TIME: number = 20.0
    private HowlTimer: AchesTimers
    private NearbyWolves: group = group.Create()

    public Howler(unit: Wolf) {
        // TODO; CALL super(unit)
        Name = '{Colors.COLOR_BLUE}Howler|r'
    }

    public override Apply() {
        RegisterTimerEvents()
        Unit.Unit.AddAbility(AFFIX_ABILITY)
        Unit.Unit.SetVertexColor(25, 25, 112)
        base.Apply()
    }

    public override Remove() {
        SetUnitVertexColor(Unit.Unit, 150, 120, 255, 255)
        Unit.Unit.RemoveAbility(AFFIX_ABILITY)
        HowlTimer?.Dispose()
        GC.RemoveGroup(NearbyWolves) // TODO; Cleanup:         GC.RemoveGroup(ref NearbyWolves);
        base.Remove()
    }

    public override Pause(pause: boolean) {
        HowlTimer.Pause(pause)
    }

    private RegisterTimerEvents() {
        HowlTimer = ObjectPool.GetEmptyObject<AchesTimers>()
        HowlTimer.Timer.Start(GetRandomHowlTime(), false, Howl)
    }

    private Howl() {
        try {
            HowlTimer.Timer.Start(GetRandomHowlTime(), false, Howl)
            if (Unit.IsPaused) return
            Utility.CreateEffectAndDispose(ROAR_EFFECT, Unit.Unit, 'origin')
            NearbyWolves.EnumUnitsInRange(Unit.Unit.X, Unit.Unit.Y, HOWL_RADIUS, FilterList.DogFilter)
            while (true) {
                let wolf = NearbyWolves.First
                if (wolf == null) break
                NearbyWolves.Remove(wolf)
                if (NamedWolves.StanWolf != null && NamedWolves.StanWolf.Unit == wolf) continue
                if (wolf.IsPaused) continue
                if (!(wolfObject = Globals.ALL_WOLVES.TryGetValue(wolf)) /* TODO; Prepend: let */) continue
                if (wolfObject.RegionIndex != Unit.RegionIndex) continue
                wolfObject.StartWandering(true) // Start wandering
            }
            NearbyWolves.Clear()
        } catch (e: Error) {
            Logger.Warning('Error in Howl: {e.Message}')
            throw new Error() // TODO; Rethrow actual error
        }
    }

    private static GetRandomHowlTime(): number {
        return GetRandomReal(MIN_HOWL_TIME, MAX_HOWL_TIME)
    }
}
