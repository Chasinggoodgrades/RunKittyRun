using System;
using System.Text.RegularExpressions;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class Votekick
{
    private static trigger Trigger = trigger.Create();
    private static timer VoteTimer = timer.Create();
    private static player VoteKickPlayer;
    private static int VoteCount = 0;
    private static bool VoteActive = false;
    private const float VOTE_DURATION = 30.0f;

    public static void InitiateVotekick(player voteStarter, string player)
    {
        if(VotekickAlreadyActive()) return;
        if(CannotKick(voteStarter)) return;
        var playerID = GetPlayerID(player);
        if(playerID != -1) StartVotekick(Player(playerID));
        else if (GetPlayer(player) != null) StartVotekick(GetPlayer(player));
        else voteStarter.DisplayTimedTextTo(7.0f, $"{Colors.COLOR_RED}Invalid player syntax. Use player number or player name.{Colors.COLOR_RESET}");
    }

    private static void StartVotekick(player target)
    {
        VoteActive = true;
        Console.WriteLine($"{Colors.COLOR_YELLOW}A votekick has been initiated against {Colors.PlayerNameColored(target)}. If you agree, type -yes {Colors.COLOR_RED}({VOTE_DURATION} seconds remain){Colors.COLOR_RESET}");
        VoteKickPlayer = target;
        Trigger.Enable();
        VoteTimer.Start(VOTE_DURATION, false, () => ExecuteVotekick(target));
    }

    private static void IncrementTally()
    {
        var player = GetTriggerPlayer();
        var vote = GetEventPlayerChatString().ToLower();
        if (vote != "-yes") return; 
        VoteCount += 1;
        Console.WriteLine($"{Colors.PlayerNameColored(player)}{Colors.COLOR_YELLOW} has voted yes to kick {Colors.PlayerNameColored(VoteKickPlayer)}{Colors.COLOR_RESET}");
    }

    private static void ExecuteVotekick(player target)
    {
        if (VoteCount >= Globals.ALL_PLAYERS.Count / 2)
            target.Remove(playergameresult.Defeat);
        else
            Console.WriteLine($"{Colors.COLOR_YELLOW}Votekick failed. Not enough votes.{Colors.COLOR_RESET}");
        EndVotekick();
    }

    private static void EndVotekick()
    {
        VoteActive = false;
        VoteCount = 0;
        VoteKickPlayer = null;
        Trigger.Disable();
    }

    private static bool VotekickAlreadyActive()
    {
        if (!VoteActive) return false;
        Console.WriteLine($"{Colors.COLOR_YELLOW}A votekick is already active. Please wait for the current vote to finish.{Colors.COLOR_RESET}");
        return true;
    }

    private static bool CannotKick(player target)
    {
        if (target != GetTriggerPlayer()) return false; 
        target.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_RED}You cannot votekick yourself.{Colors.COLOR_RESET}");
        return true;
    }

    private static int GetPlayerID(string player)
    {
        if (int.TryParse(player, out int playerID))
        {
            return playerID;
        }
        return -1;
    }
    private static player GetPlayer(string player)
    {
        string basePlayerName = Regex.Match(player, @"^[^\W_]+").Value;

        foreach (var p in Globals.ALL_PLAYERS)
        {
            if (p.Name.StartsWith(basePlayerName, StringComparison.OrdinalIgnoreCase))
            {
                return p;
            }
        }
        return null;
    }


}