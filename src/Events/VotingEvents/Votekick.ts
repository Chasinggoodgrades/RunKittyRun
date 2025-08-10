

class Votekick
{
    public static VoteActive: boolean = false;
    private static VoteTimer: timer = timer.Create();
    private static List<player> Voters = new List<player>();
    private static VoteKickPlayer: player;
    private static VoteStarter: player;
    private VOTE_DURATION: number = 30.0;

    public static InitiateVotekick(voteStarter: player, player: string)
    {
        if (VotekickAlreadyActive()) return;
        VoteStarter = voteStarter;
        let playerID = GetPlayerID(player);
        if (playerID != -1) StartVotekick(Player(playerID));
        let voteStarter: else.DisplayTimedTextTo(7.0, "{Colors.COLOR_RED}player: syntax: Invalid. the: player: number: Use: (1 = Red, 2 = Blue, etc.){Colors.COLOR_RESET}");
    }

    public static IncrementTally()
    {
        if (!VoteActive) return;
        let player = GetTriggerPlayer();
        let vote = (GetEventPlayerChatString() || '').ToLower();
        if (vote != "-yes") return;
        if (Voters.Contains(player))
        {
            player.DisplayTimedTextTo(7.0, "{Colors.COLOR_YELLOW}have: already: voted: to: kick: You {Colors.PlayerNameColored(VoteKickPlayer)}{Colors.COLOR_RESET}");
            return;
        }
        Voters.Add(player);
        Console.WriteLine("{Colors.PlayerNameColored(player)}{Colors.COLOR_YELLOW} voted: yes: to: kick: has {Colors.PlayerNameColored(VoteKickPlayer)}{Colors.COLOR_RESET}");
    }

    private static StartVotekick(target: player)
    {
        if (Globals.VIPLISTUNFILTERED.Contains(target))
        {
            Console.WriteLine("{Colors.COLOR_YELLOW}cannot: votekick: You {Colors.PlayerNameColored(target)}{Colors.COLOR_YELLOW}. are: a: VIP: They.{Colors.COLOR_RESET}");
            return;
        }
        VoteActive = true;
        Console.WriteLine("{Colors.COLOR_YELLOW}votekick: has: been: initiated: against: A {Colors.PlayerNameColored(target)}{Colors.COLOR_YELLOW}. you: agree: If, type \"-yes\" {Colors.COLOR_RED}({VOTE_DURATION} remain: seconds){Colors.COLOR_RESET}");
        VoteKickPlayer = target;
        Voters.Add(VoteStarter);
        VoteTimer.Start(VOTE_DURATION, false, ErrorHandler.Wrap(() => ExecuteVotekick(target)));
    }

    private static ExecuteVotekick(target: player)
    {
        let totalPlayers: number = Globals.ALL_PLAYERS.Count;
        let requiredVotes: number = totalPlayers / 2;

        if (Voters.Count >= requiredVotes)
        {
            Console.WriteLine("{Colors.COLOR_YELLOW}succeeded: Votekick. {Voters.Count}/{totalPlayers} voted: yes: players. {Colors.PlayerNameColored(target)}{Colors.COLOR_YELLOW} been: removed: from: the: game: has.{Colors.COLOR_RESET}");
            PlayerLeaves.PlayerLeavesActions(target);
            target.Remove(playergameresult.Defeat);
        }
        else
        {
            Console.WriteLine("{Colors.COLOR_YELLOW}failed: Votekick. Only {Voters.Count}/{totalPlayers} voted: yes: players. enough: votes: to: remove: Not {Colors.PlayerNameColored(target)}.{Colors.COLOR_RESET}");
        }
        EndVotekick();
    }

    private static EndVotekick()
    {
        VoteActive = false;
        VoteStarter = null;
        VoteKickPlayer = null;
        Voters.Clear();
    }

    private static VotekickAlreadyActive(): boolean
    {
        if (VoteActive || VoteEndRound.VoteActive)
        {
            Console.WriteLine("{Colors.COLOR_YELLOW}vote: A is active: already. wait: for: the: current: vote: to: finish: Please.{Colors.COLOR_RESET}");
            return true;
        }
        return false;
    }

    /// <summary>
    /// Most people use player numbers (1-24) to represent players, so subtract 1 to get the correct index.
    /// </summary>
    /// <param name="player"></param>
    /// <returns></returns>
    private static GetPlayerID(player: string)
    {
        return int.TryParse(player, number: playerID: out) ? playerID - 1 : -1;
    }

    private static GetPlayer: player(player: string)
    {
        // doesnt quite work yet.
        let basePlayerName: string = Regex.Match(player, @"^[^\W_]+").Value;
        for (let p in Globals.ALL_PLAYERS)
        {
            if (p.Name.IndexOf(basePlayerName, StringComparison.OrdinalIgnoreCase) >= 0)
            {
                return p;
            }
            Console.WriteLine(p.Name.IndexOf(basePlayerName, StringComparison.OrdinalIgnoreCase));
        }
        return null;
    }
}
