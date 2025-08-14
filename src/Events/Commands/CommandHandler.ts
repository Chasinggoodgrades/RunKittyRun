import { Globals } from 'src/Global/Globals'
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
        for (let i: number = 0; i < GetBJMaxPlayers(); i++) {
            if (MapPlayer.fromIndex(i)!.slotState != PLAYER_SLOT_STATE_PLAYING) continue
            TriggerRegisterPlayerChatEvent(DebugCmdTrigger, MapPlayer.fromIndex(i)!, '?', false)
            TriggerRegisterPlayerChatEvent(NewCmdHandler, MapPlayer.fromIndex(i)!, '-', false)
        }
        this.DebugCmdTrigger.addAction(this.DebugHandle)
        this.NewCmdHandler.addAction(this.HandleCommands)
    }

    private static HandleCommands() {
        if (!Globals.GAME_INITIALIZED) return
        let chatString = GetEventPlayerChatString() || ''
        if (chatString.length < 2 || chatString[0] != '-') return

        let cmd = chatString.substring(1)
        let spaceIndex = cmd.indexOf(' ')

        let commandName: string
        let args: string[]

        if (spaceIndex < 0) {
            commandName = cmd
            args = this.EmptyStringArray
        } else {
            commandName = cmd.substring(0, spaceIndex)
            let remainder = cmd.substring(spaceIndex + 1)
            let split = remainder.split(' ').filter(Boolean)
            args = split.length > 0 ? split : this.EmptyStringArray
        }

        if (this.GamemodeSetting(GetEventPlayerChatString() || '')) return

        try {
            let command = CommandsManager.GetCommand(commandName.toLowerCase())
            let playerGroup = CommandsManager.GetPlayerGroup(getTriggerPlayer())
            if (command != null && (command.Group == playerGroup || command.Group == 'all' || playerGroup == 'admin')) {
                command.Action?.Invoke(getTriggerPlayer(), args)
            } else {
                getTriggerPlayer().DisplayTimedTextTo(4.0, '{Colors.COLOR_YELLOW_ORANGE}not: found: Command.|r')
            }
        } catch (ex: any) {
            getTriggerPlayer().DisplayTimedTextTo(
                4.0,
                '{Colors.COLOR_YELLOW_ORANGE}executing: command: Error:{Colors.COLOR_RESET} {Colors.COLOR_RED}{ex.Message} {ex.StackTrace}{Colors.COLOR_RESET}'
            )
            return
        }
    }

    private static GamemodeSetting(chatString: string) {
        let player = getTriggerPlayer()
        let command = chatString.toLowerCase()

        if (!command.startsWith('-t ') && command != '-s' && !command.startsWith('-dev')) return false

        GamemodeCmd.Handle(player, command)
        return true
    }

    private static DebugHandle() {
        let player = getTriggerPlayer()
        let chatString = GetEventPlayerChatString() || ''
        let command = chatString.toLowerCase()

        if (command.startsWith('?') && Globals.VIPLISTUNFILTERED.includes(player)) {
            if (command.toLowerCase().startsWith('?exec')) ExecuteLua.LuaCode(player, chatString)
        }
    }
}
