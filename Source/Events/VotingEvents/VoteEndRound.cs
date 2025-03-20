using System;
using System.Collections.Generic;
using WCSharp.Api;

public static class VoteEndRound
{
    public static bool VoteActive { get; private set; }
    private static List<player> Votes = new List<player>();

    public static void InitiateVote(player voteStarter)
    {
        if (Gamemode.CurrentGameMode != Globals.GAME_MODES[1]) return;
        if (VoteAlreadyActive()) return;
        if (!GameActive()) return;
        VoteActive = true;
        Votes.Add(voteStarter);
        Console.WriteLine($"{Colors.COLOR_YELLOW}A vote has been initiated to end the round. If you agree, type \"-yes\" {Colors.COLOR_RED}(Players have 20 seconds to decide).{Colors.COLOR_RESET}");
        Utility.SimpleTimer(20.0f, VoteTally);
    }

    public static void IncrementVote(player player)
    {
        if (!VoteActive) return;
        if (Votes.Contains(player))
        {
            player.DisplayTimedTextTo(7.0f, $"{Colors.COLOR_YELLOW}You have already voted to end the round{Colors.COLOR_RESET}");
            return;
        }
        Votes.Add(player);
        Console.WriteLine($"{Colors.PlayerNameColored(player)}{Colors.COLOR_YELLOW} has voted yes to end the round{Colors.COLOR_RESET}");
    }

    private static void VoteTally()
    {
        if (!VoteActive) return;
        int totalPlayers = Globals.ALL_PLAYERS.Count;
        int requiredVotes = totalPlayers / 2;

        if (Votes.Count >= requiredVotes)
        {
            Console.WriteLine($"{Colors.COLOR_YELLOW}Vote to end the round has succeeded. {Votes.Count}/{totalPlayers} players voted yes. Ending round...{Colors.COLOR_RESET}");
            SetUnfinishedPlayersTimes();
        }
        else
        {
            Console.WriteLine($"{Colors.COLOR_YELLOW}Vote to end the round has failed. Only {Votes.Count}/{totalPlayers} players voted yes. Not enough votes to end the round.{Colors.COLOR_RESET}");
            EndVoting();
        }
    }

    /// <summary>
    /// Sets unfinished players times to the max, and ends the round.
    /// </summary>
    private static void SetUnfinishedPlayersTimes()
    {
        foreach (var kitty in Globals.ALL_KITTIES)
        {
            if (kitty.Value.Finished) continue;
            kitty.Value.TimeProg.SetRoundTime(Globals.ROUND, RoundTimer.ROUND_ENDTIMES[Globals.ROUND - 1]);
            kitty.Value.TimeProg.SetRoundProgress(Globals.ROUND, 0.00f);
            kitty.Value.Finished = true;
        }
        RoundManager.RoundEnd();
        EndVoting();
    }

    private static void EndVoting()
    {
        VoteActive = false;
        Votes.Clear();
    }

    private static bool VoteAlreadyActive()
    {
        if (VoteActive || Votekick.VoteActive)
        {
            Console.WriteLine($"{Colors.COLOR_YELLOW}A vote is already active. Please wait for the current vote to finish.{Colors.COLOR_RESET}");
            return true;
        }
        return false;
    }

    private static bool GameActive()
    {
        if (Globals.GAME_ACTIVE) return true;
        Console.WriteLine($"{Colors.COLOR_YELLOW}The round has not started yet. You cannot vote to end the round.{Colors.COLOR_RESET}");
        return false;
    }
}
