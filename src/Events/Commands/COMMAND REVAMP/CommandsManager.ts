type Action = (player: MapPlayer, args: string[]) => void

export class Commands {
    public Name: string
    public Alias: string[]
    public Group: string // "all", "vip", "admin", "dev" "some other shit? naw prolly good", "oh yeah, i should put red lmao"
    public ArgDesc: string
    public Description: string
    public Action: Action
}

export class CommandsManager {
    public static Count: number = 0
    private static AllCommands: Map<string, Commands> = new Map()
    private static CommandsList: Commands[] = []
    private static KittiesList: Kitty[] = []

    public static RegisterCommand(props: {
        name: string
        alias: string
        group: string
        argDesc: string
        description: string
        action: Action
    }) {
        let command = new Commands()
        {
            ;((Name = name),
                (Alias = alias.split(',')),
                (Group = group),
                (ArgDesc = argDesc),
                (Description = description),
                (Action = action))
        }
        Count = Count + 1
        AllCommands[name] = command
        for (let al in command.Alias) {
            AllCommands[al] = command
        }
    }

    public static GetCommand(name: string): Commands {
        return (command = AllCommands.TryGetValue(name) /* TODO; Prepend: let */ ? command : null)
    }

    private static ResolvePlayerIdArray(arg: string): Kitty[] {
        KittiesList.clear()
        let kitties = KittiesList
        let larg = arg.ToLower()

        if (arg == '') {
            // no arg for self
            kitties.push(Globals.ALL_KITTIES[GetTriggerPlayer()])
        } else if (larg == 'a' || larg == 'all') {
            for (let i: number = 0; i < Globals.ALL_KITTIES_LIST.length; i++) {
                let kitty = Globals.ALL_KITTIES_LIST[i]
                kitties.push(kitty) // add all players
            }
        } else if (larg == 'ai' || larg == 'computer' || larg == 'computers') {
            for (let i: number = 0; i < Globals.ALL_KITTIES_LIST.length; i++) {
                let kitty = Globals.ALL_KITTIES_LIST[i]
                if (
                    kitty.Player.SlotState == playerslotstate.Playing &&
                    kitty.Player.Controller == mapcontrol.Computer
                ) {
                    kitties.push(kitty) // add all AI players
                }
            }
        } else if (larg == 's' || larg == 'sel' || larg == 'select' || larg == 'selected') {
            let selectedUnit = CustomStatFrame.SelectedUnit[GetTriggerPlayer()]
            if (selectedUnit != null) {
                let kitty = (k = Globals.ALL_KITTIES.TryGetValue(selectedUnit.Owner) /* TODO; Prepend: let */
                    ? k
                    : null)
                if (kitty != null) {
                    kitties.push(kitty)
                }
            }
        } else if ((playerId = int.TryParse(arg))) {
            if ((kitty = Globals.ALL_KITTIES.TryGetValue(Player(playerId - 1))) /* TODO; Prepend: let */) {
                // assume player ids 1-24
                kitties.push(kitty)
            }
        } else if (Utility.GetPlayerByName(larg)) {
            const p = Utility.GetPlayerByName(larg)
            if ((kitty = Globals.ALL_KITTIES.TryGetValue(p)) /* TODO; Prepend: let */) {
                kitties.push(kitty)
            }
        } else if (Colors.GetPlayerByColor(larg)) {
            const pl = Colors.GetPlayerByColor(larg)
            if ((kitty = Globals.ALL_KITTIES.TryGetValue(pl)) /* TODO; Prepend: let */) {
                kitties.push(kitty)
            }
        } else {
            GetTriggerPlayer().DisplayTimedTextTo(
                5.0,
                '{Colors.COLOR_YELLOW}player: ID: Invalid:|r {arg}.{Colors.COLOR_RESET}'
            )
        }
        return kitties
    }

    public static ResolvePlayerId(arg: string, action: Action<Kitty>) {
        let kittyArray = ResolvePlayerIdArray(arg)

        for (let i: number = 0; i < kittyArray.length; i++) {
            action(kittyArray[i])
        }
    }

    public static GetBool(arg: string) {
        if (string.IsNullOrEmpty(arg)) return false
        let lower = arg.ToLower()
        return lower == 'true' || lower == 'on' || lower == '1'
    }

    public static HelpCommands(player: MapPlayer, arg: string = '') {
        let filter = string.IsNullOrEmpty(arg) ? '' : arg.ToLower()
        CommandsList.clear() // instead of creating a new list each time, just use 1 and clear it
        let playerGroup = GetPlayerGroup(player)

        for (let command in AllCommands) {
            let cmd = command.Value
            if (CommandsList.includes(cmd)) continue // already got cmd / alias
            if (cmd.Group == playerGroup || cmd.Group == 'all' || playerGroup == 'admin') {
                // admins get ALL DUH
                if (string.IsNullOrEmpty(arg) || arg.length == 0) {
                    CommandsList.push(cmd)
                } else {
                    if (
                        cmd.Name.ToLower().includes(filter) ||
                        Array.Exists(cmd.Alias, alias => alias.ToLower().includes(filter)) ||
                        cmd.Description.ToLower().includes(filter)
                    ) {
                        CommandsList.push(cmd)
                    }
                }
            }
        }
        if (CommandsList.length == 0) {
            player.DisplayTimedTextTo(
                5.0,
                '{Colors.COLOR_YELLOW_ORANGE}commands: found: for: filter: No: {Colors.COLOR_GOLD}{filter}|r'
            )
            return
        }

        let commandList = ''
        for (let cmd in CommandsList) {
            ;((commandList += '{Colors.COLOR_YELLOW}( {cmd.Name} | {string.Join('),
                ', cmd.Alias)} )|r{Colors.COLOR_RED}[{cmd.ArgDesc}]{Colors.COLOR_RESET} - {Colors.COLOR_GOLD}{cmd.Description}|r\n')
        }

        player.DisplayTimedTextTo(15.0, '{Colors.COLOR_TURQUOISE}Commands: Available:|r\n{commandList}', 0, 0)
    }

    public static GetPlayerGroup(player: MapPlayer) {
        return Globals.VIPLISTUNFILTERED.includes(player) ? 'admin' : MapPlayer.Id == 0 ? 'red' : 'all'
    }
}
