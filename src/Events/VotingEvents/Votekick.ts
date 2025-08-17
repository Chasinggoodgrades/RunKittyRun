import { Globals } from 'src/Global/Globals'
import { Colors } from 'src/Utility/Colors/Colors'
import { ColorUtils } from 'src/Utility/Colors/ColorUtils'
import { ErrorHandler } from 'src/Utility/ErrorHandler'
import { getTriggerPlayer } from 'src/Utility/w3tsUtils'
import { MapPlayer, Timer } from 'w3ts'
import { PlayerLeaves } from '../PlayerLeavesEvent/PlayerLeaves'
import { VoteEndRound } from './VoteEndRound'

export class Votekick {
    public static VoteActive: boolean = false
    private static VoteTimer = Timer.create()
    private static Voters: MapPlayer[] = []
    private static VoteKickPlayer: MapPlayer | undefined
    private static VoteStarter: MapPlayer | undefined
    private static VOTE_DURATION = 30.0

    public static InitiateVotekick(voteStarter: MapPlayer, player: string) {
        if (this.VotekickAlreadyActive()) return
        this.VoteStarter = voteStarter
        let playerID = this.GetPlayerID(player)
        if (playerID !== -1) this.StartVotekick(MapPlayer.fromIndex(playerID)!)
        else
            voteStarter.DisplayTimedTextTo(
                7.0,
                `${Colors.COLOR_RED}Invalid player syntax. Use the player number: (1 = Red, 2 = Blue, etc.)${Colors.COLOR_RESET}`
            )
    }

    public static IncrementTally() {
        if (!this.VoteActive) return
        let player = getTriggerPlayer()
        let vote = (GetEventPlayerChatString() || '').toLowerCase()
        if (vote !== '-yes') return
        if (this.Voters.includes(player)) {
            player.DisplayTimedTextTo(
                7.0,
                `${Colors.COLOR_YELLOW}You have already voted to kick ${ColorUtils.PlayerNameColored(this.VoteKickPlayer!)}${Colors.COLOR_RESET}`
            )
            return
        }
        this.Voters.push(player)
        print(
            `${ColorUtils.PlayerNameColored(player)}${Colors.COLOR_YELLOW} has voted yes to kick ${ColorUtils.PlayerNameColored(this.VoteKickPlayer!)}${Colors.COLOR_RESET}`
        )
    }

    private static StartVotekick(target: MapPlayer) {
        if (Globals.VIPLISTUNFILTERED.includes(target)) {
            print(
                `${Colors.COLOR_YELLOW}You cannot votekick ${ColorUtils.PlayerNameColored(target)}${Colors.COLOR_YELLOW}. They are a VIP.${Colors.COLOR_RESET}`
            )
            return
        }
        this.VoteActive = true
        print(
            `${Colors.COLOR_YELLOW}A votekick has been initiated against ${ColorUtils.PlayerNameColored(target)}${Colors.COLOR_YELLOW}. If you agree, type "-yes" ${Colors.COLOR_RED}(${this.VOTE_DURATION} seconds remain)${Colors.COLOR_RESET}`
        )
        this.VoteKickPlayer = target
        this.Voters.push(this.VoteStarter!)
        this.VoteTimer.start(
            this.VOTE_DURATION,
            false,
            ErrorHandler.Wrap(() => this.ExecuteVotekick(target))
        )
    }

    private static ExecuteVotekick(target: MapPlayer) {
        let totalPlayers: number = Globals.ALL_PLAYERS.length
        let requiredVotes: number = totalPlayers / 2

        if (this.Voters.length >= requiredVotes) {
            print(
                `${Colors.COLOR_YELLOW}Votekick succeeded. ${this.Voters.length}/${totalPlayers} players voted yes. ${ColorUtils.PlayerNameColored(target)}${Colors.COLOR_YELLOW} has been removed from the game.${Colors.COLOR_RESET}`
            )
            PlayerLeaves.PlayerLeavesActions(target)
            target.remove(PLAYER_GAME_RESULT_DEFEAT)
        } else {
            print(
                `${Colors.COLOR_YELLOW}Votekick failed. Only ${this.Voters.length}/${totalPlayers} players voted yes. Not enough votes to remove ${ColorUtils.PlayerNameColored(target)}.${Colors.COLOR_RESET}`
            )
        }
        this.EndVotekick()
    }

    private static EndVotekick() {
        this.VoteActive = false
        this.VoteStarter = undefined
        this.VoteKickPlayer = undefined
        this.Voters = []
    }

    private static VotekickAlreadyActive(): boolean {
        if (this.VoteActive || VoteEndRound.VoteActive) {
            print(
                `${Colors.COLOR_YELLOW}A vote is already active. Please wait for the current vote to finish.${Colors.COLOR_RESET}`
            )
            return true
        }
        return false
    }

    /// <summary>
    /// Most people use player numbers (1-24) to represent players, so subtract 1 to get the correct index.
    /// </summary>
    /// <param name="player"></param>
    /// <returns></returns>
    private static GetPlayerID(player: string) {
        let playerID = S2I(player)
        return playerID && playerID > 0 ? playerID - 1 : -1
    }

    private static GetPlayer(player: string) {
        // doesnt quite work yet.
        // let basePlayerName: string = (player.match(/^[^\W_]+/) || [''])[0].toLowerCase()
        // for (let p of Globals.ALL_PLAYERS) {
        //     if (p.name.toLowerCase().indexOf(basePlayerName) >= 0) {
        //         return p
        //     }
        //     print(p.name.toLowerCase().indexOf(basePlayerName))
        // }
        // return null as never
    }
}
