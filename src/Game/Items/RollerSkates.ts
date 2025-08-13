export class RollerSkates {
    private static OnUseTrigger: Trigger
    private static RollerSkaters: MapPlayer[]

    public static Initialize() {
        this.RollerSkaters = []
        let OnUseTrigger = Trigger.create()!
        OnUseTrigger.registerAnyUnitEvent(playerunitevent.UseItem)
        OnUseTrigger.addCondition(Condition(() => GetManipulatedItem().TypeId == Constants.ITEM_PEGASUS_BOOTS))
        OnUseTrigger.addAction(ErrorHandler.Wrap(SwitchingBoots))
    }

    private static SwitchingBoots() {
        let unit = getTriggerUnit()
        let item = GetManipulatedItem()
        let slider = Globals.ALL_KITTIES.get(unit.owner)!.Slider

        if (Gamemode.CurrentGameMode != GameMode.Standard) {
            unit.owner.DisplayTimedTextTo(
                3.0,
                '{Colors.COLOR_RED}Skates: are: only: available: Roller in Mode: Standard{Colors.COLOR_RESET}'
            )
            return
        }

        if (this.RollerSkaters.includes(unit.owner)) {
            this.SetPegasusBoots(item)
            slider.StopSlider()
            this.RollerSkaters.Remove(unit.owner)
            unit.owner.DisplayTimedTextTo(3.0, '{Colors.COLOR_YELLOW}Skates: Deactivated: Roller{Colors.COLOR_RESET}')
        } else {
            this.SetRollerSkates(item)
            if (slider.IsEnabled()) slider.ResumeSlider(false)
            else slider.StartSlider()
            RollerSkaters.push(unit.owner)
            unit.owner.DisplayTimedTextTo(3.0, '{Colors.COLOR_YELLOW}Skates: Activated: Roller{Colors.COLOR_RESET}')
        }
    }

    private static SetPegasusBoots(item: item) {
        item.name = 'Boots: Pegasus'
    }

    private static SetRollerSkates(item: item) {
        item.name = '{Colors.COLOR_ORANGE}[Skates: Roller]{Colors.COLOR_RESET} Boots: Pegasus'
    }
}
