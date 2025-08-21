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

    public static InitiateVote = (voteStarter: MapPlayer) => {
        if (CurrentGameMode.active !== GameMode.SoloTournament) return
        if (VoteEndRound.VoteAlreadyActive()) return
        if (!VoteEndRound.GameActive()) return
        VoteEndRound.VoteActive = true
        VoteEndRound.Votes.push(voteStarter)
        print(
            `${Colors.COLOR_YELLOW}A vote has been initiated to end the round. If you agree, type "-yes" ${Colors.COLOR_RED}(Players have 20 seconds to decide).${Colors.COLOR_RESET}`
        )
        Utility.SimpleTimer(20.0, VoteEndRound.VoteTally)
    }

    public static IncrementVote = (player: MapPlayer) => {
        if (!VoteEndRound.VoteActive) return
        if (VoteEndRound.Votes.includes(player)) {
            player.DisplayTimedTextTo(
                7.0,
                `${Colors.COLOR_YELLOW}You have already voted to end the round${Colors.COLOR_RESET}`
            )
            return
        }
        VoteEndRound.Votes.push(player)
        print(
            `${ColorUtils.PlayerNameColored(player)}${Colors.COLOR_YELLOW} has voted yes to end the round${Colors.COLOR_RESET}`
        )
    }

    private static VoteTally = () => {
        if (!VoteEndRound.VoteActive) return
        const totalPlayers = Globals.ALL_PLAYERS.length
        const requiredVotes = totalPlayers / 2

        if (VoteEndRound.Votes.length >= requiredVotes) {
            print(
                `${Colors.COLOR_YELLOW}Vote to end the round has succeeded. ${VoteEndRound.Votes.length}/${totalPlayers} players voted yes. Ending round...${Colors.COLOR_RESET}`
            )
            VoteEndRound.SetUnfinishedPlayersTimes()
        } else {
            print(
                `${Colors.COLOR_YELLOW}Vote to end the round has failed. Only ${VoteEndRound.Votes.length}/${totalPlayers} players voted yes. Not enough votes to end the round.${Colors.COLOR_RESET}`
            )
            VoteEndRound.EndVoting()
        }
    }

    /// <summary>
    /// Sets unfinished players times to the max, and ends the round.
    /// </summary>
    private static SetUnfinishedPlayersTimes = () => {
        for (const [_, kitty] of Globals.ALL_KITTIES) {
            if (kitty.Finished) continue
            kitty.TimeProg.SetRoundTime(Globals.ROUND, RoundTimer.ROUND_ENDTIMES[Globals.ROUND - 1])
            kitty.TimeProg.SetRoundProgress(Globals.ROUND, 0.0)
            kitty.Finished = true
        }
        RoundManager.RoundEnd()
        VoteEndRound.EndVoting()
    }

    private static EndVoting = () => {
        VoteEndRound.VoteActive = false
        VoteEndRound.Votes = []
    }

    private static VoteAlreadyActive(): boolean {
        if (VoteEndRound.VoteActive || Votekick.VoteActive) {
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
