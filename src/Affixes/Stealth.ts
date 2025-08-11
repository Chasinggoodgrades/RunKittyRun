class Stealth extends Affix {
    private AFFIX_ABILITY: number = Constants.ABILITY_GHOSTAFFIX

    public constructor(unit: Wolf) {
        super(unit)
        Name = '{Colors.COLOR_GREY}Stealth|r'
    }

    public override Apply() {
        Unit.Unit.AddAbility(AFFIX_ABILITY)
        base.Apply()
    }

    public override Remove() {
        Unit.Unit.RemoveAbility(AFFIX_ABILITY)
        base.Remove()
    }

    public override Pause(pause: boolean) {
        // no logic needed atm
    }
}
