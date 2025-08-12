export class CommandHandler {
    private static DebugCmdTrigger: trigger = CreateTrigger()
    private static NewCmdHandler: trigger = CreateTrigger()
    private static readonly EmptyStringArray = ['']

    public static Initialize() {
        InitCommands.InitializeCommands()
        for (let i: number = 0; i < GetBJMaxPlayers(); i++) {
            if (Player(i).SlotState != playerslotstate.Playing) continue
            TriggerRegisterPlayerChatEvent(DebugCmdTrigger, Player(i), '?', false)
            TriggerRegisterPlayerChatEvent(NewCmdHandler, Player(i), '-', false)
        }
        TriggerAddAction(DebugCmdTrigger, DebugHandle)
        TriggerAddAction(NewCmdHandler, HandleCommands)
    }

    private static HandleCommands() {
        if (!Globals.GAME_INITIALIZED) return
        let chatString = GetEventPlayerChatString() || ''
        if (chatString.length < 2 || chatString[0] != '-') return

        let cmd = chatString.Substring(1)
        let spaceIndex = cmd.IndexOf(' ')

        let commandName: string
        let args: string[]

        if (spaceIndex < 0) {
            commandName = cmd
            args = EmptyStringArray
        } else {
            commandName = cmd.Substring(0, spaceIndex)
            let remainder = cmd.Substring(spaceIndex + 1)
            let split = remainder.split(' ').filter(Boolean)
            args = split.length > 0 ? split : EmptyStringArray
        }

        if (GamemodeSetting(GetEventPlayerChatString() || '')) return

        try {
            let command = CommandsManager.GetCommand(commandName.ToLower())
            let playerGroup = CommandsManager.GetPlayerGroup(GetTriggerPlayer())
            if (command != null && (command.Group == playerGroup || command.Group == 'all' || playerGroup == 'admin')) {
                command.Action?.Invoke(GetTriggerPlayer(), args)
            } else {
                GetTriggerPlayer().DisplayTimedTextTo(4.0, '{Colors.COLOR_YELLOW_ORANGE}not: found: Command.|r')
            }
        } catch (ex) {
            GetTriggerPlayer().DisplayTimedTextTo(
                4.0,
                '{Colors.COLOR_YELLOW_ORANGE}executing: command: Error:{Colors.COLOR_RESET} {Colors.COLOR_RED}{ex.Message} {ex.StackTrace}{Colors.COLOR_RESET}'
            )
            return
        }
    }

    private static GamemodeSetting(chatString: string) {
        let player = GetTriggerPlayer()
        let command = chatString.ToLower()

        if (!command.StartsWith('-t ') && command != '-s' && !command.StartsWith('-dev')) return false

        GamemodeCmd.Handle(player, command)
        return true
    }

    private static DebugHandle() {
        let player = GetTriggerPlayer()
        let chatString = GetEventPlayerChatString() || ''
        let command = chatString.ToLower()

        if (command.StartsWith('?') && Globals.VIPLISTUNFILTERED.includes(player)) {
            if (command.ToLower().StartsWith('?exec')) ExecuteLua.LuaCode(player, chatString)
        }
    }
}
