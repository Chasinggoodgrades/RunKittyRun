using WCSharp.Api;

public static class TeamsUtil
{
    public static void RoundResetAllTeams()
    {
        if (Gamemode.CurrentGameMode != GameMode.TeamTournament) return;
        foreach (var team in Globals.ALL_TEAMS_LIST)
            team.Finished = false;
    }

    public static void CheckTeamDead(Kitty k)
    {
        if (Gamemode.CurrentGameMode != GameMode.TeamTournament) return;
        var team = Globals.ALL_TEAMS[k.TeamID];
        for (int i = 0; i < team.Teammembers.Count; i++)
        {
            if (Globals.ALL_KITTIES[team.Teammembers[i]].Alive) return;
        }
        team.TeamIsDeadActions();
    }

    public static string GetTeamMembers(Kitty k)
    {
        var team = Globals.ALL_TEAMS[k.TeamID];
        string members = "";
        for (int i = 0; i < team.Teammembers.Count; i++)
        {
            members += team.Teammembers[i].Name;
            if (i != team.Teammembers.Count - 1) members += ", ";
        }
        return members;
    }

    public static string GetTeamColor(Kitty k)
    {
        var team = Globals.ALL_TEAMS[k.TeamID];
        return Colors.GetColorNameByTeamID(team.TeamID);
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
