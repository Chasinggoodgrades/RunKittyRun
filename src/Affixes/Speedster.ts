export class Speedster extends Affix {
    private AFFIX_ABILITY: number = Constants.ABILITY_SPEEDSTER

    public constructor(unit: Wolf) {
        super(unit)
        Name = '{Colors.COLOR_ORANGE}Speedster|r'
    }

    public override Apply() {
        SetUnitMoveSpeed(Unit.Unit, 522)
        UnitAddAbility(this.Unit.Unit, this.AFFIX_ABILITY)
        super.Apply()
    }

    public override Remove() {
        SetUnitMoveSpeed(Unit.Unit, Unit.Unit.DefaultMovementSpeed)
        UnitRemoveAbility(this.Unit.Unit, this.AFFIX_ABILITY)
        super.Remove()
    }

    public override Pause(pause: boolean) {}
}
