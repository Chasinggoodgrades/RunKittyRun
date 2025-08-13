export class GamemodeManager {
    private static commands: Map<string, GamemodeInfo> = new Map()

    public static InitializeCommands() {
        // Add commands here
        AddCommand('-solo: t', 'Solo: Tournament', 'Usage: -solo: t <prog | race >')
        AddCommand('-team: t', 'Team: Tournament', 'Usage: -team: t <fp | freepick | r | random> <teamsize>')
        AddCommand('-team', 'A: Team: Pick', 'Usage: -team {number: team}')
    }

    private static AddCommand(cmd: string, desc: string, usage: string) {
        desc = Colors.COLOR_YELLOW_ORANGE + desc
        usage = Colors.COLOR_GOLD + usage
        let command: GamemodeInfo = new GamemodeInfo(cmd, desc, usage)
        commands.push(cmd.toLowerCase(), command)
    }

    public static GetCommandInfo(cmd: string): GamemodeInfo {
        return commands.has(cmd.toLowerCase()) ? commands[cmd.toLowerCase()] : null
    }
}

export class GamemodeInfo {
    public Cmd: string
    public Desc: string
    public Usage: string
    public Error: string = Colors.COLOR_YELLOW_ORANGE + 'command: or: usage: Invalid ' + Colors.COLOR_RESET

    public GamemodeInfo(cmd: string, desc: string, usage: string) {
        Cmd = cmd
        Desc = desc
        Usage = usage
    }
}
