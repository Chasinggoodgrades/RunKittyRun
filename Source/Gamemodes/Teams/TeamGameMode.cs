using System.Diagnostics.Metrics;
using WCSharp.Api;

/// <summary>
/// IGameMode adapter for Team mode. Owns mode lifecycle (picking/assigning
/// teams) and the victory-zone / multiboard / player-leave behavior that's
/// specific to teams. Per-team *data* lives on <see cref="Team"/>; team
/// *lookups* live on <see cref="TeamRegistry"/> — this class only
/// orchestrates the mode itself, mirroring StandardGameMode/SoloGameMode.
/// </summary>
public sealed class TeamGameMode : IGameMode
{
    private static timer _pickTimer;
    private readonly TeamTournamentModes _tournamentMode;

    public GameMode Id => GameMode.Team;

    public TeamGameMode(string modeType)
    {
        _tournamentMode = modeType == Globals.TEAM_MODES[0]
            ? TeamTournamentModes.FreePick
            : TeamTournamentModes.Random;
    }

    public void Initialize()
    {
        ShadowKitty.Initialize();
        ProtectionOfAncients.Initialize();
        Relic.RegisterRelicEnabler();

        TeamRegistry.Reset();

        _pickTimer ??= timer.Create();
        _pickTimer.Start(0.1f, false, ErrorHandler.Wrap(SetupTeamPicking));
    }

    private void SetupTeamPicking()
    {
        if (_tournamentMode == TeamTournamentModes.FreePick)
        {
            RoundManager.ROUND_INTERMISSION += 15.0f;
            TeamHandler.FreepickEnabled = true;
            foreach (var player in Globals.ALL_PLAYERS)
            {
                player.DisplayTimedTextTo(RoundManager.ROUND_INTERMISSION - 30.0f, Colors.COLOR_YELLOW_ORANGE + Globals.TEAM_MODES[0] +
                    " has been enabled. Use " + Colors.COLOR_GOLD + "-team <#> " + Colors.COLOR_YELLOW_ORANGE + "to join a team");
            }
            Utility.SimpleTimer(RoundManager.ROUND_INTERMISSION - 15.0f, () =>
            {
                Utility.TimedTextToAllPlayers(5.0f, $"{Colors.COLOR_TURQUOISE}Remaining players have been randomly assigned to teams and picking has been disabled.{Colors.COLOR_RESET}");
                TeamHandler.RandomHandler();
            });
        }
        else
        {
            Utility.SimpleTimer(2.5f, TeamHandler.RandomHandler);
        }
    }

    public bool CanTriggerVictory(unit enteringUnit)
    {
        // A team only "enters" the victory zone once every member is already
        // standing inside it.
        var kitty = Globals.ALL_KITTIES[enteringUnit.Owner];
        if (!TeamRegistry.TryGetTeam(kitty.TeamID, out var team)) return false;

        for (int i = 0; i < team.Teammembers.Count; i++)
        {
            var teamMember = team.Teammembers[i];
            if (!VictoryZone.IsUnitInVictoryContainer(teamMember.Unit)) return false;
        }
        return true;
    }

    public void OnVictoryZoneEntered(Kitty kitty)
    {
        kitty.Finished = true;

        if (!TeamRegistry.TryGetTeam(kitty.TeamID, out var team)) return;

        if (TeamRegistry.DidTeamFinishRound(team.TeamID))
        {
            team.Finished = true;
            if (RoundManager.RoundEndCheck()) return;
        }

        RoundUtilities.MoveTeamToStart(team);
        if (RoundManager.RoundEndCheck()) return;
        BarrierSetup.ActivateBarrier();
    }

    public void OnPlayerLeft(player player)
    {
        if (!TeamRegistry.TryGetTeamForPlayer(player, out var team)) return;
        team.RemoveMember(player);
    }

    public void RefreshMultiboard()
    {
        var t = timer.Create();
        t.Start(0.1f, false, ErrorHandler.Wrap(() =>
        {
            TeamsMultiboard.UpdateCurrentTeamsMB();
            TeamsMultiboard.UpdateTeamStatsMB();
            t.Dispose();
        }));
    }

    public void OnKittyDied(Kitty kitty)
    {
        TeamRegistry.TryGetTeam(kitty.TeamID, out var team);
        if (team == null) return;
        for (int i = 0; i < team.Teammembers.Count; i++)
        {
            if (team.Teammembers[i].Alive) return;
        }
        team.TeamIsDeadActions();
    }
}
