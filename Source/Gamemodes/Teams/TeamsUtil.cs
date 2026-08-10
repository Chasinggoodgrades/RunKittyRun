using WCSharp.Api;

public static class TeamsUtil
{
    public static void RoundResetAllTeams()
    {
        if (Gamemode.CurrentGameMode != GameMode.Team) return;
        foreach (var team in TeamRegistry.All)
            team.Finished = false;
    }

    public static string GetTeamMembers(Kitty k)
    {
        TeamRegistry.TryGetTeam(k.TeamID, out var team);
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
        TeamRegistry.TryGetTeam(k.TeamID, out var team);
        return Colors.GetColorNameByTeamID(team.TeamID);
    }
}
