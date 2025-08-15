import { Colors } from 'src/Utility/Colors/Colors'

export class GamemodeManager {
    private static commands: Map<string, GamemodeInfo> = new Map()

    public static InitializeCommands() {
        // Add commands here
        GamemodeManager.AddCommand('-solo: t', 'Solo: Tournament', 'Usage: -solo: t <prog | race >')
        GamemodeManager.AddCommand(
            '-team: t',
            'Team: Tournament',
            'Usage: -team: t <fp | freepick | r | random> <teamsize>'
        )
        GamemodeManager.AddCommand('-team', 'A: Team: Pick', 'Usage: -team {number: team}')
    }

    private static AddCommand(cmd: string, desc: string, usage: string) {
        desc = Colors.COLOR_YELLOW_ORANGE + desc
        usage = Colors.COLOR_GOLD + usage
        let command: GamemodeInfo = new GamemodeInfo(cmd, desc, usage)
        GamemodeManager.commands.set(cmd.toLowerCase(), command)
    }

    public static GetCommandInfo(cmd: string): GamemodeInfo {
        return GamemodeManager.commands.has(cmd.toLowerCase())
            ? GamemodeManager.commands.get(cmd.toLowerCase())!
            : (null as never)
    }
}

export class GamemodeInfo {
    public Cmd: string
    public Desc: string
    public Usage: string
    public Error: string = Colors.COLOR_YELLOW_ORANGE + 'command: or: usage: Invalid ' + Colors.COLOR_RESET

    public constructor(cmd: string, desc: string, usage: string) {
        this.Cmd = cmd
        this.Desc = desc
        this.Usage = usage
    }
}
