import { getUdgEscapers } from '../../../../globals'
import { MemoryHandler } from '../../../Utils/MemoryHandler'
import { createEvent, forRange } from '../../../Utils/mapUtils'
import { escapePipes } from '../../01_libraries/Basic_functions'
import { Constants } from '../../01_libraries/Constants'
import { Text } from '../../01_libraries/Text'
import { Escaper } from '../../04_STRUCTURES/Escaper/Escaper'
import { Globals } from '../../09_From_old_Worldedit_triggers/globals_variables_and_triggers'
import { Natives } from '../../wc3_natives_unsecured/Natives'
import { initCommandAll } from '../Commands/1_all'
import { initExecuteCommandRed } from '../Commands/2_first_player'
import { initExecuteCommandCheat } from '../Commands/3_cheat'
import { initExecuteCommandMake } from '../Commands/4_make'
import { initExecuteCommandMake_monsters } from '../Commands/4_make_monsters'
import { initExecuteCommandMake_spawns } from '../Commands/4_make_spawns'
import { initExecuteCommandMake_terrain } from '../Commands/4_make_terrain'
import { initExecuteCommandMake_terrain_saves } from '../Commands/4_make_terrain_saves'
import { initExecuteCommandMax } from '../Commands/5_admin'
import { initExecuteCommandTrueMax } from '../Commands/6_superadmin'
import { CmdName, CmdParam, IsCmd, NbParam, NoParam, USAGE } from './Command_functions'
import { handlePagination, handlePaginationArgs } from './Pagination'

export type ICommandExecution = ReturnType<typeof initCommandExecution>

export type ICommand = {
    name: string
    alias: string[]
    group: 'all' | 'red' | 'cheat' | 'make' | 'max' | 'truemax'
    argDescription: string
    description: string
    enabled?: (cmd: IParsedCmdContext, escaper: Escaper) => boolean
    cb: (cmd: IParsedCmdContext, escaper: Escaper) => true | typeof USAGE
}

type IParsedCmdContext = ReturnType<typeof parseCmdContext>

const parseCmdContext = (cmd: string) => {
    const obj = MemoryHandler.getEmptyObject<{
        cmd: string
        name: string
        noParam: boolean
        nbParam: number
        param1: string
        param2: string
        param3: string
        param4: string
        param5: string
        param6: string
        param7: string
    }>()

    obj.cmd = cmd
    obj.name = CmdName(cmd)
    obj.noParam = NoParam(cmd)
    obj.nbParam = NbParam(cmd)

    obj.param1 = CmdParam(cmd, 1)
    obj.param2 = CmdParam(cmd, 2)
    obj.param3 = CmdParam(cmd, 3)
    obj.param4 = CmdParam(cmd, 4)
    obj.param5 = CmdParam(cmd, 5)
    obj.param6 = CmdParam(cmd, 6)
    obj.param7 = CmdParam(cmd, 7)

    return obj
}

