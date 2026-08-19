using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

/// <summary>
/// A single team's data: members, timing, and round progress.
/// This class no longer has any static/lifecycle members — that logic now
/// lives in <see cref="TeamGameMode"/> (mode orchestration) and
/// <see cref="TeamRegistry"/> (lookup/storage). A Team only knows about
/// itself.
/// </summary>
public class Team
{
    public int TeamID { get; }
    public string TeamColor { get; }

    /// <summary>
    /// Array of team times in seconds for each round. Index 0 is unused.
    /// </summary>
    public float[] TeamTimes { get; set; }
    public List<Kitty> Teammembers { get; } = new List<Kitty>();
    public string TeamMembersString { get; private set; } = "";
    public Dictionary<int, string> RoundProgress { get; } = new Dictionary<int, string>();
    public bool Finished { get; set; }

    public Team(int id)
    {
        TeamID = id;
        TeamTimes = new float[Gamemode.NumberOfRounds + 1];
        TeamColor = Colors.GetStringColorOfPlayer(TeamID) + "Team " + TeamID;
        InitRoundStats();
        TeamRegistry.Register(this);
    }

    public void AddMember(player player) => SetMembership(player, adding: true);

    public void RemoveMember(player player)
    {
        // Only remove if this player is actually mapped to *this* team — guards
        // against a stale reference removing someone from a team they already left.
        if (!TeamRegistry.TryGetTeamForPlayer(player, out var current) || current != this) return;

        SetMembership(player, adding: false);
        if (Teammembers.Count == 0) TeamRegistry.Unregister(this);
    }

    public void TeamIsDeadActions()
    {
        if (Gamemode.AutoReviveEnabled)
        {
            new TeamDeathTimer(this);
            return;
        }

        foreach (var member in Teammembers)
        {
            member.Finished = true;
        }
        Finished = true;
        RoundManager.RoundEndCheck();
    }

    public void UpdateRoundProgress(int round, string progress)
    {
        RoundProgress[round] = progress;
    }

    private void InitRoundStats()
    {
        for (int i = 1; i <= Gamemode.NumberOfRounds; i++)
        {
            RoundProgress.Add(i, "0.0");
        }
    }

    /// <summary>
    /// Adds or removes a player from this team and updates their color accordingly.
    /// </summary>
    private void SetMembership(player player, bool adding)
    {
        var kitty = Globals.ALL_KITTIES[player];
        if (adding)
        {
            Teammembers.Add(kitty);
            kitty.TeamID = TeamID;
            kitty.Unit.SetColor(GetPlayerColor(Player(TeamID - 1)));
            Globals.ALL_CIRCLES[player].Unit.SetColor(GetPlayerColor(Player(TeamID - 1)));
            TeamRegistry.MapPlayer(player, this);
        }
        else
        {
            Teammembers.Remove(kitty);
            kitty.TeamID = 0;
            TeamRegistry.UnmapPlayer(player);
        }

        RebuildMembersString();
        Gamemode.Current.RefreshMultiboard();
    }

    private void RebuildMembersString()
    {
        var names = new List<string>(Teammembers.Count);
        foreach (var member in Teammembers)
        {
            var rawName = member.Name.Split('#')[0];
            if (rawName.Length > 7) rawName = rawName.Substring(0, 7);
            names.Add(Colors.ColorString(rawName, member.Player.Id + 1));
        }
        TeamMembersString = string.Join(", ", names);
    }
}
