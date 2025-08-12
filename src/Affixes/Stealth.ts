export class Stealth extends Affix {
    private AFFIX_ABILITY: number = Constants.ABILITY_GHOSTAFFIX

    public constructor(unit: Wolf) {
        super(unit)
        Name = '{Colors.COLOR_GREY}Stealth|r'
    }

    public override Apply() {
        UnitAddAbility(this.Unit.Unit, this.AFFIX_ABILITY)
        UnitAddAbility(this.Unit.Unit, this.AFFIX_ABILITY)
        super.Apply()
    }

    public override Remove() {
        UnitRemoveAbility(this.Unit.Unit, this.AFFIX_ABILITY)
        super.Remove()
    }

    public override Pause(pause: boolean) {
        // no logic needed atm
    }
}
