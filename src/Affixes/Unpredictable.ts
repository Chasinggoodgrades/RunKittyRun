export class Unpredictable extends Affix {
    private AFFIX_ABILITY: number = Constants.ABILITY_UNPREDICTABLE
    private static WANDER_ABILITY: number = FourCC('Awan')

    public constructor(unit: Wolf) {
        super(unit)
        Name = 'Unpredictable'
    }

    public override Apply() {
        UnitAddAbility(this.Unit.Unit, this.WANDER_ABILITY) // Wander
        UnitAddAbility(this.Unit.Unit, this.AFFIX_ABILITY)
        Unit.OVERHEAD_EFFECT_PATH = ''
        super.Apply()
    }

    public override Remove() {
        UnitRemoveAbility(this.Unit.Unit, this.WANDER_ABILITY) // Wander
        UnitRemoveAbility(this.Unit.Unit, this.AFFIX_ABILITY)
        Unit.OVERHEAD_EFFECT_PATH = Wolf.DEFAULT_OVERHEAD_EFFECT
        super.Remove()
    }

    public override Pause(pause: boolean) {}
}
