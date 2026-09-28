import { getUdgEscapers, getUdgLevels, globals } from '../../../../globals'
import { ServiceManager } from '../../../Services'
import { runInTrigger } from '../../../Utils/mapUtils'
import { pathingBlockerUtils } from '../../../Utils/PathingBlockerUtils'
import { progressionUtils } from '../../../Utils/ProgressionUtils'
import { SlideAfterDarkUtils } from '../../../Utils/SlideAfterDarkUtils'
import { IsBoolString, S2B } from '../../01_libraries/Basic_functions'
import { Constants } from '../../01_libraries/Constants'
import { IsInteger, IsPositiveInteger } from '../../01_libraries/Functions_on_numbers'
import { Text } from '../../01_libraries/Text'
import { getUdgViewAll } from '../../03_view_all_hide_all/View_all_hide_all'
import { GetMirrorEscaper } from '../../04_STRUCTURES/Escaper/Escaper_functions'
import { METEOR_CHEAT } from '../../04_STRUCTURES/Meteor/Meteor'
import { MeteorFunctions } from '../../04_STRUCTURES/Meteor/Meteor_functions'
import { Gravity } from '../../07_TRIGGERS/Slide_and_CheckTerrain_triggers/Gravity'
import { DeplacementHeroHorsDeathPath } from '../../08_GAME/Mode_coop/deplacement_heros_hors_death_path'
import {
    abilityCb,
    isPlayerId,
    resolvePlayerId,
    resolvePlayerIds,
    reviveCb,
    revivePositionCb,
    scaleCb,
    skinCb,
} from '../Helpers/Command_functions'
import { ActivateTeleport } from '../Helpers/Teleport'

