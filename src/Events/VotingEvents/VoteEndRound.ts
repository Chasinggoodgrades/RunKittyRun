import { RoundManager } from 'src/Game/Rounds/RoundManager'
import { RoundTimer } from 'src/Game/Rounds/RoundTimer'
import { CurrentGameMode } from 'src/Gamemodes/CurrentGameMode'
import { GameMode } from 'src/Gamemodes/GameModeEnum'
import { Globals } from 'src/Global/Globals'
import { Colors } from 'src/Utility/Colors/Colors'
import { ColorUtils } from 'src/Utility/Colors/ColorUtils'
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
            `${Colors.COLOR_YELLOW}A vote has been initiated to end the round. If you agree, type "-yes" ${Colors.COLOR_RED}(Players have 20 seconds to decide).${Colors.COLOR_RESET}`
        )
        Utility.SimpleTimer(20.0, this.VoteTally)
    }

    public static IncrementVote(player: MapPlayer) {
        if (!this.VoteActive) return
        if (this.Votes.includes(player)) {
            player.DisplayTimedTextTo(
                7.0,
                `${Colors.COLOR_YELLOW}You have already voted to end the round${Colors.COLOR_RESET}`
            )
            return
        }
        this.Votes.push(player)
        print(
            `${ColorUtils.PlayerNameColored(player)}${Colors.COLOR_YELLOW} has voted yes to end the round${Colors.COLOR_RESET}`
        )
    }

    private static VoteTally() {
        if (!this.VoteActive) return
        let totalPlayers: number = Globals.ALL_PLAYERS.length
        let requiredVotes: number = totalPlayers / 2

        if (this.Votes.length >= requiredVotes) {
            print(
                `${Colors.COLOR_YELLOW}Vote to end the round has succeeded. ${this.Votes.length}/${totalPlayers} players voted yes. Ending round...${Colors.COLOR_RESET}`
            )
            this.SetUnfinishedPlayersTimes()
        } else {
            print(
                `${Colors.COLOR_YELLOW}Vote to end the round has failed. Only ${this.Votes.length}/${totalPlayers} players voted yes. Not enough votes to end the round.${Colors.COLOR_RESET}`
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
                `${Colors.COLOR_YELLOW}A vote is already active. Please wait for the current vote to finish.${Colors.COLOR_RESET}`
            )
            return true
        }
        return false
    }

    private static GameActive(): boolean {
        if (Globals.GAME_ACTIVE) return true
        print(
            `${Colors.COLOR_YELLOW}The round has not started yet. You cannot vote to end the round.${Colors.COLOR_RESET}`
        )
        return false
    }
}
