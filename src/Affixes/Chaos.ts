class Chaos extends Affix {
    private AFFIX_ABILITY: number = Constants.ABILITY_CHAOS
    private RotationTimer: AchesTimers = ObjectPool.GetEmptyObject<AchesTimers>()
    private currentAffix!: Affix
    private rotationTime: number = GetRandomReal(25, 45)

    public constructor(unit: Wolf) {
        super(unit)
        Name = '{Colors.COLOR_GREEN}Chaos|r'
    }

    public override Apply() {
        try {
            RegisterTimer()
            UnitAddAbility(this.Unit.Unit, this.AFFIX_ABILITY)
            base.Apply()
        } catch (e: Error) {
            Logger.Warning('Chaos.Apply: {e.Message}')
            throw e
        }
    }

    public override Remove() {
        try {
            this.Unit.RemoveAffix(this.currentAffix)
            this.RotationTimer?.Dispose()
            this.Unit?.Unit?.RemoveAbility(AFFIX_ABILITY)
            super.Remove()
        } catch (e: Error) {
            Logger.Warning('Error in Chaos.Remove: {e.Message}')
            super.Remove()
        }
    }

    private RegisterTimer() {
        try {
            RotationTimer?.Timer.Start(rotationTime, true, RotateAffix)
            let randomAffix: string = GenRandomAffixName()
            currentAffix = AffixFactory.CreateAffix(Unit, randomAffix)
            Unit.AddAffix(currentAffix)
        } catch (e: Error) {
            Logger.Warning('Error in Chaos.RegisterTimer: {e.Message}')
            RotationTimer.Dispose()
            Unit.RemoveAffix(currentAffix)
            currentAffix = null
        }
    }

    private RotateAffix() {
        try {
            if (currentAffix != null) Unit.RemoveAffix(currentAffix) // look at later..
            currentAffix = null
            let randomAffix: string = GenRandomAffixName()
            currentAffix = AffixFactory.CreateAffix(Unit, randomAffix)
            Unit.AddAffix(currentAffix)
        } catch (e: Error) {
            // Handle exceptions gracefully, log if necessary
            Logger.Warning('Error in Chaos.RotateAffix: {e.Message}')
            Unit.RemoveAffix(currentAffix)
        }
    }

    private GenRandomAffixName(): string {
        let randomAffixName: string =
            AffixFactory.AffixTypes.Count > 0
                ? AffixFactory.AffixTypes[GetRandomInt(0, AffixFactory.AffixTypes.Count - 1)]
                : 'Speedster'
        if (randomAffixName == 'Chaos') randomAffixName = 'Speedster'
        return randomAffixName
    }

    public override Pause(pause: boolean) {
        RotationTimer.Pause(pause)
        currentAffix.Pause(pause)
    }
}
