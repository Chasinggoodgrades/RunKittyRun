using System;
using System.Collections.Generic;
using System.Drawing;
using WCSharp.Api;
using static WCSharp.Api.Common;


public static class VictoryZone
{
    private static trigger InVictoryArea;
    public static void Initialize()
    {
        InVictoryArea = trigger.Create();
        VictoryAreaTrigger();
    }

    private static bool VictoryAreaConditions(unit u)
    {
        return VictoryAreaConditionsStandard(u) || VictoryAreaConditionsTeam(u) || VictoryAreaConditionsSolo(u);
    }

    private static void VictoryAreaTrigger()
    {
        var VictoryArea = Regions.Victory_Area.Region;
        InVictoryArea.RegisterEnterRegion(VictoryArea, Filter(() => VictoryAreaConditions(GetFilterUnit())));
        InVictoryArea.AddAction(VictoryAreaActions);
    }

    private static void VictoryAreaActions()
    {
        var u = @event.Unit;
        var player = u.Owner;
        if(u.UnitType != Constants.UNIT_KITTY) return;
        if (Gamemode.CurrentGameMode == "Standard") // Standard
        {
            if (Globals.ROUND == Gamemode.NumberOfRounds) Gameover.WinGame = true;
            RoundManager.RoundEnd();
        }
        else if (Gamemode.CurrentGameMode == Globals.GAME_MODES[1]) // Solo
        {
            // Move player to start, save their time. Wait for everyone to finish.
            MoveAndFinish(player);
            RoundManager.RoundEndCheck();
        }
        else if (Gamemode.CurrentGameMode == Globals.GAME_MODES[2]) // Team
        {
            // Move all team members to the start, save their time. Wait for all teams to finish.
            foreach (var teamMember in Globals.ALL_TEAMS[Globals.ALL_KITTIES[player].TeamID].Teammembers)
            {
                MoveAndFinish(teamMember);
            }
            Globals.ALL_TEAMS[Globals.ALL_KITTIES[player].TeamID].Finished = true;
            RoundManager.RoundEndCheck();
        }
        MultiboardUtil.RefreshMultiboards();
    }

    private static bool VictoryAreaConditionsStandard(unit u)
    {
        return Gamemode.CurrentGameMode == "Standard";
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
        var team = Globals.ALL_KITTIES[u.Owner].TeamID;
        foreach (var player in Globals.ALL_TEAMS[team].Teammembers)
        {
            if (!VictoryContainerConditions(Globals.ALL_KITTIES[player].Unit)) return false;
        }
        return true;
    }

    private static void MoveAndFinish(player player)
    {
        var kitty = Globals.ALL_KITTIES[player];
        kitty.Finished = true;
        kitty.Unit.SetPosition(Regions.safe_Area_00.Center.X, Regions.safe_Area_00.Center.Y);
        Progress.CalculateProgress(kitty);
        BarrierSetup.ActivateBarrier();
    }

    private static bool VictoryContainerConditions(unit u)
    {
        if(Regions.Victory_Area.Region.Contains(u) || Regions.safe_Area_14.Region.Contains(u)) return true;
        return false;
    }
}
