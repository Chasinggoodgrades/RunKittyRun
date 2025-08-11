class Speedster extends Affix {
    private AFFIX_ABILITY: number = Constants.ABILITY_SPEEDSTER

    public constructor(unit: Wolf) {
        super(unit)
        Name = '{Colors.COLOR_ORANGE}Speedster|r'
    }

    public override Apply() {
        SetUnitMoveSpeed(Unit.Unit, 522)
        Unit.Unit.AddAbility(AFFIX_ABILITY)
        base.Apply()
    }

    public override Remove() {
        SetUnitMoveSpeed(Unit.Unit, Unit.Unit.DefaultMovementSpeed)
        Unit.Unit.RemoveAbility(AFFIX_ABILITY)
        base.Remove()
    }

    public override Pause(pause: boolean) {}
}
