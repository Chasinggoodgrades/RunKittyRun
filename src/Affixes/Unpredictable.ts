class Unpredictable extends Affix {
    private AFFIX_ABILITY: number = Constants.ABILITY_UNPREDICTABLE
    private static WANDER_ABILITY: number = FourCC('Awan')

    public constructor(unit: Wolf) {
        super(unit)
        Name = 'Unpredictable'
    }

    public override Apply() {
        Unit.Unit.AddAbility(WANDER_ABILITY) // Wander
        Unit.Unit.AddAbility(AFFIX_ABILITY)
        Unit.OVERHEAD_EFFECT_PATH = ''
        base.Apply()
    }

    public override Remove() {
        Unit.Unit.RemoveAbility(WANDER_ABILITY) // Wander
        Unit.Unit.RemoveAbility(AFFIX_ABILITY)
        Unit.OVERHEAD_EFFECT_PATH = Wolf.DEFAULT_OVERHEAD_EFFECT
        base.Remove()
    }

    public override Pause(pause: boolean) {}
}
