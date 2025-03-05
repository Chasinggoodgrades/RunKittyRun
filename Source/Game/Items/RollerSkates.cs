using System;
using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class RollerSkates
{
    private static trigger OnUseTrigger;
    private static List<player> RollerSkaters;

    public static void Initialize()
    {
        RollerSkaters = new List<player>();
        OnUseTrigger = trigger.Create();
        Blizzard.TriggerRegisterAnyUnitEventBJ(OnUseTrigger, playerunitevent.UseItem);
        OnUseTrigger.AddCondition(Condition(() => @event.ManipulatedItem.TypeId == Constants.ITEM_PEGASUS_BOOTS));
        OnUseTrigger.AddAction(SwitchingBoots);
    }

    private static void SwitchingBoots()
    {
        var unit = @event.Unit;
        var item = @event.ManipulatedItem;
        var slider = Globals.ALL_KITTIES[unit.Owner].Slider;

        if (RollerSkaters.Contains(unit.Owner))
        {
            SetRollerSkates(item);
            slider.StopSlider();
            RollerSkaters.Remove(unit.Owner);
        }
        else
        {
            SetPegasusBoots(item);
            if (slider.IsEnabled())
                slider.ResumeSlider();
            else
                slider.StartSlider();
            RollerSkaters.Add(unit.Owner);
        }
    }

    private static void SetPegasusBoots(item item)
    {
        item.Name = "Pegasus Boots";
    }

    private static void SetRollerSkates(item item)
    {
        item.Name = $"{Colors.COLOR_ORANGE}[Roller Skates]{Colors.COLOR_RESET} Pegasus Boots";
    }
}
