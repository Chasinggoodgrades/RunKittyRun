export class Stealth extends Affix {
    private AFFIX_ABILITY: number = Constants.ABILITY_GHOSTAFFIX

    public constructor(unit: Wolf) {
        super(unit)
        name = '{Colors.COLOR_GREY}Stealth|r'
    }

    public override Apply() {
        this.Unit.Unit.addAbility(this.AFFIX_ABILITY)
        this.Unit.Unit.addAbility(this.AFFIX_ABILITY)
        super.Apply()
    }

    public override Remove() {
        this.Unit.Unit.removeAbility(this.AFFIX_ABILITY)
        super.Remove()
    }

    public override Pause(pause: boolean) {
        // no logic needed atm
    }
}