export const initExecuteCommandCheat = () => {
    const { registerCommand } = ServiceManager.getService('Cmd')
    const group = 'cheat'

    //-slideSpeed(ss) <speed>   --> changes the slide speed of your hero, ignoring terrains
    registerCommand({
        name: 'setSlideSpeed',
        alias: ['ss'],
        group,
        argDescription: '<speed>',
        description: 'Changes the slide speed of your hero, ignoring terrains',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (!IsInteger(param1)) {
                return true
            }
            const speed = S2R(param1)
            if (nbParam === 1) {
                escaper.absoluteSlideSpeed(speed, true)
                Text.P(escaper.getPlayer(), 'your slide speed is set to ' + param1)
                return true
            }
            if (!(nbParam == 2 && escaper.isMaximaxou())) {
                return true
            }
            if (param2 === 'all' || param2 === 'a') {
                let i = 0
                while (true) {
                    if (i >= Constants.NB_ESCAPERS) break
                    if (getUdgEscapers().get(i) != null) {
                        getUdgEscapers().get(i)?.absoluteSlideSpeed(speed, true)
                    }
                    i = i + 1
                }
                Text.P(escaper.getPlayer(), 'slide speed for all is set to ' + param1)
                return true
            }
            if (isPlayerId(param2)) {
                if (getUdgEscapers().get(resolvePlayerId(param2)) != null) {
                    getUdgEscapers().get(resolvePlayerId(param2))?.absoluteSlideSpeed(speed, true)
                    Text.P(escaper.getPlayer(), 'slide speed for player ' + param2 + ' is set to ' + param1)
                }
            }
            return true
        },
    })

    //-normalSlideSpeed(nss)   --> puts the slide speed back to normal (respecting terrains)
    registerCommand({
        name: 'normalSlideSpeed',
        alias: ['nss'],
        group,
        argDescription: '',
        description: 'Puts the slide speed back to normal (respecting terrains)',
        cb: ({ noParam, nbParam, param1 }, escaper) => {
            if (noParam) {
                escaper.stopAbsoluteSlideSpeed(true)
                Text.P(escaper.getPlayer(), 'your slide speed depends now on terrains')
                return true
            }
            if (!(nbParam == 1 && escaper.isMaximaxou())) {
                return true
            }
            if (param1 === 'all' || param1 === 'a') {
                let i = 0
                while (true) {
                    if (i >= Constants.NB_ESCAPERS) break
                    if (getUdgEscapers().get(i) != null) {
                        getUdgEscapers().get(i)?.stopAbsoluteSlideSpeed(true)
                    }
                    i = i + 1
                }
                Text.P(escaper.getPlayer(), 'slide speed for all depends now on terrains')
                return true
            }
            if (isPlayerId(param1)) {
                if (getUdgEscapers().get(resolvePlayerId(param1)) != null) {
                    getUdgEscapers().get(resolvePlayerId(param1))?.stopAbsoluteSlideSpeed(true)
                    Text.P(escaper.getPlayer(), 'slide speed for player ' + param1 + ' depends now on terrains')
                }
            }
            return true
        },
    })

    //-rotationSpeed(rs) <speed>   --> changes the rotation speed of your hero, ignoring terrains
    registerCommand({
        name: 'rotationSpeed',
        alias: ['rs'],
        group,
        argDescription: '<roundsPerSecond>',
        description: 'Changes the rotation speed of your hero, ignoring terrains',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (S2R(param1) <= 0) {
                Text.erP(escaper.getPlayer(), 'The rotation speed has to be positive')
                return true
            }
            const speed = S2R(param1)
            if (nbParam === 1) {
                escaper.absoluteRotationSpeed(speed)
                Text.P(escaper.getPlayer(), 'your rotation speed is set to ' + param1)
                return true
            }
            if (!(nbParam == 2 && escaper.isMaximaxou())) {
                return true
            }
            if (param2 === 'all' || param2 === 'a') {
                let i = 0
                while (true) {
                    if (i >= Constants.NB_ESCAPERS) break
                    if (getUdgEscapers().get(i) != null) {
                        getUdgEscapers().get(i)?.absoluteRotationSpeed(speed)
                    }
                    i = i + 1
                }
                Text.P(escaper.getPlayer(), 'rotation speed for all is set to ' + param1)
                return true
            }
            if (isPlayerId(param2)) {
                if (getUdgEscapers().get(resolvePlayerId(param2)) != null) {
                    getUdgEscapers().get(resolvePlayerId(param2))?.absoluteRotationSpeed(speed)
                    Text.P(escaper.getPlayer(), 'rotation speed for player ' + param2 + ' is set to ' + param1)
                }
            }
            return true
        },
    })

    //-normalRotationSpeed(nrs)   --> puts the rotation speed back to normal (respecting terrains)
    registerCommand({
        name: 'normalRotationSpeed',
        alias: ['nrs'],
        group,
        argDescription: '',
        description: 'Puts the rotation speed back to normal (respecting terrains)',
        cb: ({ noParam, nbParam, param1 }, escaper) => {
            if (noParam) {
                escaper.stopAbsoluteRotationSpeed()
                Text.P(escaper.getPlayer(), 'your rotation speed depends now on terrains')
                return true
            }
            if (!(nbParam == 1 && escaper.isMaximaxou())) {
                return true
            }
            if (param1 === 'all' || param1 === 'a') {
                let i = 0
                while (true) {
                    if (i >= Constants.NB_ESCAPERS) break
                    if (getUdgEscapers().get(i) != null) {
                        getUdgEscapers().get(i)?.stopAbsoluteRotationSpeed()
                    }
                    i = i + 1
                }
                Text.P(escaper.getPlayer(), 'rotation speed for all depends now on terrains')
                return true
            }
            if (isPlayerId(param1)) {
                if (getUdgEscapers().get(resolvePlayerId(param1)) != null) {
                    getUdgEscapers().get(resolvePlayerId(param1))?.stopAbsoluteRotationSpeed()
                    Text.P(escaper.getPlayer(), 'rotation speed for player ' + param1 + ' depends now on terrains')
                }
            }
            return true
        },
    })

    //-walkSpeed(ws) <speed>   --> changes the walk speed of your hero, ignoring terrains
    registerCommand({
        name: 'setWalkSpeed',
        alias: ['ws'],
        group,
        argDescription: '<speed>',
        description: 'Changes the walk speed of your hero, ignoring terrains',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (!IsInteger(param1)) {
                return true
            }
            const speed = S2R(param1)
            if (nbParam === 1) {
                escaper.absoluteWalkSpeed(speed)
                Text.P(escaper.getPlayer(), 'walk speed to ' + param1)
                return true
            }
            if (!(nbParam == 2 && escaper.isMaximaxou())) {
                return true
            }
            if (param2 === 'all' || param2 === 'a') {
                let i = 0
                while (true) {
                    if (i >= Constants.NB_ESCAPERS) break
                    if (getUdgEscapers().get(i) != null) {
                        getUdgEscapers().get(i)?.absoluteWalkSpeed(speed)
                    }
                    i = i + 1
                }
                Text.P(escaper.getPlayer(), 'walk speed for all to ' + param1)
                return true
            }
            if (isPlayerId(param2)) {
                if (getUdgEscapers().get(resolvePlayerId(param2)) != null) {
                    getUdgEscapers().get(resolvePlayerId(param2))?.absoluteWalkSpeed(speed)
                    Text.P(escaper.getPlayer(), 'walk speed for player ' + param2 + ' to ' + param1)
                }
            }
            return true
        },
    })

    //-normalWalkSpeed(nws)   --> puts the walk speed back to normal (respecting terrains)
    registerCommand({
        name: 'normalWalkSpeed',
        alias: ['nws'],
        group,
        argDescription: '',
        description: 'Puts the walk speed back to normal (respecting terrains)',
        cb: ({ noParam, nbParam, param1 }, escaper) => {
            if (noParam) {
                escaper.stopAbsoluteWalkSpeed()
                Text.P(escaper.getPlayer(), 'walk speed depends now on terrains')
                return true
            }
            if (!(nbParam == 1 && escaper.isMaximaxou())) {
                return true
            }
            if (param1 === 'all' || param1 === 'a') {
                let i = 0
                while (true) {
                    if (i >= Constants.NB_ESCAPERS) break
                    if (getUdgEscapers().get(i) != null) {
                        getUdgEscapers().get(i)?.stopAbsoluteWalkSpeed()
                    }
                    i = i + 1
                }
                Text.P(escaper.getPlayer(), 'walk speed for all depends now on terrains')
                return true
            }
            if (isPlayerId(param1)) {
                if (getUdgEscapers().get(resolvePlayerId(param1)) != null) {
                    getUdgEscapers().get(resolvePlayerId(param1))?.stopAbsoluteWalkSpeed()
                    Text.P(escaper.getPlayer(), 'walk speed for player ' + param1 + ' depends now on terrains')
                }
            }
            return true
        },
    })

    //-teleport(t)   --> teleports your hero at the next clic
    registerCommand({
        name: 'teleport',
        alias: ['t'],
        group,
        argDescription: '',
        description: 'Teleports your hero at the next clic',
        enabled: ({ noParam, nbParam, param1 }) => {
            return noParam || (nbParam === 1 && (param1 === '0' || S2R(param1) !== 0))
        },
        cb: ({ nbParam, param1 }, escaper) => {
            const h1 = escaper.getHero()
            const h2 = GetMirrorEscaper(escaper)?.getHero()

            if (nbParam === 1) {
                h1 && SetUnitFacing(h1, S2R(param1))
                h2 && SetUnitFacing(h2, S2R(param1))
            }

            h1 && ActivateTeleport(h1, true)
            h2 && ActivateTeleport(h2, true)

            return true
        },
    })

    //-revive(r)   --> revives your hero
    registerCommand({
        name: 'revive',
        alias: ['r'],
        group,
        argDescription: '',
        description: 'Revives your hero',
        cb: ({ noParam, nbParam, param1 }, escaper) => {
            if (noParam) {
                reviveCb(escaper)
                return true
            }

            if (!(nbParam == 1 && escaper.isMaximaxou())) {
                return true
            }

            resolvePlayerIds(param1, reviveCb)
            return true
        },
    })

    //-revivePosition(rpos)   --> revives your hero
    registerCommand({
        name: 'revivePosition',
        alias: ['rpos'],
        group,
        argDescription: '',
        description: 'Revives your hero',
        cb: ({ noParam, nbParam, param1 }, escaper) => {
            if (noParam) {
                revivePositionCb(escaper)
                return true
            }

            if (!(nbParam == 1 && escaper.isMaximaxou())) {
                return true
            }

            resolvePlayerIds(param1, revivePositionCb)
            return true
        },
    })

    //-skin <skinId> [player]   --> Change your slider unit
    registerCommand({
        name: 'skin',
        alias: [],
        group,
        argDescription: '<skinId> [player]',
        description: 'Change your slider unit',
        cb: ({ param1, param2 }, escaper) => {
            if (param1.length === 0) {
                return true
            }

            if (param2.length === 0) {
                skinCb(escaper, param1)
                return true
            }

            if (!escaper.isMaximaxou()) {
                return true
            }

            resolvePlayerIds(param2, targetEscaper => skinCb(targetEscaper, param1))
            return true
        },
    })

    //-ability <abilityId> [player]   --> Add ability to your unit
    registerCommand({
        name: 'ability',
        alias: [],
        group,
        argDescription: '<abilityId> [player]',
        description: 'Add ability to your unit',
        cb: ({ param1, param2 }, escaper) => {
            if (param1.length === 0) {
                return true
            }

            if (param2.length === 0) {
                abilityCb(escaper, param1)
                return true
            }

            if (!escaper.isMaximaxou()) {
                return true
            }

            resolvePlayerIds(param2, targetEscaper => abilityCb(targetEscaper, param1))
            return true
        },
    })

    //-scale <scale> [player]   --> Change your slider unit
    registerCommand({
        name: 'scale',
        alias: [],
        group,
        argDescription: '<scale> [player]',
        description: 'Change your slider unit scale',
        cb: ({ param1, param2 }, escaper) => {
            if (param1.length === 0) {
                return true
            }

            if (param2.length === 0) {
                scaleCb(escaper, param1)
                return true
            }

            if (!escaper.isMaximaxou()) {
                return true
            }

            resolvePlayerIds(param2, targetEscaper => scaleCb(targetEscaper, param1))
            return true
        },
    })

    //-back
    registerCommand({
        name: 'back',
        alias: ['b'],
        group,
        argDescription: '',
        description: 'Teleports you to your previous location',
        cb: ({ noParam }, escaper) => {
            if (noParam) {
                const hero = escaper.getHero()

                if (escaper.lastPos && hero) {
                    escaper.moveHero(escaper.lastPos.x, escaper.lastPos.y)
                    DeplacementHeroHorsDeathPath.DeplacementHeroHorsDeathPath(hero)
                    escaper.coopReviveHero()
                }

                return true
            }

            return true
        },
    })

    //-reviveTo(rto) <Pcolor>   --> revives your hero to an other hero, with the same facing angle
    registerCommand({
        name: 'reviveTo',
        alias: ['rto', 'rposto'],
        group,
        argDescription: '<Pcolor>',
        description: 'Revives your hero to an other hero, with the same facing angle',
        cb: ({ nbParam, param1 }, escaper) => {
            if (!(nbParam === 1 && isPlayerId(param1))) {
                return true
            }

            const n = resolvePlayerId(param1)

            if (getUdgEscapers().get(n) == null) {
                return true
            }

            const targetEscaper = getUdgEscapers().get(n)
            const targetHero = targetEscaper?.getHero()
            const hero = escaper.getHero()

            if (!targetEscaper || !targetHero || !hero) {
                return true
            }

            // Where every machine agrees the target is: where its effect is seen while it slides async
            // differs from one machine to another.
            const x = targetEscaper.getSyncedHeroX()
            const y = targetEscaper.getSyncedHeroY()

            escaper.moveHero(x, y)
            escaper.turnInstantly(targetEscaper.getSyncedHeroFacing())
            escaper.coopReviveHero()

            const escaperSecond = GetMirrorEscaper(escaper)
            if (escaperSecond) {
                if (escaperSecond.isAlive()) {
                    escaperSecond.moveHero(x, y)
                } else {
                    escaperSecond.revive(x, y, 'coop')
                }
            }

            return true
        },
    })

    //-summon(smn) <Pcolor>   --> revives other hero to your hero, with the same facing angle
    registerCommand({
        name: 'summon',
        alias: ['smn'],
        group,
        argDescription: '<Pcolor>',
        description: 'Revives another hero to yours, with the same facing angle',
        cb: ({ nbParam, param1 }, escaper) => {
            if (!(nbParam === 1 && isPlayerId(param1))) {
                return true
            }

            const n = resolvePlayerId(param1)

            if (getUdgEscapers().get(n) == null) {
                return true
            }

            const targetEscaper = getUdgEscapers().get(n)
            const targetHero = targetEscaper?.getHero()
            const hero = escaper.getHero()

            if (!targetEscaper || !targetHero || !hero) {
                return true
            }

            const x = escaper.getHeroX()
            const y = escaper.getHeroY()

            targetEscaper.moveHero(x, y)
            targetEscaper.turnInstantly(escaper.getHeroFacing())
            runInTrigger(targetEscaper.coopReviveHero)

            const escaperSecond = GetMirrorEscaper(targetEscaper)
            if (escaperSecond) {
                if (escaperSecond.isAlive()) {
                    escaperSecond.moveHero(x, y)
                } else {
                    escaperSecond.revive(x, y, 'coop')
                }
            }

            return true
        },
    })

    //-getInfiniteMeteors(gim)   --> puts in your inventory a meteor that doesn't disapear after being used
    registerCommand({
        name: 'getInfiniteMeteors',
        alias: ['gim'],
        group,
        argDescription: '',
        description: "Puts in your inventory a meteor that doesn't disapear after being used",
        cb: ({ noParam }, escaper) => {
            if (noParam) {
                const hero = escaper.getHero()

                if (hero) {
                    if (UnitItemInSlot(hero, 0) == undefined) {
                        MeteorFunctions.HeroAddCheatMeteor(hero)
                        Text.P(escaper.getPlayer(), 'you get infinite meteors')
                    } else {
                        Text.erP(escaper.getPlayer(), 'inventory full')
                    }
                }
            }
            return true
        },
    })

    //-deleteInfiniteMeteors(dim)   --> remove the infinite meteor from your inventory if you have one
    registerCommand({
        name: 'deleteInfiniteMeteors',
        alias: ['dim'],
        group,
        argDescription: '',
        description: 'Remove the infinite meteor from your inventory if you have one',
        cb: ({ noParam }, escaper) => {
            if (noParam) {
                const hero = escaper.getHero()

                if (hero) {
                    const item = UnitItemInSlot(hero, 0)
                    if (item && GetItemTypeId(item) == METEOR_CHEAT) {
                        RemoveItem(item)
                        Text.P(escaper.getPlayer(), 'infinite meteors removed')
                    } else {
                        Text.erP(escaper.getPlayer(), 'no infinite meteors to remove')
                    }
                }
            }
            return true
        },
    })

    //-endLevel(el)   --> go to the end of the current level
    registerCommand({
        name: 'endLevel',
        alias: ['el'],
        group,
        argDescription: '',
        description: 'Go to the end of the current level',
        cb: ({ noParam }, escaper) => {
            if (noParam) {
                getUdgLevels().goToNextLevel(escaper)
            }
            return true
        },
    })

    //-goToLevel(gotl) <levelId>   --> first level is number 0
    registerCommand({
        name: 'goToLevel',
        alias: ['gotl'],
        group,
        argDescription: '<levelId>',
        description: 'Go to the specified level',
        cb: ({ nbParam, param1 }, escaper) => {
            if (nbParam !== 1) {
                return true
            }

            if (!IsPositiveInteger(param1)) {
                Text.erP(escaper.getPlayer(), 'level number should be a positive integer')
                return true
            }

            const n = S2I(param1)
            if (getUdgLevels().getCurrentLevel(escaper).getId() == n) {
                Text.erP(escaper.getPlayer(), 'you already are in this level')
                return true
            }

            if (!getUdgLevels().goToLevel(escaper, false, n)) {
                Text.erP(
                    escaper.getPlayer(),
                    "this levels doesn't exist (level max : " + I2S(getUdgLevels().getLastLevelId()) + ')'
                )
            }

            return true
        },
    })

    //-viewAll(va)   --> displays the whole map
    registerCommand({
        name: 'viewAll',
        alias: ['va'],
        group,
        argDescription: '',
        description: 'Displays the whole map',
        cb: ({ noParam }) => {
            if (noParam) {
                FogModifierStart(getUdgViewAll())
            }
            return true
        },
    })

    //-hideAll(ha)   --> puts the map view back to normal
    registerCommand({
        name: 'hideAll',
        alias: ['ha'],
        group,
        argDescription: '',
        description: 'Puts the map view back to normal',
        cb: ({ noParam }) => {
            if (noParam) {
                FogModifierStop(getUdgViewAll())
            }
            return true
        },
    })

    //-setGodMode(setgm) <boolean status>   --> activate or desactivate god mode for your hero
    registerCommand({
        name: 'setGodMode',
        alias: ['setgm'],
        group,
        argDescription: '<boolean status>',
        description: 'Activate or desactivate god mode for your hero',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (!(nbParam === 1 || nbParam === 2)) {
                Text.erP(escaper.getPlayer(), 'one or two params for this command')
                return true
            }

            let b = false

            if (IsBoolString(param1)) {
                b = S2B(param1)
            } else {
                Text.erP(escaper.getPlayer(), 'param1 must be a boolean')
                return true
            }
            if (nbParam === 1) {
                escaper.setGodMode(b)
                if (b) {
                    Text.P(escaper.getPlayer(), 'you are now invulnerable')
                } else {
                    Text.P(escaper.getPlayer(), 'you are now vulnerable')
                }
                return true
            }
            if (!escaper.isMaximaxou()) {
                Text.erP(escaper.getPlayer(), 'your rights are too weak')
                return true
            }
            if (param2 === 'all' || param2 === 'a') {
                let i = 0
                while (true) {
                    if (i >= Constants.NB_ESCAPERS) break
                    if (getUdgEscapers().get(i) != null) {
                        getUdgEscapers().get(i)?.setGodMode(b)
                    }
                    i = i + 1
                }
                if (b) {
                    Text.P(escaper.getPlayer(), 'all sliders are now invulnerable')
                } else {
                    Text.P(escaper.getPlayer(), 'all sliders are now vulnerable')
                }
                return true
            }
            if (isPlayerId(param2)) {
                let n = resolvePlayerId(param2)
                if (getUdgEscapers().get(n) != null) {
                    getUdgEscapers().get(n)?.setGodMode(b)
                    if (b) {
                        Text.P(escaper.getPlayer(), 'slider ' + param2 + ' is now invulnerable')
                    } else {
                        Text.P(escaper.getPlayer(), 'slider ' + param2 + ' is now vulnerable')
                    }
                } else {
                    Text.erP(escaper.getPlayer(), 'escaper ' + param2 + " doesn't exist")
                }
            } else {
                Text.erP(escaper.getPlayer(), 'param2 must be a player color or "all"')
            }
            return true
        },
    })

    //-setGodModeKills(setgmk) <boolean status>   --> if activated, monsters will be killed by your hero
    registerCommand({
        name: 'setGodModeKills',
        alias: ['setgmk'],
        group,
        argDescription: '<boolean status>',
        description: 'If activated, monsters will be killed by your hero',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (!(nbParam === 1 || nbParam === 2)) {
                Text.erP(escaper.getPlayer(), 'one or two params for this command')
                return true
            }

            let b = false

            if (IsBoolString(param1)) {
                b = S2B(param1)
            } else {
                Text.erP(escaper.getPlayer(), 'param1 must be a boolean')
                return true
            }
            if (nbParam === 1) {
                escaper.setGodModeKills(b)
                if (b) {
                    Text.P(escaper.getPlayer(), 'your god mode now kills monsters (if activated)')
                } else {
                    Text.P(escaper.getPlayer(), "you god mode doesn't kill monsters anymore")
                }
                return true
            }
            if (!escaper.isMaximaxou()) {
                Text.erP(escaper.getPlayer(), 'your rights are too weak')
                return true
            }
            if (param2 === 'all' || param2 === 'a') {
                let i = 0
                while (true) {
                    if (i >= Constants.NB_ESCAPERS) break
                    if (getUdgEscapers().get(i) != null) {
                        getUdgEscapers().get(i)?.setGodModeKills(b)
                    }
                    i = i + 1
                }
                if (b) {
                    Text.P(escaper.getPlayer(), 'god mode of all sliders now kills monsters (if activated)')
                } else {
                    Text.P(escaper.getPlayer(), "god mode of all sliders doesn't kill monsters anymore")
                }
                return true
            }
            if (isPlayerId(param2)) {
                let n = resolvePlayerId(param2)
                if (getUdgEscapers().get(n) != null) {
                    getUdgEscapers().get(n)?.setGodModeKills(b)
                    if (b) {
                        Text.P(
                            escaper.getPlayer(),
                            'god mode of slider ' + param2 + ' now kills monsters (if activated)'
                        )
                    } else {
                        Text.P(escaper.getPlayer(), 'god mode of slider ' + param2 + " doesn't kill monsters anymore")
                    }
                } else {
                    Text.erP(escaper.getPlayer(), 'escaper ' + param2 + " doesn't exist")
                }
            } else {
                Text.erP(escaper.getPlayer(), 'param2 must be a player color or "all"')
            }
            return true
        },
    })

    //-setGravity(setg) x
    registerCommand({
        name: 'setGravity',
        alias: ['setg'],
        group,
        argDescription: 'x',
        description: 'Set the gravity of the game',
        cb: ({ nbParam, param1 }, escaper) => {
            if (!(nbParam === 1) || (S2R(param1) === 0 && param1 !== '0')) {
                return true
            }
            Gravity.SetGravity(S2R(param1))
            Text.P(escaper.getPlayer(), 'gravity changed')
            return true
        },
    })

    //-getGravity(getg)
    registerCommand({
        name: 'getGravity',
        alias: ['getg'],
        group,
        argDescription: '',
        description: 'Get the gravity of the game',
        cb: ({ noParam }, escaper) => {
            if (noParam) {
                Text.P(escaper.getPlayer(), 'current gravity is ' + R2S(Gravity.GetRealGravity()))
            }
            return true
        },
    })

    //-setVTOTODiagonalSlideLogic <boolean status>
    registerCommand({
        name: 'setVTOTODiagonalSlideLogic',
        alias: ['setvtoto'],
        group,
        argDescription: '<boolean status>',
        description: 'Allows you to slide diagonally',
        cb: ({ nbParam, param1 }, escaper) => {
            if (!(nbParam === 1)) {
                Text.erP(escaper.getPlayer(), 'one param for this command')
                return true
            }

            if (!IsBoolString(param1)) {
                Text.erP(escaper.getPlayer(), 'invalid boolean')
                return true
            }

            globals.USE_VTOTO_SLIDE_LOGIC = S2B(param1)
            Text.A((S2B(param1) ? 'Enabled' : 'Disabled') + ' vToto diagonal slide logic')
            return true
        },
    })

    //-getVTOTODiagonalSlideLogic(getvtoto)
    registerCommand({
        name: 'getVTOTODiagonalSlideLogic',
        alias: ['getvtoto'],
        group,
        argDescription: '',
        description: '',
        cb: ({ noParam }, escaper) => {
            if (noParam) {
                Text.P(escaper.getPlayer(), 'vToto is ' + (globals.USE_VTOTO_SLIDE_LOGIC ? 'enabled' : 'disabled'))
            }
            return true
        },
    })

    //-setCoopCircles <boolean status>
    registerCommand({
        name: 'setCoopCircles',
        alias: [],
        group,
        argDescription: '<boolean status>',
        description: 'Disables coop circles',
        cb: ({ nbParam, param1 }, escaper) => {
            if (!(nbParam === 1)) {
                Text.erP(escaper.getPlayer(), 'one param for this command')
                return true
            }

            if (!IsBoolString(param1)) {
                Text.erP(escaper.getPlayer(), 'invalid boolean')
                return true
            }

            globals.coopCircles = S2B(param1)
            Text.A((S2B(param1) ? 'Enabled' : 'Disabled') + ' coopCircles')
            return true
        },
    })

    //-getCoopCircles
    registerCommand({
        name: 'getCoopCircles',
        alias: [],
        group,
        argDescription: '',
        description: '',
        cb: ({ noParam }, escaper) => {
            if (noParam) {
                Text.P(escaper.getPlayer(), 'Coop circles are ' + (globals.coopCircles ? 'enabled' : 'disabled'))
            }
            return true
        },
    })

    //-setCanTurnInAir <boolean status>
    registerCommand({
        name: 'setCanTurnInAir',
        alias: [],
        group,
        argDescription: '<boolean status>',
        description: 'Allows you to turn in air',
        cb: ({ nbParam, param1 }, escaper) => {
            if (!(nbParam === 1)) {
                Text.erP(escaper.getPlayer(), 'one param for this command')
                return true
            }

            if (!IsBoolString(param1)) {
                Text.erP(escaper.getPlayer(), 'invalid boolean')
                return true
            }

            globals.CAN_TURN_IN_AIR = S2B(param1)
            Text.A((S2B(param1) ? 'Enabled' : 'Disabled') + ' canTurnInAir')
            return true
        },
    })

    //-getCanTurnInAir
    registerCommand({
        name: 'getCanTurnInAir',
        alias: [],
        group,
        argDescription: '',
        description: '',
        cb: ({ noParam }, escaper) => {
            if (noParam) {
                Text.P(escaper.getPlayer(), 'Can turn in air is ' + (globals.CAN_TURN_IN_AIR ? 'enabled' : 'disabled'))
            }
            return true
        },
    })

    //-setCanSlideOverPathingBlockers <boolean status>
    registerCommand({
        name: 'setCanSlideOverPathingBlockers',
        alias: [],
        group,
        argDescription: '<boolean status>',
        description: '',
        cb: ({ nbParam, param1 }, escaper) => {
            if (!(nbParam === 1)) {
                Text.erP(escaper.getPlayer(), 'one param for this command')
                return true
            }

            if (!IsBoolString(param1)) {
                Text.erP(escaper.getPlayer(), 'invalid boolean')
                return true
            }

            globals.canSlideOverPathingBlockers = S2B(param1)
            pathingBlockerUtils.init()
            progressionUtils.init()

            Text.A((S2B(param1) ? 'Enabled' : 'Disabled') + ' canSlideOverPathingBlockers')
            return true
        },
    })

    //-getCanSlideOverPathingBlockers
    registerCommand({
        name: 'getCanSlideOverPathingBlockers',
        alias: [],
        group,
        argDescription: '',
        description: '',
        cb: ({ noParam }, escaper) => {
            if (noParam) {
                Text.P(
                    escaper.getPlayer(),
                    'Can slide over pathing blockers is ' +
                        (globals.canSlideOverPathingBlockers ? 'enabled' : 'disabled')
                )
            }
            return true
        },
    })

    //-setAnimOnRevive <anim>
    registerCommand({
        name: 'setAnimOnRevive',
        alias: [],
        group,
        argDescription: '<anim>',
        description: '',
        cb: ({ nbParam, param1 }, escaper) => {
            if (!(nbParam === 1)) {
                Text.erP(escaper.getPlayer(), 'one param for this command')
                return true
            }

            globals.animOnRevive = param1
            Text.A('Set anim on revive to ' + param1)
            return true
        },
    })

    //-getAnimOnRevive
    registerCommand({
        name: 'getAnimOnRevive',
        alias: [],
        group,
        argDescription: '',
        description: '',
        cb: ({ noParam }, escaper) => {
            if (noParam) {
                Text.P(escaper.getPlayer(), 'Anim on revive is: ' + globals.animOnRevive)
            }
            return true
        },
    })

    //-setWanderTimes <min> <extra>
    registerCommand({
        name: 'setWanderTimes',
        alias: [],
        group,
        argDescription: '<min> <extra>',
        description: '',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (!(nbParam === 2)) {
                Text.erP(escaper.getPlayer(), 'two params for this command')
                return true
            }

            if (!IsInteger(param1) || !IsInteger(param2)) {
                Text.erP(escaper.getPlayer(), 'invalid integer')
                return true
            }

            if (S2I(param1) < 1 || S2I(param2) < 0) {
                Text.erP(escaper.getPlayer(), 'values must be bigger than 1')
                return true
            }

            globals.wanderMinTime = S2I(param1)
            globals.wanderExtraTime = S2I(param2)
            Text.A('Set wander times to ' + param1 + ' and ' + param2)
            return true
        },
    })

    //-getWanderTimes
    registerCommand({
        name: 'getWanderTimes',
        alias: [],
        group,
        argDescription: '',
        description: '',
        cb: ({ noParam }, escaper) => {
            if (noParam) {
                Text.P(
                    escaper.getPlayer(),
                    'Wander times are ' +
                        globals.wanderMinTime +
                        ' + a random value between 0 and ' +
                        globals.wanderExtraTime +
                        ' seconds'
                )
            }
            return true
        },
    })

    //-setHeight(seth)
    registerCommand({
        name: 'setHeight',
        alias: ['seth'],
        group,
        argDescription: '',
        description: 'Set the height of the game',
        cb: ({ nbParam, param1 }, escaper) => {
            if (nbParam !== 1 || (S2R(param1) <= 0 && param1 !== '0')) {
                return true
            }

            const h1 = escaper.getHero()
            const h2 = GetMirrorEscaper(escaper)?.getHero()

            h1 && SetUnitFlyHeight(h1, S2R(param1), 0)
            h2 && SetUnitFlyHeight(h2, S2R(param1), 0)

            return true
        },
    })

    //-setTailleUnit(settu)
    registerCommand({
        name: 'setTailleUnit',
        alias: ['settu'],
        group,
        argDescription: '',
        description: 'Set the size of the units',
        cb: ({ nbParam, param1 }) => {
            if (nbParam !== 1 || (S2R(param1) <= 0 && param1 !== '0')) {
                return true
            }
            ServiceManager.getService('InvisUnit_is_getting_damage').Trig_InvisUnit_is_getting_damage.setTailleUnite(
                S2R(param1)
            )
            return true
        },
    })

    //-instantTurn
    registerCommand({
        name: 'instantTurn',
        alias: ['it'],
        group,
        argDescription: '',
        description: 'Instant turn',
        cb: ({ nbParam, param1 }, escaper) => {
            if (nbParam === 1 && IsBoolString(param1)) {
                if (escaper.isAbsoluteInstantTurn() != S2B(param1)) {
                    escaper.setAbsoluteInstantTurn(S2B(param1))
                    if (S2B(param1)) {
                        Text.P(escaper.getPlayer(), 'instant turn on')
                    } else {
                        Text.P(escaper.getPlayer(), 'instant turn off')
                    }
                }
            }
            return true
        },
    })

    //-slideAfterDark   --> randomly changes monster skins every 1-10 seconds
    registerCommand({
        name: 'slideAfterDark',
        alias: [],
        group,
        argDescription: '[on|off]',
        description: 'Randomly changes monster skins every 1-10 seconds',
        cb: ({ noParam, nbParam, param1 }, escaper) => {
            if (noParam) {
                if (SlideAfterDarkUtils.isActive()) {
                    SlideAfterDarkUtils.deactivate()
                    Text.P(escaper.getPlayer(), 'slideAfterDark deactivated')
                } else {
                    SlideAfterDarkUtils.activate()
                    Text.P(escaper.getPlayer(), 'slideAfterDark activated')
                }
                return true
            }

            if (nbParam === 1) {
                if (IsBoolString(param1)) {
                    if (S2B(param1)) {
                        SlideAfterDarkUtils.activate()
                        Text.P(escaper.getPlayer(), 'slideAfterDark activated')
                    } else {
                        SlideAfterDarkUtils.deactivate()
                        Text.P(escaper.getPlayer(), 'slideAfterDark deactivated')
                    }
                } else {
                    Text.erP(escaper.getPlayer(), 'param must be a boolean (on/off, true/false, 1/0)')
                }
                return true
            }

            return true
        },
    })
}
