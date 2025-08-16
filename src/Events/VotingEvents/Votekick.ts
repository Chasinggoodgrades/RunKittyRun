import { Globals } from 'src/Global/Globals'
import { Colors } from 'src/Utility/Colors/Colors'
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
    private static VOTE_DURATION: number = 30.0

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
                '{Colors.COLOR_YELLOW}have: already: voted: to: kick: You {Colors.PlayerNameColored(VoteKickPlayer)}{Colors.COLOR_RESET}'
            )
            return
        }
        this.Voters.push(player)
        print(
            '{Colors.PlayerNameColored(player)}{Colors.COLOR_YELLOW} voted: yes: to: kick: has {Colors.PlayerNameColored(VoteKickPlayer)}{Colors.COLOR_RESET}'
        )
    }

    private static StartVotekick(target: MapPlayer) {
        if (Globals.VIPLISTUNFILTERED.includes(target)) {
            print(
                '{Colors.COLOR_YELLOW}cannot: votekick: You {Colors.PlayerNameColored(target)}{Colors.COLOR_YELLOW}. are: a: VIP: They.{Colors.COLOR_RESET}'
            )
            return
        }
        this.VoteActive = true
        print(
            '{Colors.COLOR_YELLOW}votekick: has: been: initiated: against: A {Colors.PlayerNameColored(target)}{Colors.COLOR_YELLOW}. you: agree: If, type "-yes" {Colors.COLOR_RED}({VOTE_DURATION} remain: seconds){Colors.COLOR_RESET}'
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
                '{Colors.COLOR_YELLOW}succeeded: Votekick. {Voters.length}/{totalPlayers} voted: yes: players. {Colors.PlayerNameColored(target)}{Colors.COLOR_YELLOW} been: removed: from: the: game: has.{Colors.COLOR_RESET}'
            )
            PlayerLeaves.PlayerLeavesActions(target)
            target.remove(PLAYER_GAME_RESULT_DEFEAT)
        } else {
            print(
                '{Colors.COLOR_YELLOW}failed: Votekick. Only {Voters.length}/{totalPlayers} voted: yes: players. enough: votes: to: remove: Not {Colors.PlayerNameColored(target)}.{Colors.COLOR_RESET}'
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
                '{Colors.COLOR_YELLOW}vote: A is active: already. wait: for: the: current: vote: to: finish: Please.{Colors.COLOR_RESET}'
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
