using System.Collections.Generic;
using System.Linq;
using WCSharp.Api;

/// <summary>
/// Owns all team storage and lookups for Team mode. Replaces the
/// Globals.ALL_TEAMS / ALL_TEAMS_LIST / PLAYERS_TEAMS fields that used to
/// live directly on the global grab-bag, and absorbs what TeamsUtil used
/// to do (that class is now deleted — its methods live here instead).
/// </summary>
public static class TeamRegistry
{
    private static readonly Dictionary<int, Team> _teamsById = new();
    private static readonly List<Team> _teams = new();
    private static readonly Dictionary<player, Team> _teamByPlayer = new();
    private static readonly Dictionary<unit, Team> _teamByUnit = new();

    public static IReadOnlyList<Team> All => _teams;

    /// <summary>
    /// Clears all team state. Called once when Team mode is chosen.
    /// </summary>
    public static void Reset()
    {
        _teamsById.Clear();
        _teams.Clear();
        _teamByPlayer.Clear();
    }

    public static bool TryGetTeam(int teamId, out Team team) => _teamsById.TryGetValue(teamId, out team);

    public static bool TryGetTeamForPlayer(player player, out Team team) => _teamByPlayer.TryGetValue(player, out team);

    public static Team TryGetTeamForUnit(unit unit) => _teamByUnit[unit];

    internal static void Register(Team team)
    {
        _teamsById[team.TeamID] = team;
        _teams.Add(team);
    }

    internal static void Unregister(Team team)
    {
        _teamsById.Remove(team.TeamID);
        _teams.Remove(team);
    }

    internal static void MapPlayer(player player, Team team) => _teamByPlayer[player] = team;

    internal static void UnmapPlayer(player player) => _teamByPlayer.Remove(player);

    internal static void MapUnit(unit unit, Team team) => _teamByUnit[unit] = team;

    internal static void UnmapUnit(unit unit) => _teamByUnit.Remove(unit);

    /// <summary>
    /// Clears the "finished this round" flag on every team. Safe to call in any
    /// gamemode — if there are no teams (i.e. we're not in Team mode) this is a no-op,
    /// so callers no longer need their own `if (CurrentGameMode == GameMode.Team)` guard.
    /// </summary>
    public static void ResetRoundFlags()
    {
        foreach (var team in _teams) team.Finished = false;
    }

    /// <summary>
    /// Checks whether every member of the given kitty's team is dead, and if so
    /// triggers the team's death handling (revive or elimination). No-ops if the
    /// kitty isn't on a registered team (e.g. we're not in Team mode).
    /// </summary>
    public static void CheckTeamDead(Kitty kitty)
    {
        if (!TryGetTeam(kitty.TeamID, out var team)) return;

        foreach (var member in team.Teammembers)
        {
            if (member.Alive) return;
        }
        team.TeamIsDeadActions();
    }

    /// <summary>
    /// True once every member of the given team has finished the current round.
    /// </summary>
    public static bool DidTeamFinishRound(int teamId)
    {
        if (!TryGetTeam(teamId, out var team)) return false;

        foreach (var member in team.Teammembers)
        {
            if (!member.Finished) return false;
        }
        return true;
    }

    public static string GetTeamMembers(Kitty kitty)
    {
        if (!TryGetTeam(kitty.TeamID, out var team)) return "";
        return string.Join(", ", team.Teammembers.Select(p => p.Name));
    }

    public static string GetTeamColor(Kitty kitty)
    {
        if (!TryGetTeam(kitty.TeamID, out var team)) return "";
        return Colors.GetColorNameByTeamID(team.TeamID);
    }
}
