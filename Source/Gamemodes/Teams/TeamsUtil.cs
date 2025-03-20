using WCSharp.Api;

public static class TeamsUtil
{
    public static void RoundResetAllTeams()
    {
        if (Gamemode.CurrentGameMode != Globals.GAME_MODES[2]) return;
        foreach (var team in Globals.ALL_TEAMS)
            team.Value.Finished = false;
    }

    public static void CheckTeamDead(Kitty k)
    {
        if (Gamemode.CurrentGameMode != Globals.GAME_MODES[2]) return;
        var team = Globals.ALL_TEAMS[k.TeamID];
        foreach (var player in team.Teammembers)
            if (Globals.ALL_KITTIES[player].Alive) return;
        team.TeamIsDeadActions();
    }

    public static void UpdateTeamsMB()
    {
        var t = timer.Create();
        t.Start(0.1f, false, ErrorHandler.Wrap(() =>
        {
            TeamsMultiboard.UpdateCurrentTeamsMB();
            TeamsMultiboard.UpdateTeamStatsMB();
            t.Dispose();
        }));
    }
}