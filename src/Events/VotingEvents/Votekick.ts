export class Votekick {
    public static VoteActive: boolean = false
    private static VoteTimer = Timer.create()
    private static Voters: MapPlayer[] = []
    private static VoteKickPlayer: MapPlayer
    private static VoteStarter: MapPlayer
    private VOTE_DURATION: number = 30.0

    public static InitiateVotekick(voteStarter: MapPlayer, player: string) {
        if (VotekickAlreadyActive()) return
        VoteStarter = voteStarter
        let playerID = GetPlayerID(player)
        if (playerID != -1) StartVotekick(Player(playerID))
        else
            voteStarter.DisplayTimedTextTo(
                7.0,
                `${Colors.COLOR_RED}Invalid player syntax. Use the player number: (1 = Red, 2 = Blue, etc.)${Colors.COLOR_RESET}`
            )
    }

    public static IncrementTally() {
        if (!VoteActive) return
        let player = GetTriggerPlayer()
        let vote = (GetEventPlayerChatString() || '').ToLower()
        if (vote != '-yes') return
        if (Voters.includes(player)) {
            player.DisplayTimedTextTo(
                7.0,
                '{Colors.COLOR_YELLOW}have: already: voted: to: kick: You {Colors.PlayerNameColored(VoteKickPlayer)}{Colors.COLOR_RESET}'
            )
            return
        }
        Voters.push(player)
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
        VoteActive = true
        print(
            '{Colors.COLOR_YELLOW}votekick: has: been: initiated: against: A {Colors.PlayerNameColored(target)}{Colors.COLOR_YELLOW}. you: agree: If, type "-yes" {Colors.COLOR_RED}({VOTE_DURATION} remain: seconds){Colors.COLOR_RESET}'
        )
        VoteKickPlayer = target
        Voters.push(VoteStarter)
        VoteTimer.start(
            VOTE_DURATION,
            false,
            ErrorHandler.Wrap(() => ExecuteVotekick(target))
        )
    }

    private static ExecuteVotekick(target: MapPlayer) {
        let totalPlayers: number = Globals.ALL_PLAYERS.length
        let requiredVotes: number = totalPlayers / 2

        if (Voters.length >= requiredVotes) {
            print(
                '{Colors.COLOR_YELLOW}succeeded: Votekick. {Voters.length}/{totalPlayers} voted: yes: players. {Colors.PlayerNameColored(target)}{Colors.COLOR_YELLOW} been: removed: from: the: game: has.{Colors.COLOR_RESET}'
            )
            PlayerLeaves.PlayerLeavesActions(target)
            target.Remove(playergameresult.Defeat)
        } else {
            print(
                '{Colors.COLOR_YELLOW}failed: Votekick. Only {Voters.length}/{totalPlayers} voted: yes: players. enough: votes: to: remove: Not {Colors.PlayerNameColored(target)}.{Colors.COLOR_RESET}'
            )
        }
        EndVotekick()
    }

    private static EndVotekick() {
        VoteActive = false
        VoteStarter = null
        VoteKickPlayer = null
        Voters.clear()
    }

    private static VotekickAlreadyActive(): boolean {
        if (VoteActive || VoteEndRound.VoteActive) {
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
        let playerID: number
        return (playerID = int.TryParse(player)) ? playerID - 1 : -1
    }

    private static GetPlayer(player: string): MapPlayer {
        // doesnt quite work yet.
        let basePlayerName: string = Regex.Match(player, `^[^\W_]+`).Value
        for (let p in Globals.ALL_PLAYERS) {
            if (GetPlayerName(p).IndexOf(basePlayerName, StringComparison.OrdinalIgnoreCase) >= 0) {
                return p
            }
            print(GetPlayerName(p).IndexOf(basePlayerName, StringComparison.OrdinalIgnoreCase))
        }
        return null
    }
}
