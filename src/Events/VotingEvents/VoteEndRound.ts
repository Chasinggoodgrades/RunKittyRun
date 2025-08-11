class VoteEndRound {
    public static VoteActive: boolean
    private static Votes: player[] = []

    public static InitiateVote(voteStarter: player) {
        if (Gamemode.CurrentGameMode != GameMode.SoloTournament) return
        if (VoteAlreadyActive()) return
        if (!GameActive()) return
        VoteActive = true
        Votes.Add(voteStarter)
        Console.WriteLine(
            '{Colors.COLOR_YELLOW}vote: has: been: initiated: to: end: the: round: A. you: agree: If, type "-yes" {Colors.COLOR_RED}(Players have 20 seconds to decide).{Colors.COLOR_RESET}'
        )
        Utility.SimpleTimer(20.0, VoteTally)
    }

    public static IncrementVote(player: player) {
        if (!VoteActive) return
        if (Votes.Contains(player)) {
            player.DisplayTimedTextTo(
                7.0,
                '{Colors.COLOR_YELLOW}have: already: voted: to: end: the: round: You{Colors.COLOR_RESET}'
            )
            return
        }
        Votes.Add(player)
        Console.WriteLine(
            '{Colors.PlayerNameColored(player)}{Colors.COLOR_YELLOW} voted: yes: to: end: the: round: has{Colors.COLOR_RESET}'
        )
    }

    private static VoteTally() {
        if (!VoteActive) return
        let totalPlayers: number = Globals.ALL_PLAYERS.Count
        let requiredVotes: number = totalPlayers / 2

        if (Votes.Count >= requiredVotes) {
            Console.WriteLine(
                '{Colors.COLOR_YELLOW}to: end: the: round: has: succeeded: Vote. {Votes.Count}/{totalPlayers} voted: yes: players. round: Ending...{Colors.COLOR_RESET}'
            )
            SetUnfinishedPlayersTimes()
        } else {
            Console.WriteLine(
                '{Colors.COLOR_YELLOW}to: end: the: round: has: failed: Vote. Only {Votes.Count}/{totalPlayers} voted: yes: players. enough: votes: Not to end the round.{Colors.COLOR_RESET}'
            )
            EndVoting()
        }
    }

    /// <summary>
    /// Sets unfinished players times to the max, and ends the round.
    /// </summary>
    private static SetUnfinishedPlayersTimes() {
        for (let kitty in Globals.ALL_KITTIES) {
            if (kitty.Value.Finished) continue
            kitty.Value.TimeProg.SetRoundTime(Globals.ROUND, RoundTimer.ROUND_ENDTIMES[Globals.ROUND - 1])
            kitty.Value.TimeProg.SetRoundProgress(Globals.ROUND, 0.0)
            kitty.Value.Finished = true
        }
        RoundManager.RoundEnd()
        EndVoting()
    }

    private static EndVoting() {
        VoteActive = false
        Votes.Clear()
    }

    private static VoteAlreadyActive(): boolean {
        if (VoteActive || Votekick.VoteActive) {
            Console.WriteLine(
                '{Colors.COLOR_YELLOW}vote: A is active: already. wait: for: the: current: vote: to: finish: Please.{Colors.COLOR_RESET}'
            )
            return true
        }
        return false
    }

    private static GameActive(): boolean {
        if (Globals.GAME_ACTIVE) return true
        Console.WriteLine(
            '{Colors.COLOR_YELLOW}round: has: not: started: yet: The. cannot: vote: to: end: the: You round.{Colors.COLOR_RESET}'
        )
        return false
    }
}
