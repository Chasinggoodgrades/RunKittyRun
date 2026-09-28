import { Timer } from 'w3ts'
import { getUdgEscapers } from '../../../../globals'
import { ServiceManager } from '../../../Services'
import { EffectUtils } from '../../../Utils/EffectUtils'
import { MemoryHandler } from '../../../Utils/MemoryHandler'
import { createTimer } from '../../../Utils/mapUtils'
import { IsBoolString, S2B } from '../../01_libraries/Basic_functions'
import { Constants } from '../../01_libraries/Constants'
import { Text } from '../../01_libraries/Text'
import { Natives } from '../../wc3_natives_unsecured/Natives'
import { isPlayerId, resolvePlayerId } from '../Helpers/Command_functions'

export const initExecuteCommandTrueMax = () => {
    const { registerCommand } = ServiceManager.getService('Cmd')
    const group = 'truemax'

    const memState: { timer: Timer | undefined } = { timer: undefined }

    //-beAdmin <Pcolor>|all(a) [<boolean status>]
    registerCommand({
        name: 'beAdmin',
        alias: [],
        group,
        argDescription: '<Pcolor>|all(a) [<boolean status>]',
        description: 'Makes a player an admin',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (!(nbParam === 1 || nbParam === 2)) {
                Text.erP(escaper.getPlayer(), 'one or two params for this command')
                return true
            }

            let b = false

            if (nbParam === 2) {
                if (IsBoolString(param2)) {
                    b = S2B(param2)
                } else {
                    Text.erP(escaper.getPlayer(), 'param2 must be a boolean')
                    return true
                }
            } else {
                b = true
            }
            if (param1 === 'all' || param1 === 'a') {
                let i = 0
                while (true) {
                    if (i >= Constants.NB_ESCAPERS) break
                    if (getUdgEscapers().get(i) != null && getUdgEscapers().get(i) != escaper) {
                        getUdgEscapers().get(i)?.setIsMaximaxou(b)
                    }
                    i = i + 1
                }
                if (b) {
                    Text.P(escaper.getPlayer(), 'all players have now admin rights')
                } else {
                    Text.P(escaper.getPlayer(), 'you are now the only one to have admin rights')
                }
                return true
            }
            if (isPlayerId(param1)) {
                let n = resolvePlayerId(param1)
                if (getUdgEscapers().get(n) != null) {
                    if (getUdgEscapers().get(n) != escaper) {
                        getUdgEscapers().get(n)?.setIsMaximaxou(b)
                        if (b) {
                            Text.P(escaper.getPlayer(), 'player ' + param1 + ' has now admin rights')
                        } else {
                            Text.P(escaper.getPlayer(), 'player ' + param1 + ' no longer has admin rights')
                        }
                    } else {
                        Text.erP(escaper.getPlayer(), "you can't change your own rights")
                    }
                } else {
                    Text.erP(escaper.getPlayer(), 'escaper ' + param1 + " doesn't exist")
                }
            } else {
                Text.erP(escaper.getPlayer(), 'param1 must be a player color or "all"')
            }
            return true
        },
    })

    //-mem
    registerCommand({
        name: 'mem',
        alias: [],
        group,
        argDescription: 'create | timer | all | (track <boolean>)',
        description: 'Shows memory usage',
        cb: ({ param1: debugObjects, param2 }) => {
            ;(_G as any)['printCreation'] = false
            memState.timer?.destroy()

            if (debugObjects === 'create' || debugObjects === 'all') {
                ;(_G as any)['printCreation'] = true
            }

            if (debugObjects === 'track' && IsBoolString(param2)) {
                ;(_G as any)['trackPrintMap'] = S2B(param2)
                print(`Mem: trackPrintMap ${S2B(param2) ? 'on' : 'off'}`)
                return true
            }

            if (debugObjects === 'timer' || debugObjects === 'all') {
                memState.timer = createTimer(1, true, MemoryHandler.printDebugInfo)
            }

            if (debugObjects === '') {
                MemoryHandler.printDebugInfo()
            } else {
                print(`Mem: ${debugObjects}`)
            }

            return true
        },
    })

    //-exec
    registerCommand({
        name: 'exec',
        alias: ['e'],
        group,
        argDescription: '<string>',
        description: 'Executes raw lua code',
        cb: ({ name }, escaper) => {
            const args = Natives.UGetEventPlayerChatString().substring(name.length + 2)

            const [func, err] = load(`return function() return ${args} end`)

            if (func) {
                const [ok, f] = pcall(func)

                if (ok) {
                    Text.P(escaper.getPlayer(), `Ran: '${args}'`)
                    const out = f()

                    if (out) {
                        Text.P(escaper.getPlayer(), `Out: '${out}'`)
                    }
                } else {
                    Text.erP(escaper.getPlayer(), `Execution error: ${f}`)
                }
            } else {
                if (typeof err === 'string') {
                    Text.erP(escaper.getPlayer(), err)
                } else {
                    Text.erP(escaper.getPlayer(), 'Syntax error')
                }
            }

            return true
        },
    })

    // // NOTE; WILL DESYNC

    // // DESYNCS
    // // showing units after hide = desync
    // // if u touch immolation of a unit that other player doesn't have = desync

    // //-hideUnits(hu)
    // registerCommand({
    //     name: 'hideUnits',
    //     alias: ['hu'],
    //     group,
    //     argDescription: 'on | off',
    //     description: 'Hides units in other levels',
    //     cb: ({ param1 }, escaper) => {
    //         if (param1.length === 0) param1 = 'true'

    //         if (IsBoolString(param1)) {
    //             for (const [_, esc] of pairs(getUdgEscapers().getAll())) {
    //                 if (getUdgLevels().getCurrentLevel(esc) !== getUdgLevels().getCurrentLevel(escaper)) {
    //                     if (GetLocalPlayer() === escaper.getPlayer()) {
    //                         ShowUnit(esc.getHero()!, !S2B(param1))
    //                         ShowUnit(esc.invisUnit!, !S2B(param1))
    //                     }
    //                 }
    //             }

    //             for (const [_, level] of pairs(getUdgLevels().getAll())) {
    //                 if (getUdgLevels().getCurrentLevel(escaper) !== level) {
    //                     for (const [_, monster] of pairs(level.monsters.getAll())) {
    //                         if (monster.u) {
    //                             const immoSkill = monster.getMonsterType()?.getImmolationSkill()

    //                             if (immoSkill) {
    //                                 // UnitRemoveAbility(monster.u, immoSkill)

    //                                 if (GetLocalPlayer() === escaper.getPlayer()) {
    //                                     ShowUnit(monster.u, !S2B(param1))

    //                                     if (S2B(param1)) {
    //                                         UnitAddAbility(monster.u, immoSkill)
    //                                     } else {
    //                                         UnitRemoveAbility(monster.u, immoSkill)
    //                                     }

    //                                     // UnitRemoveAbility(monster.u, FourCC('Aloc'))
    //                                     // UnitAddAbility(monster.u, FourCC('Aloc'))
    //                                 }
    //                             }
    //                         }
    //                     }
    //                 }
    //             }

    //             Text.mkP(escaper.getPlayer(), `Units ${!S2B(param1) ? 'shown' : 'hidden'}`)
    //         }

    //         return true
    //     },
    // })

    //-disableEffects
    registerCommand({
        name: 'disableEffects',
        alias: [],
        group,
        argDescription: 'on | off',
        description: 'Disables all effects',
        cb: ({ param1 }, escaper) => {
            if (param1.length === 0) param1 = EffectUtils.getDisplayEffects() ? 'on' : 'off'

            if (IsBoolString(param1)) {
                // GetLocalPlayer causes a desync here mixed with effects
                // if (GetLocalPlayer() === escaper.getPlayer()) {
                EffectUtils.setDisplayEffects(!S2B(param1))
                // }

                Text.mkP(escaper.getPlayer(), `Effects ${!S2B(param1) ? 'shown' : 'hidden'}`)
            }

            return true
        },
    })
}
