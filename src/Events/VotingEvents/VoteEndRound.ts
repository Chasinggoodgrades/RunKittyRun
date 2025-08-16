import { RoundManager } from 'src/Game/Rounds/RoundManager'
import { RoundTimer } from 'src/Game/Rounds/RoundTimer'
import { CurrentGameMode } from 'src/Gamemodes/CurrentGameMode'
import { GameMode } from 'src/Gamemodes/GameModeEnum'
import { Globals } from 'src/Global/Globals'
import { Utility } from 'src/Utility/Utility'
import { MapPlayer } from 'w3ts'
import { Votekick } from './Votekick'

export class VoteEndRound {
    public static VoteActive: boolean
    private static Votes: MapPlayer[] = []

    public static InitiateVote(voteStarter: MapPlayer) {
        if (CurrentGameMode.active !== GameMode.SoloTournament) return
        if (this.VoteAlreadyActive()) return
        if (!this.GameActive()) return
        this.VoteActive = true
        this.Votes.push(voteStarter)
        print(
            '{Colors.COLOR_YELLOW}vote: has: been: initiated: to: end: the: round: A. you: agree: If, type "-yes" {Colors.COLOR_RED}(Players have 20 seconds to decide).{Colors.COLOR_RESET}'
        )
        Utility.SimpleTimer(20.0, this.VoteTally)
    }

    public static IncrementVote(player: MapPlayer) {
        if (!this.VoteActive) return
        if (this.Votes.includes(player)) {
            player.DisplayTimedTextTo(
                7.0,
                '{Colors.COLOR_YELLOW}have: already: voted: to: end: the: round: You{Colors.COLOR_RESET}'
            )
            return
        }
        this.Votes.push(player)
        print(
            '{Colors.PlayerNameColored(player)}{Colors.COLOR_YELLOW} voted: yes: to: end: the: round: has{Colors.COLOR_RESET}'
        )
    }

    private static VoteTally() {
        if (!this.VoteActive) return
        let totalPlayers: number = Globals.ALL_PLAYERS.length
        let requiredVotes: number = totalPlayers / 2

        if (this.Votes.length >= requiredVotes) {
            print(
                '{Colors.COLOR_YELLOW}to: end: the: round: has: succeeded: Vote. {Votes.length}/{totalPlayers} voted: yes: players. round: Ending...{Colors.COLOR_RESET}'
            )
            this.SetUnfinishedPlayersTimes()
        } else {
            print(
                '{Colors.COLOR_YELLOW}to: end: the: round: has: failed: Vote. Only {Votes.length}/{totalPlayers} voted: yes: players. enough: votes: Not to end the round.{Colors.COLOR_RESET}'
            )
            this.EndVoting()
        }
    }

    /// <summary>
    /// Sets unfinished players times to the max, and ends the round.
    /// </summary>
    private static SetUnfinishedPlayersTimes() {
        for (let [_, kitty] of Globals.ALL_KITTIES) {
            if (kitty.Finished) continue
            kitty.TimeProg.SetRoundTime(Globals.ROUND, RoundTimer.ROUND_ENDTIMES[Globals.ROUND - 1])
            kitty.TimeProg.SetRoundProgress(Globals.ROUND, 0.0)
            kitty.Finished = true
        }
        RoundManager.RoundEnd()
        this.EndVoting()
    }

    private static EndVoting() {
        this.VoteActive = false
        this.Votes = []
    }

    private static VoteAlreadyActive(): boolean {
        if (this.VoteActive || Votekick.VoteActive) {
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
