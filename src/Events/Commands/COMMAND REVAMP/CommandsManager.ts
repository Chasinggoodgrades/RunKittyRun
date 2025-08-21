import { Kitty } from 'src/Game/Entities/Kitty/Kitty'
import { Globals } from 'src/Global/Globals'
import { CustomStatFrame } from 'src/UI/CustomStatFrame'
import { Colors } from 'src/Utility/Colors/Colors'
import { ColorUtils } from 'src/Utility/Colors/ColorUtils'
import { Action } from 'src/Utility/CSUtils'
import { isNullOrEmpty } from 'src/Utility/StringUtils'
import { Utility } from 'src/Utility/Utility'
import { getTriggerPlayer } from 'src/Utility/w3tsUtils'
import { MapPlayer } from 'w3ts'

type CmdAction = (player: MapPlayer, args: string[]) => void

export class Commands {
    public name: string
    public Alias: string[]
    public Group: string // "all", "vip", "admin", "dev" "some other shit? naw prolly good", "oh yeah, i should put red lmao"
    public ArgDesc: string
    public Description: string
    public Action: CmdAction
}

export class CommandsManager {
    public static Count = 0
    private static AllCommands: Map<string, Commands> = new Map()
    private static CommandsList: Commands[] = []
    private static KittiesList: Kitty[] = []

    public static RegisterCommand = (props: {
        name: string
        alias: string
        group: string
        argDesc: string
        description: string
        action: CmdAction
    }) => {
        const command = new Commands()
        command.name = props.name
        command.Alias = props.alias.split(',')
        command.Group = props.group
        command.ArgDesc = props.argDesc
        command.Description = props.description
        command.Action = props.action
        CommandsManager.Count = CommandsManager.Count + 1
        CommandsManager.AllCommands.set(props.name, command)
        for (const al of command.Alias) {
            CommandsManager.AllCommands.set(al, command)
        }
    }

    public static GetCommand(name: string): Commands | null {
        const command = CommandsManager.AllCommands.get(name)
        return command ? command : null
    }

    private static ResolvePlayerIdArray(arg: string): Kitty[] {
        CommandsManager.KittiesList = []
        const kitties = CommandsManager.KittiesList
        const larg = arg.toLowerCase()

        if (arg === '') {
            // no arg for self
            const kitty = Globals.ALL_KITTIES.get(getTriggerPlayer()!)
            if (kitty) kitties.push(kitty)
        } else if (larg === 'a' || larg === 'all') {
            for (let i = 0; i < Globals.ALL_KITTIES_LIST.length; i++) {
                const kitty = Globals.ALL_KITTIES_LIST[i]
                kitties.push(kitty) // add all players
            }
        } else if (larg === 'ai' || larg === 'computer' || larg === 'computers') {
            for (let i = 0; i < Globals.ALL_KITTIES_LIST.length; i++) {
                const kitty = Globals.ALL_KITTIES_LIST[i]
                if (
                    kitty.Player.slotState === PLAYER_SLOT_STATE_PLAYING &&
                    kitty.Player.controller === MAP_CONTROL_COMPUTER
                ) {
                    kitties.push(kitty) // add all AI players
                }
            }
        } else if (larg === 's' || larg === 'sel' || larg === 'select' || larg === 'selected') {
            const selectedUnit = CustomStatFrame.SelectedUnit.get(getTriggerPlayer())
            if (selectedUnit) {
                const kitty = Globals.ALL_KITTIES.get(selectedUnit.owner) ?? null
                if (kitty) {
                    kitties.push(kitty)
                }
            }
        } else if (!isNaN(parseInt(arg, 10))) {
            const playerId = parseInt(arg, 10)
            const kitty = Globals.ALL_KITTIES.get(MapPlayer.fromIndex(playerId - 1)!)
            if (kitty) {
                kitties.push(kitty)
            }
        } else if (Utility.GetPlayerByName(larg)) {
            const p = Utility.GetPlayerByName(larg)
            if (!p) return []
            const kitty = Globals.ALL_KITTIES.get(p)
            if (kitty) {
                kitties.push(kitty)
            }
        } else if (ColorUtils.GetPlayerByColor(larg)) {
            const pl = ColorUtils.GetPlayerByColor(larg)
            if (!pl) return []
            const kitty = Globals.ALL_KITTIES.get(pl)
            if (kitty) {
                kitties.push(kitty)
            }
        } else {
            getTriggerPlayer().DisplayTimedTextTo(
                5.0,
                `${Colors.COLOR_YELLOW}Invalid player ID:|r ${arg}.${Colors.COLOR_RESET}`
            )
        }
        return kitties
    }

    public static ResolvePlayerId = (arg: string, action: Action<Kitty>) => {
        const kittyArray = CommandsManager.ResolvePlayerIdArray(arg)

        for (let i = 0; i < kittyArray.length; i++) {
            action(kittyArray[i])
        }
    }

    public static GetBool = (arg: string) => {
        if (isNullOrEmpty(arg)) return false
        const lower = arg.toLowerCase()
        return lower === 'true' || lower === 'on' || lower === '1'
    }

    public static HelpCommands = (player: MapPlayer, arg = '') => {
        const filter = isNullOrEmpty(arg) ? '' : arg.toLowerCase()
        CommandsManager.CommandsList = [] // instead of creating a new list each time, just use 1 and clear it
        const playerGroup = CommandsManager.GetPlayerGroup(player)

        for (const [_, command] of CommandsManager.AllCommands) {
            const cmd = command
            if (CommandsManager.CommandsList.includes(cmd)) continue // already got cmd / alias
            if (cmd.Group === playerGroup || cmd.Group === 'all' || playerGroup === 'admin') {
                // admins get ALL DUH
                if (isNullOrEmpty(arg) || arg.length === 0) {
                    CommandsManager.CommandsList.push(cmd)
                } else {
                    if (
                        cmd.name.toLowerCase().includes(filter) ||
                        cmd.Alias.some(alias => alias.toLowerCase().includes(filter)) ||
                        cmd.Description.toLowerCase().includes(filter)
                    ) {
                        CommandsManager.CommandsList.push(cmd)
                    }
                }
            }
        }
        if (CommandsManager.CommandsList.length === 0) {
            player.DisplayTimedTextTo(
                5.0,
                `${Colors.COLOR_YELLOW_ORANGE}No commands found for filter: ${Colors.COLOR_GOLD}${filter}|r`
            )
            return
        }

        let commandList = ''
        for (const cmd of CommandsManager.CommandsList) {
            commandList += `${Colors.COLOR_YELLOW}( ${cmd.name} | ${cmd.Alias.join(', ')} )|r${Colors.COLOR_RED}[${cmd.ArgDesc}]${Colors.COLOR_RESET} - ${Colors.COLOR_GOLD}${cmd.Description}|r\n`
        }

        player.DisplayTimedTextTo(15.0, `${Colors.COLOR_TURQUOISE}Commands: Available:|r\n${commandList}`)
    }

    public static GetPlayerGroup = (player: MapPlayer) => {
        return Globals.VIPLISTUNFILTERED.includes(player) ? 'admin' : player.id === 0 ? 'red' : 'all'
    }
}
