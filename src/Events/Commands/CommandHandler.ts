import { Globals } from 'src/Global/Globals'
import { Colors } from 'src/Utility/Colors/Colors'
import { getTriggerPlayer } from 'src/Utility/w3tsUtils'
import { MapPlayer, Trigger } from 'w3ts'
import { CommandsManager } from './COMMAND REVAMP/CommandsManager'
import { InitCommands } from './COMMAND REVAMP/InitCommands'
import { ExecuteLua } from './ExecuteLua'
import { GamemodeCmd } from './GamemodeCmd'

export class CommandHandler {
    private static DebugCmdTrigger: Trigger = Trigger.create()!
    private static NewCmdHandler: Trigger = Trigger.create()!
    private static readonly EmptyStringArray = ['']

    public static Initialize() {
        InitCommands.InitializeCommands()
        for (let i = 0; i < GetBJMaxPlayers(); i++) {
            if (MapPlayer.fromIndex(i)!.slotState !== PLAYER_SLOT_STATE_PLAYING) continue
            CommandHandler.DebugCmdTrigger.registerPlayerChatEvent(MapPlayer.fromIndex(i)!, '?', false)
            CommandHandler.NewCmdHandler.registerPlayerChatEvent(MapPlayer.fromIndex(i)!, '-', false)
        }
        CommandHandler.DebugCmdTrigger.addAction(CommandHandler.DebugHandle)
        CommandHandler.NewCmdHandler.addAction(CommandHandler.HandleCommands)
    }

    private static HandleCommands() {
        if (!Globals.GAME_INITIALIZED) return
        const chatString = GetEventPlayerChatString() || ''
        if (chatString.length < 2 || chatString[0] !== '-') return

        const cmd = chatString.substring(1)
        const spaceIndex = cmd.indexOf(' ')

        let commandName: string
        let args: string[]

        if (spaceIndex < 0) {
            commandName = cmd
            args = CommandHandler.EmptyStringArray
        } else {
            commandName = cmd.substring(0, spaceIndex)
            const remainder = cmd.substring(spaceIndex + 1)
            const split = remainder.split(' ').filter(v => !!v)
            args = split.length > 0 ? split : CommandHandler.EmptyStringArray
        }

        if (CommandHandler.GamemodeSetting(GetEventPlayerChatString() || '')) return

        try {
            const command = CommandsManager.GetCommand(commandName.toLowerCase())
            const playerGroup = CommandsManager.GetPlayerGroup(getTriggerPlayer())
            if (
                command !== null &&
                (command.Group === playerGroup || command.Group === 'all' || playerGroup === 'admin')
            ) {
                command.Action(getTriggerPlayer(), args)
            } else {
                getTriggerPlayer().DisplayTimedTextTo(4.0, `${Colors.COLOR_YELLOW_ORANGE}Command not found.|r`)
            }
        } catch (ex: any) {
            getTriggerPlayer().DisplayTimedTextTo(
                4.0,
                `${Colors.COLOR_YELLOW_ORANGE}Error executing command:${Colors.COLOR_RESET} ${Colors.COLOR_RED}${ex} ${ex.StackTrace}${Colors.COLOR_RESET}`
            )
            return
        }
    }

    private static GamemodeSetting(chatString: string) {
        const player = getTriggerPlayer()
        const command = chatString.toLowerCase()

        if (!command.startsWith('-t ') && command !== '-s' && !command.startsWith('-dev')) return false

        GamemodeCmd.Handle(player, command)
        return true
    }

    private static DebugHandle() {
        const player = getTriggerPlayer()
        const chatString = GetEventPlayerChatString() || ''
        const command = chatString.toLowerCase()

        if (command.startsWith('?') && Globals.VIPLISTUNFILTERED.includes(player)) {
            if (command.toLowerCase().startsWith('?exec')) ExecuteLua.LuaCode(player, chatString)
        }
    }
}
