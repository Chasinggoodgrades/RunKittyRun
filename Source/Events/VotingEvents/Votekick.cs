using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class Votekick
{
    public static bool VoteActive { get; private set; } = false;
    private static timer VoteTimer = timer.Create();
    private static List<player> Voters = new List<player>();
    private static player VoteKickPlayer;
    private static player VoteStarter;
    private const float VOTE_DURATION = 30.0f;

    public static void InitiateVotekick(player voteStarter, string player)
    {
        if (VotekickAlreadyActive()) return;
        VoteStarter = voteStarter;
        var playerID = GetPlayerID(player);
        if (playerID != -1) StartVotekick(Player(playerID));
        else voteStarter.DisplayTimedTextTo(7.0f, $"{Colors.COLOR_RED}Invalid player syntax. Use the player number: (1 = Red, 2 = Blue, etc.){Colors.COLOR_RESET}");
    }

    public static void IncrementTally()
    {
        if (!VoteActive) return;
        var player = GetTriggerPlayer();
        var vote = GetEventPlayerChatString().ToLower();
        if (vote != "-yes") return;
        if (Voters.Contains(player))
        {
            player.DisplayTimedTextTo(7.0f, $"{Colors.COLOR_YELLOW}You have already voted to kick {Colors.PlayerNameColored(VoteKickPlayer)}{Colors.COLOR_RESET}");
            return;
        }
        Voters.Add(player);
        Console.WriteLine($"{Colors.PlayerNameColored(player)}{Colors.COLOR_YELLOW} has voted yes to kick {Colors.PlayerNameColored(VoteKickPlayer)}{Colors.COLOR_RESET}");
    }

    private static void StartVotekick(player target)
    {
        VoteActive = true;
        Console.WriteLine($"{Colors.COLOR_YELLOW}A votekick has been initiated against {Colors.PlayerNameColored(target)}{Colors.COLOR_YELLOW}. If you agree, type \"-yes\" {Colors.COLOR_RED}({VOTE_DURATION} seconds remain){Colors.COLOR_RESET}");
        VoteKickPlayer = target;
        Voters.Add(VoteStarter);
        VoteTimer.Start(VOTE_DURATION, false, () => ExecuteVotekick(target));
    }

    private static void ExecuteVotekick(player target)
    {
        int totalPlayers = Globals.ALL_PLAYERS.Count;
        int requiredVotes = totalPlayers / 2;

        if (Voters.Count >= requiredVotes)
        {
            Console.WriteLine($"{Colors.COLOR_YELLOW}Votekick succeeded. {Voters.Count}/{totalPlayers} players voted yes. {Colors.PlayerNameColored(target)}{Colors.COLOR_YELLOW} has been removed from the game.{Colors.COLOR_RESET}");
            PlayerLeaves.PlayerLeavesActions(target);
            target.Remove(playergameresult.Defeat);
        }
        else
        {
            Console.WriteLine($"{Colors.COLOR_YELLOW}Votekick failed. Only {Voters.Count}/{totalPlayers} players voted yes. Not enough votes to remove {Colors.PlayerNameColored(target)}.{Colors.COLOR_RESET}");
        }
        EndVotekick();
    }


    private static void EndVotekick()
    {
        VoteActive = false;
        VoteStarter = null;
        VoteKickPlayer = null;
        Voters.Clear();
    }

    private static bool VotekickAlreadyActive()
    {
        if (VoteActive || VoteEndRound.VoteActive)
        {
            Console.WriteLine($"{Colors.COLOR_YELLOW}A vote is already active. Please wait for the current vote to finish.{Colors.COLOR_RESET}");
            return true;
        }
        return false;
    }

    /// <summary>
    /// Most people use player numbers (1-24) to represent players, so subtract 1 to get the correct index.
    /// </summary>
    /// <param name="player"></param>
    /// <returns></returns>
    private static int GetPlayerID(string player)
    {
        return int.TryParse(player, out int playerID) ? playerID - 1 : -1;
    }
    private static player GetPlayer(string player)
    {
        // doesnt quite work yet.
        string basePlayerName = Regex.Match(player, @"^[^\W_]+").Value;
        foreach (var p in Globals.ALL_PLAYERS)
        {
            if (p.Name.IndexOf(basePlayerName, StringComparison.OrdinalIgnoreCase) >= 0)
            {
                return p;
            }
            Console.WriteLine(p.Name.IndexOf(basePlayerName, StringComparison.OrdinalIgnoreCase));
        }
        return null;
    }



}