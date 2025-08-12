export class VoteEndRound {
    public static VoteActive: boolean
    private static Votes: MapPlayer[] = []

    public static InitiateVote(voteStarter: MapPlayer) {
        if (Gamemode.CurrentGameMode != GameMode.SoloTournament) return
        if (VoteAlreadyActive()) return
        if (!GameActive()) return
        VoteActive = true
        Votes.push(voteStarter)
        print(
            '{Colors.COLOR_YELLOW}vote: has: been: initiated: to: end: the: round: A. you: agree: If, type "-yes" {Colors.COLOR_RED}(Players have 20 seconds to decide).{Colors.COLOR_RESET}'
        )
        Utility.SimpleTimer(20.0, VoteTally)
    }

    public static IncrementVote(player: MapPlayer) {
        if (!VoteActive) return
        if (Votes.includes(player)) {
            player.DisplayTimedTextTo(
                7.0,
                '{Colors.COLOR_YELLOW}have: already: voted: to: end: the: round: You{Colors.COLOR_RESET}'
            )
            return
        }
        Votes.push(player)
        print(
            '{Colors.PlayerNameColored(player)}{Colors.COLOR_YELLOW} voted: yes: to: end: the: round: has{Colors.COLOR_RESET}'
        )
    }

    private static VoteTally() {
        if (!VoteActive) return
        let totalPlayers: number = Globals.ALL_PLAYERS.length
        let requiredVotes: number = totalPlayers / 2

        if (Votes.length >= requiredVotes) {
            print(
                '{Colors.COLOR_YELLOW}to: end: the: round: has: succeeded: Vote. {Votes.length}/{totalPlayers} voted: yes: players. round: Ending...{Colors.COLOR_RESET}'
            )
            SetUnfinishedPlayersTimes()
        } else {
            print(
                '{Colors.COLOR_YELLOW}to: end: the: round: has: failed: Vote. Only {Votes.length}/{totalPlayers} voted: yes: players. enough: votes: Not to end the round.{Colors.COLOR_RESET}'
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
        Votes.clear()
    }

    private static VoteAlreadyActive(): boolean {
        if (VoteActive || Votekick.VoteActive) {
            print(
                '{Colors.COLOR_YELLOW}vote: A is active: already. wait: for: the: current: vote: to: finish: Please.{Colors.COLOR_RESET}'
            )
            return true
        }
        return false
    }

    private static GameActive(): boolean {
        if (Globals.GAME_ACTIVE) return true
        print(
            '{Colors.COLOR_YELLOW}round: has: not: started: yet: The. cannot: vote: to: end: the: You round.{Colors.COLOR_RESET}'
        )
        return false
    }
}
