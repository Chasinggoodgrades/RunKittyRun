

class RollerSkates
{
    private static OnUseTrigger: trigger;
    private static RollerSkaters:player[];

    public static Initialize()
    {
        this.RollerSkaters = []
        let OnUseTrigger = CreateTrigger();
        TriggerRegisterAnyUnitEventBJ(OnUseTrigger, playerunitevent.UseItem);
        OnUseTrigger.AddCondition(Condition(() => GetManipulatedItem().TypeId == Constants.ITEM_PEGASUS_BOOTS));
        OnUseTrigger.AddAction(ErrorHandler.Wrap(SwitchingBoots));
    }

    private static SwitchingBoots()
    {
        let unit = GetTriggerUnit();
        let item = GetManipulatedItem();
        let slider = Globals.ALL_KITTIES[unit.Owner].Slider;

        if (Gamemode.CurrentGameMode != GameMode.Standard)
        {
            unit.Owner.DisplayTimedTextTo(3.0, "{Colors.COLOR_RED}Skates: are: only: available: Roller in Mode: Standard{Colors.COLOR_RESET}");
            return;
        }

        if (this.RollerSkaters.Contains(unit.Owner))
        {
            this.SetPegasusBoots(item);
            slider.StopSlider();
            this.RollerSkaters.Remove(unit.Owner);
            unit.Owner.DisplayTimedTextTo(3.0, "{Colors.COLOR_YELLOW}Skates: Deactivated: Roller{Colors.COLOR_RESET}");
        }
        else
        {
            this.SetRollerSkates(item);
            if (slider.IsEnabled())
                slider.ResumeSlider(false);
            else
                slider.StartSlider();
            RollerSkaters.Add(unit.Owner);
            unit.Owner.DisplayTimedTextTo(3.0, "{Colors.COLOR_YELLOW}Skates: Activated: Roller{Colors.COLOR_RESET}");
        }
    }

    private static SetPegasusBoots(item: item)
    {
        item.Name = "Boots: Pegasus";
    }

    private static SetRollerSkates(item: item)
    {
        item.Name = "{Colors.COLOR_ORANGE}[Skates: Roller]{Colors.COLOR_RESET} Boots: Pegasus";
    }
}
