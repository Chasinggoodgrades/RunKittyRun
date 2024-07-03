using System;
using System.Collections.Generic;
using System.Drawing;
using WCSharp.Api;
using WCSharp.Events;
using WCSharp.Shared;
using WCSharp.Shared.Data;
using WCSharp.Sync;
using static WCSharp.Api.Common;


public static class VictoryZone
{
    private static trigger InVictoryArea;
    public static void Initialize()
    {
        InVictoryArea = CreateTrigger();
        VictoryAreaTrigger();
    }

    private static void VictoryAreaEntered()
    {
        VictoryAreaActions();
    }

    private static bool VictoryAreaConditions()
    {
        var u = GetEnteringUnit();
        return VictoryAreaConditionsStandard(u) || VictoryAreaConditionsTeam(u) || VictoryAreaConditionsSolo(u);
    }

    private static void VictoryAreaTrigger()
    {
        var VictoryArea = Regions.Victory_Area.Region;
        TriggerRegisterEnterRegion(InVictoryArea, VictoryArea, Filter(() => VictoryAreaConditions()));
        TriggerAddAction(InVictoryArea, VictoryAreaEntered);
    }

    private static void VictoryAreaActions()
    {
        if(Gamemode.CurrentGameMode == Globals.GAME_MODES[0])
        {
            RoundManager.RoundEnd();
        }
        else if(Gamemode.CurrentGameMode == Globals.GAME_MODES[1])
        {
            // Move player to start, save their time. Wait for everyone to finish.
        }
        else if(Gamemode.CurrentGameMode == Globals.GAME_MODES[2])
        {
            // Move all team members to the start, save their time. Wait for all teams to finish.
        }
    }

    private static bool VictoryAreaConditionsStandard(unit u)
    {
        // Whoever enters .. Great. Finish.
        if (Gamemode.CurrentGameMode != Globals.GAME_MODES[0]) return false;
        return true;
    }

    private static bool VictoryAreaConditionsSolo(unit u)
    {
        // If solo player enters.. Great. Done.
        if (Gamemode.CurrentGameMode != Globals.GAME_MODES[1]) return false;
        return true;
    }

    private static bool VictoryAreaConditionsTeam(unit u)
    {
        // If a team enters the area, check if all the members of the team are in the area.
        if (Gamemode.CurrentGameMode != Globals.GAME_MODES[2]) return false;
        var team = Globals.ALL_KITTIES[GetOwningPlayer(u)].TeamID;
        foreach (var player in Globals.ALL_TEAMS[team].Teammembers)
        {
            if (!Regions.Victory_Area.Region.Contains(Globals.ALL_KITTIES[player].Unit)) return false;
        }
        return true;
    }
}
