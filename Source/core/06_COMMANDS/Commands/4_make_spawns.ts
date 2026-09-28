import { getUdgMonsterTypes } from '../../../../globals'
import { ServiceManager } from '../../../Services'
import { IsBoolString, S2B } from '../../01_libraries/Basic_functions'
import { Text } from '../../01_libraries/Text'
import { MonsterDirectionMode } from '../../04_STRUCTURES/MonsterSpawn/MonsterSpawn'
import { MakeMECRegionMode } from '../../05_MAKE_STRUCTURES/Make_create_region/MakeMECRegion'
import { MakeMonsterSpawnKind } from '../../05_MAKE_STRUCTURES/Make_monster_spawn/MakeMonsterSpawn'
import { USAGE } from '../Helpers/Command_functions'

export const initExecuteCommandMake_spawns = () => {
    const { registerCommand } = ServiceManager.getService('Cmd')
    const group = 'make'

    //-createMonsterSpawn(crmsp) <monsterSpawnLabel> <monsterLabel> <direction> [<frequency>]   --> default frequency is 2, minimum is 0.1, maximum is 30
    registerCommand({
        name: 'createMonsterSpawn',
        alias: ['crmsp'],
        group,
        argDescription: '<monsterSpawnLabel> <monsterLabel> <kind> [<frequency>] [straight|random]',
        description:
            'Kind must be "up", "down", "left", "right", "line", "rect", "parallelogram" or "trapeze". Default frequency is 2, minimum is 0.1, maximum is 30',
        cb: ({ nbParam, param1, param2, param3, param4, param5 }, escaper) => {
            if (!(nbParam >= 3 && nbParam <= 5)) {
                return USAGE
            }
            if (escaper.getMakingLevel().monsterSpawns.getByLabel(param1)) {
                Text.erP(
                    escaper.getPlayer(),
                    'a monster spawn with label "' + param1 + '" already exists for this level'
                )
                return true
            }

            const monsterType = getUdgMonsterTypes().getByLabel(param2)
            if (!monsterType) {
                Text.erP(escaper.getPlayer(), 'unknown monster type "' + param2 + '"')
                return true
            }

            let kind: MakeMonsterSpawnKind = 'up'
            if (!['up', 'down', 'left', 'right', 'line', 'rect', 'parallelogram', 'trapeze'].includes(param3)) {
                Text.erP(escaper.getPlayer(), 'createMonsterSpawn: wrong kind')
                return true
            } else {
                kind = param3 as MakeMonsterSpawnKind
            }

            let frequency = 2
            if (nbParam >= 4) {
                frequency = S2R(param4)
                if (frequency < 0.1 || frequency > 30) {
                    Text.erP(escaper.getPlayer(), 'frequency must be a real between 0.1 and 30')
                    return true
                }
            }

            let monsterDirectionMode: MonsterDirectionMode = 'straight'
            if (nbParam >= 5) {
                if (param5 !== 'straight' && param5 !== 'random') {
                    Text.erP(escaper.getPlayer(), 'param 5 should be : straight or random')
                    return true
                }
                monsterDirectionMode = param5
            }

            const make = escaper.makeCreateMonsterSpawn(param1, monsterType, kind, frequency, monsterDirectionMode)

            if (make) {
                Text.mkP(escaper.getPlayer(), make.getMakingMessage())
            } else {
                Text.erP(escaper.getPlayer(), 'failed to initiate the creation of the monster spawn')
            }

            return true
        },
    })

    //-setMonsterSpawnLabel(setmsl) <oldMonsterSpawnLabel> <newMonsterSpawnLabel>
    registerCommand({
        name: 'setMonsterSpawnLabel',
        alias: ['setmsl'],
        group,
        argDescription: '<oldMonsterSpawnLabel> <newMonsterSpawnLabel>',
        description: 'Change the label of an existing monster spawn',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (!(nbParam === 2)) {
                return true
            }
            if (escaper.getMakingLevel().monsterSpawns.changeLabel(param1, param2)) {
                Text.mkP(escaper.getPlayer(), 'label changed')
            } else {
                Text.erP(escaper.getPlayer(), "couldn't change label")
            }
            return true
        },
    })

    //-setMonsterSpawnMonster(setmsm) <monsterSpawnLabel> <monsterLabel>
    registerCommand({
        name: 'setMonsterSpawnMonster',
        alias: ['setmsm'],
        group,
        argDescription: '<monsterSpawnLabel> <monsterLabel>',
        description: 'Change which monster type a monster spawn will create',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (!(nbParam === 2)) {
                return true
            }

            const monsterSpawn = escaper.getMakingLevel().monsterSpawns.getByLabel(param1)
            if (!monsterSpawn) {
                Text.erP(escaper.getPlayer(), 'unknown monster spawn "' + param1 + '" in this level')
                return true
            }

            const monsterType = getUdgMonsterTypes().getByLabel(param2)
            if (!monsterType) {
                Text.erP(escaper.getPlayer(), 'unknown monster type "' + param2 + '"')
                return true
            }

            monsterSpawn.setMonsterType(monsterType)
            Text.mkP(escaper.getPlayer(), 'monster type changed')
            return true
        },
    })

    // -setMonsterSpawnZone(setmsz) <monsterSpawnLabel> <kind>
    registerCommand({
        name: 'setMonsterSpawnZone',
        alias: ['setmsz'],
        group,
        argDescription: '<monsterSpawnLabel> <kind>',
        description: 'Kind must be "up", "down", "left", "right", "line", "rect", "parallelogram" or "trapeze".',
        cb: ({ param1, param2, nbParam }, escaper) => {
            if (nbParam !== 2) {
                return USAGE
            }

            const monsterSpawn = escaper.getMakingLevel().monsterSpawns.getByLabel(param1)
            if (!monsterSpawn) {
                Text.erP(
                    escaper.getPlayer(),
                    'setMonsterSpawnZone: unknown monster spawn "' + param1 + '" in this level'
                )
                return true
            }

            let kind: MakeMonsterSpawnKind = 'up'
            if (!['up', 'down', 'left', 'right', 'line', 'rect', 'parallelogram', 'trapeze'].includes(param2)) {
                Text.erP(escaper.getPlayer(), 'setMonsterSpawnZone: wrong kind')
                return true
            } else {
                kind = param2 as MakeMonsterSpawnKind
            }

            const make = escaper.makeSetMonsterSpawnZone(monsterSpawn, kind)

            if (make) {
                Text.mkP(escaper.getPlayer(), make.getMakingMessage())
            } else {
                Text.erP(escaper.getPlayer(), 'failed to initiate the creation of the monster spawn')
            }

            return true
        },
    })

    //-setMonsterSpawnFrequency(setmsf) <monsterSpawnLabel> <frequency>   --> maximum 20 mobs per second
    registerCommand({
        name: 'setMonsterSpawnFrequency',
        alias: ['setmsf'],
        group,
        argDescription: '<monsterSpawnLabel> <frequency>',
        description: 'Set how often monsters spawn (frequency between 0.1 and 30)',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (!(nbParam === 2)) {
                return true
            }

            const monsterSpawn = escaper.getMakingLevel().monsterSpawns.getByLabel(param1)
            if (!monsterSpawn) {
                Text.erP(escaper.getPlayer(), 'unknown monster spawn "' + param1 + '" in this level')
                return true
            }
            const x = S2R(param2)
            if (x < 0.1 || x > 30) {
                Text.erP(escaper.getPlayer(), 'frequency must be a real between 0.1 and 30')
                return true
            }

            monsterSpawn.setFrequence(x)
            Text.mkP(escaper.getPlayer(), 'frequency changed')
            return true
        },
    })

    //-setMonsterSpawnAmount(setmsa) <label> <amount>
    registerCommand({
        name: 'setMonsterSpawnAmount',
        alias: ['setmsa'],
        group,
        argDescription: '<label> <amount>',
        description: 'Set how many monsters spawn simultaneously per spawn cycle (1-500)',
        cb: ({ param1, param2 }, escaper) => {
            const monsterSpawn = escaper.getMakingLevel().monsterSpawns.getByLabel(param1)

            if (!monsterSpawn) {
                Text.erP(escaper.getPlayer(), 'unknown monster spawn "' + param1 + '" in this level')
                return true
            }

            if (!(S2I(param2) > 0 && S2I(param2) <= 500)) {
                Text.erP(escaper.getPlayer(), 'Amount must be > 0 and <= 500')
                return true
            }

            monsterSpawn.setSpawnAmount(S2I(param2))
            Text.mkP(escaper.getPlayer(), 'spawnAmount changed')
            return true
        },
    })

    //-setMonsterSpawnOffset(setmso) <label> <offset>
    registerCommand({
        name: 'setMonsterSpawnOffset',
        alias: ['setmso'],
        group,
        argDescription: '<label> <offset>',
        description: 'Distance between each individual monster when spawnAmount > 1 (0-16384, 0 disables)',
        cb: ({ param1, param2 }, escaper) => {
            const monsterSpawn = escaper.getMakingLevel().monsterSpawns.getByLabel(param1)

            if (!monsterSpawn) {
                Text.erP(escaper.getPlayer(), 'unknown monster spawn "' + param1 + '" in this level')
                return true
            }

            if (S2I(param2) !== 0 && !(S2I(param2) > 0 && S2I(param2) <= 16384)) {
                Text.erP(escaper.getPlayer(), 'Offset must be > 0 and <= 16384')
                return true
            }

            monsterSpawn.setSpawnOffset(S2I(param2))
            Text.mkP(escaper.getPlayer(), 'spawnOffset changed')
            return true
        },
    })

    //-setMonsterSpawnFixedSpawnOffset(setmsfso) <label> <offset>
    registerCommand({
        name: 'setMonsterSpawnFixedSpawnOffset',
        alias: ['setmsfso'],
        group,
        argDescription: '<label> <offset>',
        description:
            'Distance between each spawn (0-16384, 0 disables), or "auto" to distribute mosnters evenly in the spawn zone (useful with spawnAmount > 1).',
        cb: ({ param1, param2, nbParam }, escaper) => {
            if (nbParam !== 2) {
                return USAGE
            }

            const monsterSpawn = escaper.getMakingLevel().monsterSpawns.getByLabel(param1)
            if (!monsterSpawn) {
                Text.erP(escaper.getPlayer(), 'unknown monster spawn "' + param1 + '" in this level')
                return true
            }

            if (param2 !== 'auto' && S2I(param2) !== 0 && !(S2I(param2) > 0 && S2I(param2) <= 16384)) {
                Text.erP(escaper.getPlayer(), 'Offset must be > 0 and <= 16384, or "auto"')
                return true
            }

            monsterSpawn.setFixedSpawnOffset(param2 === 'auto' ? param2 : S2I(param2) === 0 ? undefined : S2I(param2))
            Text.mkP(escaper.getPlayer(), 'fixedSpawnOffset changed')
            return true
        },
    })

    //-setMonsterSpawnFixedSpawnOffsetBounce(setmsfsob) <label> <bounce>
    registerCommand({
        name: 'setMonsterSpawnFixedSpawnOffsetBounce',
        alias: ['setmsfsob'],
        group,
        argDescription: '<label> <bounce>',
        description: 'Toggle whether fixed spawn offset bounces back and forth (requires fixedSpawnOffset enabled)',
        cb: ({ param1, param2 }, escaper) => {
            const monsterSpawn = escaper.getMakingLevel().monsterSpawns.getByLabel(param1)

            if (!monsterSpawn) {
                Text.erP(escaper.getPlayer(), 'unknown monster spawn "' + param1 + '" in this level')
                return true
            }

            if (!monsterSpawn.getFixedSpawnOffset()) {
                Text.erP(escaper.getPlayer(), 'fixedSpawnOffset has to be enabled for this to work')
                return true
            }

            if (!IsBoolString(param2)) {
                Text.erP(escaper.getPlayer(), 'Bounce must be a boolean')
                return true
            }

            monsterSpawn.setFixedSpawnOffsetBounce(S2B(param2))
            Text.mkP(escaper.getPlayer(), 'fixedSpawnOffsetBounce changed')
            return true
        },
    })

    //-setMonsterSpawnFixedSpawnOffsetMirrored(setmsfsom) <label> <mirrored>
    registerCommand({
        name: 'setMonsterSpawnFixedSpawnOffsetMirrored',
        alias: ['setmsfsom'],
        group,
        argDescription: '<label> <mirrored>',
        description: 'Toggle whether fixed spawn offset mirrors on opposite side (requires fixedSpawnOffset enabled)',
        cb: ({ param1, param2 }, escaper) => {
            const monsterSpawn = escaper.getMakingLevel().monsterSpawns.getByLabel(param1)

            if (!monsterSpawn) {
                Text.erP(escaper.getPlayer(), 'unknown monster spawn "' + param1 + '" in this level')
                return true
            }

            if (!monsterSpawn.getFixedSpawnOffset()) {
                Text.erP(escaper.getPlayer(), 'fixedSpawnOffset has to be enabled for this to work')
                return true
            }

            if (!IsBoolString(param2)) {
                Text.erP(escaper.getPlayer(), 'Bounce must be a boolean')
                return true
            }

            monsterSpawn.setFixedSpawnOffsetMirrored(S2B(param2))
            Text.mkP(escaper.getPlayer(), 'fixedSpawnOffsetMirrored changed')
            return true
        },
    })

    //-setMonsterSpawnInitialDelay(setmsid) <label> <delay>
    registerCommand({
        name: 'setMonsterSpawnInitialDelay',
        alias: ['setmsid'],
        group,
        argDescription: '<label> <delay>',
        description: 'Set delay in seconds before monster spawn starts spawning (1-10)',
        cb: ({ param1, param2 }, escaper) => {
            const monsterSpawn = escaper.getMakingLevel().monsterSpawns.getByLabel(param1)

            if (!monsterSpawn) {
                Text.erP(escaper.getPlayer(), 'unknown monster spawn "' + param1 + '" in this level')
                return true
            }

            if (!(S2I(param2) > 0 && S2I(param2) <= 10)) {
                Text.erP(escaper.getPlayer(), 'Delay must be > 0 and <= 10')
                return true
            }

            monsterSpawn.setInitialDelay(S2I(param2))
            Text.mkP(escaper.getPlayer(), 'Delay changed')
            return true
        },
    })

    //-setMonsterSpawnTimedUnspawn(setmstu) <label> <time>
    registerCommand({
        name: 'setMonsterSpawnTimedUnspawn',
        alias: ['setmstu'],
        group,
        argDescription: '<label> <time>',
        description:
            'Set time in seconds after which spawned monsters will automatically despawn (0 to disable). If enabled, replace the automatic despawn when monster leaves the spawn zone.',
        cb: ({ param1, param2 }, escaper) => {
            const monsterSpawn = escaper.getMakingLevel().monsterSpawns.getByLabel(param1)

            if (!monsterSpawn) {
                Text.erP(escaper.getPlayer(), 'unknown monster spawn "' + param1 + '" in this level')
                return true
            }

            const time = S2R(param2)
            if (time < 0) {
                Text.erP(escaper.getPlayer(), 'Time must be >= 0')
                return true
            }

            monsterSpawn.setTimedUnspawn(time === 0 ? undefined : time)
            Text.mkP(
                escaper.getPlayer(),
                time === 0 ? 'Timed unspawn disabled' : 'Timed unspawn set to ' + R2S(time) + ' seconds'
            )
            return true
        },
    })

    //-setMonsterSpawnMonsterDirectionMode(setmsmdm) <label> straight|random
    registerCommand({
        name: 'setMonsterSpawnMonsterDirectionMode',
        alias: ['setmsmdm'],
        group,
        argDescription: '<label> straight|random',
        description:
            "Set the monster direction mode for spawned monsters (straight or random) => doesn't work for line zones",
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (nbParam !== 2) {
                return USAGE
            }

            const monsterSpawn = escaper.getMakingLevel().monsterSpawns.getByLabel(param1)
            if (!monsterSpawn) {
                Text.erP(escaper.getPlayer(), 'unknown monster spawn "' + param1 + '" in this level')
                return true
            }

            if (param2 !== 'straight' && param2 !== 'random') {
                Text.erP(escaper.getPlayer(), 'param 2 should be : straight or random')
                return true
            }

            monsterSpawn.setMonsterDirectionMode(param2)

            Text.mkP(escaper.getPlayer(), `Spawn monster direction mode set to: ${param2}`)
            return true
        },
    })

    //-createMonsterSpawnDeadZone(crmsdz) <monsterSpawnLabel> <deadZoneShape>
    registerCommand({
        name: 'createMonsterSpawnDeadZone',
        alias: ['crmsdz'],
        group,
        argDescription: '<monsterSpawnLabel> [<deadZoneShape>]',
        description:
            'Add one or several dead zones to a monster spawn (spawned monsters will be hidden in that zone and non lethal). deadZoneShape can be "horizRect", "rect", "circle" or "line". Default is "horizRect". Stop creating dead zones with -stop.',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (nbParam < 1 || nbParam > 2) {
                return USAGE
            }

            const monsterSpawn = escaper.getMakingLevel().monsterSpawns.getByLabel(param1)
            if (!monsterSpawn) {
                Text.erP(escaper.getPlayer(), 'unknown monster spawn "' + param1 + '" in this level')
                return true
            }

            let makeMecRegionMode: MakeMECRegionMode = 'horizRect'
            if (nbParam === 2) {
                if (!['horizRect', 'rect', 'parallelogram', 'trapeze', 'circle', 'line'].includes(param2)) {
                    return USAGE
                }
                makeMecRegionMode = param2 as MakeMECRegionMode
            }

            const make = escaper.makeMonsterSpawnHideRegion(monsterSpawn, makeMecRegionMode)

            if (make) {
                Text.mkP(escaper.getPlayer(), make.getMakingMessage())
            } else {
                Text.erP(escaper.getPlayer(), 'failed to initiate the creation of the monster spawn dead zone')
            }

            return true
        },
    })

    //-deleteMonsterSpawnDeadZones  (delmsdz) <monsterSpawnLabel>
    registerCommand({
        name: 'deleteMonsterSpawnDeadZones',
        alias: ['delmsdz'],
        group,
        argDescription: '<monsterSpawnLabel> [clicks|all]',
        description:
            'Remove dead zones of a monster spawn. With "clicks", remove them one by one with clicks (priority on region with the lowest area). With "all" or no argument, remove them all at once (defaults to "clicks").',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (nbParam < 1 || nbParam > 2) {
                return USAGE
            }

            const monsterSpawn = escaper.getMakingLevel().monsterSpawns.getByLabel(param1)
            if (!monsterSpawn) {
                Text.erP(escaper.getPlayer(), 'unknown monster spawn "' + param1 + '" in this level')
                return true
            }

            let mode: 'clicks' | 'all' = 'clicks'
            if (nbParam === 2) {
                if (!['clicks', 'all'].includes(param2)) {
                    return USAGE
                }
                mode = param2 as 'clicks' | 'all'
            }

            if (mode === 'all') {
                monsterSpawn.removeAllHideRegions()
                Text.mkP(escaper.getPlayer(), `Removed all dead zones for monster spawn "${monsterSpawn.getLabel()}"`)
            } else {
                escaper.makeMonsterSpawnRemoveHideRegion(monsterSpawn)
                Text.mkP(escaper.getPlayer(), `Click on dead zones to remove (end with -stop)`)
            }

            return true
        },
    })

    //-displayMonsterSpawns(dms) [<monsterSpawnLabel>] [page]
    registerCommand({
        name: 'displayMonsterSpawns',
        alias: ['dms'],
        group,
        argDescription: '[<monsterSpawnLabel>] [page]',
        description: 'Displays the monster spawns for this level',
        cb: ({ cmd }, escaper) => {
            escaper.getMakingLevel().monsterSpawns.displayPaginatedForPlayer(escaper.getPlayer(), cmd)
            return true
        },
    })

    //-displayMonsterSpawnsDetailled(dmsd) [<monsterSpawnLabel>] [page]
    registerCommand({
        name: 'displayMonsterSpawnsDetailled',
        alias: ['dmsd'],
        group,
        argDescription: '[<monsterSpawnLabel>] [page]',
        description: 'Displays the monster spawns for this level',
        cb: ({ cmd }, escaper) => {
            escaper.getMakingLevel().monsterSpawns.displayPaginatedForPlayer(escaper.getPlayer(), cmd, true)
            return true
        },
    })

    //-deleteMonsterSpawn(delms) <monsterSpawnLabel>
    registerCommand({
        name: 'deleteMonsterSpawn',
        alias: ['delms'],
        group,
        argDescription: '<monsterSpawnLabel>',
        description: '',
        cb: ({ nbParam, param1 }, escaper) => {
            if (!(nbParam === 1)) {
                return true
            }
            if (escaper.getMakingLevel().monsterSpawns.clearMonsterSpawn(param1)) {
                Text.mkP(escaper.getPlayer(), 'monster spawn deleted')
            } else {
                Text.erP(escaper.getPlayer(), 'unknown monster spawn for this level')
            }
            return true
        },
    })
}