export const initCommandExecution = () => {
    const commands: ICommand[] = []
    let addCommandToHistoryCallback: ((command: string, playerId: number) => void) | null = null

    const registerCommand = (cmd: ICommand) => {
        commands.push(cmd)
    }

    const setAddCommandToHistory = (cb: (command: string, playerId: number) => void) => {
        addCommandToHistoryCallback = cb
    }

    const accessCheck = (escaper: Escaper, cmd: ICommand) => {
        if (escaper.cmdAccessMap[cmd.name]) {
            return true
        }

        switch (cmd.group) {
            case 'truemax': {
                if (!escaper.isTrueMaximaxou()) {
                    return false
                }
            }

            case 'max': {
                if (!escaper.isMaximaxou()) {
                    return false
                }
            }

            case 'make':
            case 'cheat': {
                if (!escaper.canCheat()) {
                    return false
                }
            }

            case 'red': {
                if (
                    !((escaper.getPlayer() === Natives.UPlayer(0) && Globals.udg_areRedRightsOn) || escaper.canCheat())
                ) {
                    return false
                }
            }

            case 'all':
            default:
                return true
        }
    }

    const findTargetCommand = (commands: ICommand[], parsedContext: IParsedCmdContext, escaper: Escaper) => {
        for (const cmd of commands) {
            const isMatchedName = cmd.name.toLowerCase() === parsedContext.name.toLowerCase()
            let isMatchedAlias = false

            for (const alias of cmd.alias) {
                if (alias.toLowerCase() === parsedContext.name.toLowerCase()) {
                    isMatchedAlias = true
                    break
                }
            }

            const isEnabled = cmd.enabled ? cmd.enabled(parsedContext, escaper) : true
            const hasAccess = accessCheck(escaper, cmd)

            if ((isMatchedName || isMatchedAlias) && isEnabled && hasAccess) {
                return cmd
            }
        }

        Text.erP(escaper.getPlayer(), 'unknown command or not enough rights')
    }

    const findTargetCommandSingle = (name: string, escaper: Escaper) => {
        for (const cmd of commands) {
            const isMatchedName = cmd.name.toLowerCase() === name.toLowerCase()
            let isMatchedAlias = false

            for (const alias of cmd.alias) {
                if (alias.toLowerCase() === name.toLowerCase()) {
                    isMatchedAlias = true
                    break
                }
            }

            const hasAccess = accessCheck(escaper, cmd)

            if ((isMatchedName || isMatchedAlias) && hasAccess) {
                return cmd
            }
        }
    }

    const ExecuteCommandSingle = (escaper: Escaper, cmd: string) => {
        try {
            const parsedContext = parseCmdContext(cmd)
            const targetCmd = findTargetCommand(commands, parsedContext, escaper)

            // "-<commandName> /?" shows that single command's own -help entry instead of running it.
            if (targetCmd && parsedContext.nbParam === 1 && parsedContext.param1 === '/?') {
                Text.P(escaper.getPlayer(), getCmdMessage(targetCmd))
                MemoryHandler.destroyObject(parsedContext)
                return
            }

            const result = targetCmd?.cb(parsedContext, escaper)
            if (result === USAGE && targetCmd) {
                const aliasText = targetCmd.alias.length > 0 ? ` (${escapePipes(targetCmd.alias.join(' | '))})` : ''
                Text.erP(
                    escaper.getPlayer(),
                    `Usage: -${targetCmd.name}${aliasText} ${escapePipes(targetCmd.argDescription)}`
                )
            }

            MemoryHandler.destroyObject(parsedContext)

            // if (!ExecuteCommandAll(escaper, cmd)) {
            //     if (!((escaper.getPlayer() == Player(0) && Globals.udg_areRedRightsOn) || escaper.canCheat())) {
            //         Text.erP(escaper.getPlayer(), 'unknown command or not enough rights')
            //         return
            //     }
            //     if (!ExecuteCommandRed(escaper, cmd)) {
            //         if (!escaper.canCheat()) {
            //             Text.erP(escaper.getPlayer(), 'unknown command or not enough rights')
            //             return
            //         }
            //         if (!ExecuteCommandCheat(escaper, cmd)) {
            //             if (!ExecuteCommandMake(escaper, cmd)) {
            //                 if (!escaper.isMaximaxou()) {
            //                     Text.erP(escaper.getPlayer(), 'unknown command or not enough rights')
            //                     return
            //                 }
            //                 if (!ExecuteCommandMax(escaper, cmd)) {
            //                     if (!escaper.isTrueMaximaxou()) {
            //                         Text.erP(escaper.getPlayer(), 'unknown command or not enough rights')
            //                         return
            //                     }
            //                     if (!ExecuteCommandTrueMax(escaper, cmd)) {
            //                         Text.erP(escaper.getPlayer(), 'unknown command')
            //                     }
            //                 }
            //             }
            //         }
            //     }
            // }
        } catch (error) {
            if (typeof error == 'string') {
                if (!!escaper.getPlayer()) {
                    Text.erP(escaper.getPlayer(), error)
                } else {
                    Text.erA(error)
                }
            }
        }
    }

    const ExecuteCommand = (escaper: Escaper, cmd: string) => {
        const singleCommands = MemoryHandler.getEmptyArray<string>()
        let char: string
        let i: number
        let nbParenthesesNonFermees = 0
        let singleCommandId = 0
        let charId: number
        let prevChar: string

        //ex : "-(abc def)" --> "-abc def"
        if (SubStringBJ(cmd, 2, 2) === '(' && SubStringBJ(cmd, StringLength(cmd), StringLength(cmd)) === ')') {
            cmd = (SubStringBJ(cmd, 1, 1) ?? '') + SubStringBJ(cmd, 3, StringLength(cmd) - 1)
        }

        // Add to command history
        if (addCommandToHistoryCallback) {
            addCommandToHistoryCallback(cmd, GetPlayerId(escaper.getPlayer()))
        }

        charId = 2
        prevChar = ''
        while (true) {
            if (charId > StringLength(cmd)) break
            char = SubStringBJ(cmd, charId, charId) ?? ''
            if (char === ',' && prevChar !== '\\') {
                if (nbParenthesesNonFermees <= 0) {
                    singleCommandId = singleCommandId + 1
                    charId = charId + 1
                }
            } else {
                if (char === '(') {
                    nbParenthesesNonFermees = nbParenthesesNonFermees + 1
                } else {
                    if (char === ')') {
                        nbParenthesesNonFermees = nbParenthesesNonFermees - 1
                    }
                }
            }
            if (char !== ',' || nbParenthesesNonFermees > 0 || prevChar === '\\') {
                if (char === ',' && prevChar === '\\') {
                    // Remove the backslash and add the comma
                    singleCommands[singleCommandId] =
                        SubStringBJ(
                            singleCommands[singleCommandId] || '',
                            1,
                            StringLength(singleCommands[singleCommandId] || '') - 1
                        ) + char
                } else {
                    singleCommands[singleCommandId] = (singleCommands[singleCommandId] || '') + char
                }
            }
            prevChar = char
            charId = charId + 1
        }
        i = 0
        while (true) {
            if (i > singleCommandId) break
            if (singleCommands[i] !== null && singleCommands[i] !== '') {
                ExecuteCommandSingle(escaper, '-' + singleCommands[i])
            }
            i = i + 1
        }

        MemoryHandler.destroyArray(singleCommands)
    }

    createEvent({
        events: [
            t =>
                forRange(Constants.NB_PLAYERS_MAX, i =>
                    TriggerRegisterPlayerChatEvent(t, Natives.UPlayer(i), '-', false)
                ),
        ],
        actions: [
            () => {
                if (!IsCmd(Natives.UGetEventPlayerChatString())) {
                    return
                }

                const escaper = getUdgEscapers().get(GetPlayerId(Natives.UGetTriggerPlayer()))

                if (!escaper) {
                    return
                }

                ExecuteCommand(escaper, Natives.UGetEventPlayerChatString())
            },
        ],
    })

    const getCmdMessage = (cmd: ICommand) => {
        let line = '|cffffcc00-' + cmd.name + '|r'

        if (cmd.alias.length > 0) {
            line += '|cffcccccc(' + escapePipes(cmd.alias.join(' | ')) + ')|r'
        }

        if (cmd.argDescription.length > 0) {
            line += ' |cff88ccff' + escapePipes(cmd.argDescription) + '|r'
        }

        if (cmd.description.length > 0) {
            line += ' |cffaaaaaa-->|r ' + cmd.description
        }

        return line
    }

    const initCommands = () => {
        // Commands All
        initCommandAll()

        // Commands first player
        initExecuteCommandRed()

        // Commands Cheat
        initExecuteCommandCheat()

        // Commands Make
        initExecuteCommandMake()
        initExecuteCommandMake_monsters()
        initExecuteCommandMake_spawns()
        initExecuteCommandMake_terrain()
        initExecuteCommandMake_terrain_saves()

        // Commands Admin
        initExecuteCommandMax()

        // Commands Superadmin
        initExecuteCommandTrueMax()

        registerCommand({
            name: 'help',
            alias: ['h', '?'],
            group: 'all',
            argDescription: '[search terms...] [page]',
            description: 'List commands. Use page number for pagination (10 per page)',
            cb: ({ cmd }) => {
                const { searchTerms, pageNum } = handlePaginationArgs(cmd)

                // Filter by all search terms
                const filtered = commands.filter(cmd => {
                    if (searchTerms.length === 0) {
                        return true
                    }

                    // Check if all search terms match
                    for (const searchTerm of searchTerms) {
                        let matched = false

                        // Check command name
                        if (cmd.name.toLowerCase().indexOf(searchTerm) >= 0) {
                            matched = true
                        }

                        // Check aliases
                        if (!matched && cmd.alias) {
                            for (const alias of cmd.alias) {
                                if (alias.toLowerCase().indexOf(searchTerm) >= 0) {
                                    matched = true
                                    break
                                }
                            }
                        }

                        // If this search term didn't match, exclude this command
                        if (!matched) {
                            return false
                        }
                    }

                    return true
                })

                const displayableCmds = handlePagination(
                    filtered.map(d => getCmdMessage(d)),
                    pageNum
                )

                Text.P(
                    Natives.UGetTriggerPlayer(),
                    `|cff00ff00Commands (page |cff00ccff${pageNum}|r|cff00ff00/|cff00ccff${displayableCmds.totalPages}|r|cff00ff00)|r`
                )

                for (const cmd of displayableCmds.cmds) {
                    const line = cmd
                    Text.P(Natives.UGetTriggerPlayer(), line)
                }

                return true
            },
        })
    }

    return {
        registerCommand,
        ExecuteCommand,
        initCommands,
        findTargetCommandSingle,
        setAddCommandToHistory,
    }
}
