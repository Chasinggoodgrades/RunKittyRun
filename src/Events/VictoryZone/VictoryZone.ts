class VictoryZone {
    private static InVictoryArea: trigger

    public static Initialize() {
        InVictoryArea = CreateTrigger()
        VictoryAreaTrigger()
    }

    private static VictoryAreaConditions(u: unit) {
        return VictoryAreaConditionsStandard(u) || VictoryAreaConditionsTeam(u) || VictoryAreaConditionsSolo(u)
    }

    private static VictoryAreaTrigger() {
        let VictoryArea = Regions.Victory_Area.Region
        InVictoryArea.RegisterEnterRegion(
            VictoryArea,
            Filter(() => VictoryAreaConditions(GetFilterUnit()))
        )
        InVictoryArea.AddAction(ErrorHandler.Wrap(VictoryAreaActions))
    }

    private static VictoryAreaActions() {
        let u = GetTriggerUnit()
        let player = u.Owner
        if (u.UnitType != Constants.UNIT_KITTY) return
        if (!Globals.GAME_ACTIVE) return
        if (Gamemode.CurrentGameMode == GameMode.Standard) {
            // Standard
            if (Globals.ROUND == Gamemode.NumberOfRounds) Gameover.WinGame = true
            RoundManager.RoundEnd()
        } else if (Gamemode.CurrentGameMode == GameMode.SoloTournament) {
            // Solo
            // Move player to start, save their time. Wait for everyone to finish.
            //MoveAndFinish(player);
            RoundManager.RoundEndCheck()
        } else if (Gamemode.CurrentGameMode == GameMode.TeamTournament) {
            // Team
            let kitty = Globals.ALL_KITTIES[player]
            kitty.Finished = true

            if (RoundManager.DidTeamEnd(kitty.TeamID)) {
                Globals.ALL_TEAMS[kitty.TeamID].Finished = true
                if (RoundManager.RoundEndCheck()) return
            }
            RoundUtilities.MoveTeamToStart(Globals.ALL_TEAMS[kitty.TeamID])
            if (RoundManager.RoundEndCheck()) return
            BarrierSetup.ActivateBarrier()

            // // Move all team members to the start, save their time. Wait for all teams to finish.
            // for (let teamMember in Globals.ALL_TEAMS[Globals.ALL_KITTIES[player].TeamID].Teammembers)
            // {
            //     MoveAndFinish(teamMember);
            // }
            // Globals.ALL_TEAMS[Globals.ALL_KITTIES[player].TeamID].Finished = true;
            // RoundManager.RoundEndCheck();
        }
        MultiboardUtil.RefreshMultiboards()
    }

    private static VictoryAreaConditionsStandard(u: unit) {
        return Gamemode.CurrentGameMode == GameMode.Standard
    }

    private static VictoryAreaConditionsSolo(u: unit) {
        return Gamemode.CurrentGameMode == GameMode.SoloTournament
    }

    private static VictoryAreaConditionsTeam(u: unit) {
        // If a team enters the area, check if all the members of the team are in the area.
        if (Gamemode.CurrentGameMode != GameMode.TeamTournament) return false
        let team = Globals.ALL_KITTIES[u.Owner].TeamID
        for (let player in Globals.ALL_TEAMS[team].Teammembers) {
            if (!VictoryContainerConditions(Globals.ALL_KITTIES[player].Unit)) return false
        }
        return true
    }

    private static VictoryContainerConditions(u: unit) {
        return Regions.Victory_Area.Region.Contains(u) || Regions.safe_Area_14.Region.Contains(u)
    }
}
