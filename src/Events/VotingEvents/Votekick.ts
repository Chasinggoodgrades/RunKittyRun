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
        if (Votekick.VotekickAlreadyActive()) return
        Votekick.VoteStarter = voteStarter
        const playerID = Votekick.GetPlayerID(player)
        if (playerID !== -1) Votekick.StartVotekick(MapPlayer.fromIndex(playerID)!)
        else
            voteStarter.DisplayTimedTextTo(
                7.0,
                `${Colors.COLOR_RED}Invalid player syntax. Use the player number: (1 = Red, 2 = Blue, etc.)${Colors.COLOR_RESET}`
            )
    }

    public static IncrementTally() {
        if (!Votekick.VoteActive) return
        const player = getTriggerPlayer()
        const vote = (GetEventPlayerChatString() || '').toLowerCase()
        if (vote !== '-yes') return
        if (Votekick.Voters.includes(player)) {
            player.DisplayTimedTextTo(
                7.0,
                `${Colors.COLOR_YELLOW}You have already voted to kick ${ColorUtils.PlayerNameColored(Votekick.VoteKickPlayer!)}${Colors.COLOR_RESET}`
            )
            return
        }
        Votekick.Voters.push(player)
        print(
            `${ColorUtils.PlayerNameColored(player)}${Colors.COLOR_YELLOW} has voted yes to kick ${ColorUtils.PlayerNameColored(Votekick.VoteKickPlayer!)}${Colors.COLOR_RESET}`
        )
    }

    private static StartVotekick(target: MapPlayer) {
        if (Globals.VIPLISTUNFILTERED.includes(target)) {
            print(
                `${Colors.COLOR_YELLOW}You cannot votekick ${ColorUtils.PlayerNameColored(target)}${Colors.COLOR_YELLOW}. They are a VIP.${Colors.COLOR_RESET}`
            )
            return
        }
        Votekick.VoteActive = true
        print(
            `${Colors.COLOR_YELLOW}A votekick has been initiated against ${ColorUtils.PlayerNameColored(target)}${Colors.COLOR_YELLOW}. If you agree, type "-yes" ${Colors.COLOR_RED}(${Votekick.VOTE_DURATION} seconds remain)${Colors.COLOR_RESET}`
        )
        Votekick.VoteKickPlayer = target
        Votekick.Voters.push(Votekick.VoteStarter!)
        Votekick.VoteTimer.start(
            Votekick.VOTE_DURATION,
            false,
            ErrorHandler.Wrap(() => Votekick.ExecuteVotekick(target))
        )
    }

    private static ExecuteVotekick(target: MapPlayer) {
        const totalPlayers: number = Globals.ALL_PLAYERS.length
        const requiredVotes: number = totalPlayers / 2

        if (Votekick.Voters.length >= requiredVotes) {
            print(
                `${Colors.COLOR_YELLOW}Votekick succeeded. ${Votekick.Voters.length}/${totalPlayers} players voted yes. ${ColorUtils.PlayerNameColored(target)}${Colors.COLOR_YELLOW} has been removed from the game.${Colors.COLOR_RESET}`
            )
            PlayerLeaves.PlayerLeavesActions(target)
            target.remove(PLAYER_GAME_RESULT_DEFEAT)
        } else {
            print(
                `${Colors.COLOR_YELLOW}Votekick failed. Only ${Votekick.Voters.length}/${totalPlayers} players voted yes. Not enough votes to remove ${ColorUtils.PlayerNameColored(target)}.${Colors.COLOR_RESET}`
            )
        }
        Votekick.EndVotekick()
    }

    private static EndVotekick() {
        Votekick.VoteActive = false
        Votekick.VoteStarter = undefined
        Votekick.VoteKickPlayer = undefined
        Votekick.Voters = []
    }

    private static VotekickAlreadyActive(): boolean {
        if (Votekick.VoteActive || VoteEndRound.VoteActive) {
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
        const playerID = S2I(player)
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
