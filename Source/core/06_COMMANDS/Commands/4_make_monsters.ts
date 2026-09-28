import { getUdgCasterTypes, getUdgMonsterTypes, getUdgTerrainTypes } from '../../../../globals'
import { ServiceManager } from '../../../Services'
import { String2Ascii } from '../../01_libraries/Ascii'
import { convertTextToAngle, IsBoolString, S2B } from '../../01_libraries/Basic_functions'
import { Constants } from '../../01_libraries/Constants'
import { IsPositiveInteger } from '../../01_libraries/Functions_on_numbers'
import { Text } from '../../01_libraries/Text'
import {
    DEFAULT_CASTER_ANIMATION,
    DEFAULT_CASTER_LOAD_TIME,
    DEFAULT_CASTER_PROJECTILE_SPEED,
    DEFAULT_CASTER_RANGE,
    MIN_CASTER_LOAD_TIME,
    MIN_CASTER_PROJECTILE_SPEED,
} from '../../04_STRUCTURES/Caster/CasterType'
import { IMMOLATION_SKILLS } from '../../04_STRUCTURES/Monster/Immolation_skills'
import { MONSTER_TELEPORT_PERIOD_MAX, MONSTER_TELEPORT_PERIOD_MIN } from '../../04_STRUCTURES/Monster/MonsterTeleport'
import { CLEAR_MOB_MAX_DURATION, FRONT_MONTANT_DURATION } from '../../04_STRUCTURES/Monster_properties/ClearMob'
import { MakeMonsterSimplePatrol } from '../../05_MAKE_STRUCTURES/Make_create_monsters/MakeMonsterSimplePatrol'
import { CmdParam, USAGE } from '../Helpers/Command_functions'

export const initExecuteCommandMake_monsters = () => {
    const { registerCommand } = ServiceManager.getService('Cmd')
    const group = 'make'

    //-newMonster(newm) <label> <unitTypeId> [<immolationRadius> [<speed> [<scale> [<isClickable>]]]]
    registerCommand({
        name: 'newMonster',
        alias: ['newm'],
        group,
        argDescription: '<label> <unitTypeId> [<immolationRadius> [<speed> [<scale> [<isClickable>]]]]',
        description: 'Add a new monster',
        cb: ({ cmd, nbParam, param1, param2, param3 }, escaper) => {
            if (nbParam < 2 || nbParam > 6) {
                return true
            }
            //checkParam1
            if (getUdgMonsterTypes().isLabelAlreadyUsed(param1)) {
                Text.erP(escaper.getPlayer(), 'Label "' + param1 + '" already used')
                return true
            }
            //checkParam2
            if (
                !(StringLength(param2) === 6 && SubStringBJ(param2, 1, 1) === "'" && SubStringBJ(param2, 6, 6) === "'")
            ) {
                Text.erP(escaper.getPlayer(), "Wrong unit type id (exemple : 'hfoo')")
                return true
            }

            let str = ''

            let immoRadius = 0
            let speed = Constants.DEFAULT_MONSTER_SPEED
            let scale = -1
            let clickable = false

            //checkParam3
            if (nbParam >= 3) {
                immoRadius = S2I(param3)
                if (immoRadius !== 0 && !IMMOLATION_SKILLS[immoRadius]) {
                    Text.erP(
                        escaper.getPlayer(),
                        'Wrong immolation radius ; should be an integer divisible by 5 and between 0 and 400'
                    )
                    return true
                }

                //checkParam4
                if (nbParam >= 4) {
                    str = CmdParam(cmd, 4)
                    if (!IsPositiveInteger(str) || S2I(str) > Constants.MAX_MOVE_SPEED) {
                        Text.erP(
                            escaper.getPlayer(),
                            'Wrong speed value ; should be a positive integer between 0 and 522'
                        )
                        return true
                    }
                    speed = S2R(str)

                    //checkParam5
                    if (nbParam >= 5) {
                        str = CmdParam(cmd, 5)
                        if (S2R(str) <= 0 && str !== 'default' && str !== 'd') {
                            Text.erP(
                                escaper.getPlayer(),
                                'Wrong scale value ; should be a real upper than 0 or "default" or "d"'
                            )
                            return true
                        }
                        if (str !== 'default' && str !== 'd') {
                            scale = S2R(str)
                        }

                        //checkParam6
                        if (nbParam === 6) {
                            str = CmdParam(cmd, 6)
                            if (!IsBoolString(str)) {
                                Text.erP(
                                    escaper.getPlayer(),
                                    "Wrong \"is clickable\" value ; should be 'true', 'false', '0' or '1'"
                                )
                                return true
                            }
                            clickable = S2B(str)
                        }
                    }
                }
            }

            getUdgMonsterTypes().new(
                param1,
                String2Ascii(SubStringBJ(param2, 2, 5) ?? ''),
                scale,
                immoRadius,
                speed,
                clickable
            )

            Text.mkP(escaper.getPlayer(), 'Monster type "' + param1 + '" created')

            return true
        },
    })

    //-setMonsterLabel(setml) <oldMonsterLabel> <newMonsterLabel>
    registerCommand({
        name: 'setMonsterLabel',
        alias: ['setml'],
        group,
        argDescription: '<oldMonsterLabel> <newMonsterLabel>',
        description: 'Change the label of a monster',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (!(nbParam === 2)) {
                return true
            }
            let b = !!getUdgMonsterTypes().getByLabel(param1)
            if (b) {
                b = !getUdgMonsterTypes().isLabelAlreadyUsed(param2)
            }
            if (b) {
                getUdgMonsterTypes().getByLabel(param1)?.setLabel(param2)
                Text.mkP(escaper.getPlayer(), 'label changed to "' + param2 + '"')
            } else {
                Text.erP(escaper.getPlayer(), 'impossible to change label')
            }
            return true
        },
    })

    //-setMonsterAlias(setma) <monsterLabel> <alias>
    registerCommand({
        name: 'setMonsterAlias',
        alias: ['setma'],
        group,
        argDescription: '<monsterLabel> <alias>',
        description: 'Change the alias of a monster',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (!(nbParam === 2)) {
                return true
            }
            let b = !!getUdgMonsterTypes().getByLabel(param1)
            if (b) {
                b = !getUdgMonsterTypes().isLabelAlreadyUsed(param2)
            }
            if (b) {
                getUdgMonsterTypes().getByLabel(param1)?.setAlias(param2)
                Text.mkP(escaper.getPlayer(), 'alias changed to "' + param2 + '"')
            } else {
                Text.erP(escaper.getPlayer(), 'impossible to change alias')
            }
            return true
        },
    })

    //-setMonsterUnit(setmu) <monsterLabel> <unitType>   --> example of unit type : 'ewsp'
    registerCommand({
        name: 'setMonsterUnit',
        alias: ['setmu'],
        group,
        argDescription: '<monsterLabel> <unitType>',
        description: 'Change the unit type of a monster',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (!(nbParam === 2)) {
                return true
            }
            //checkParam1
            if (!getUdgMonsterTypes().isLabelAlreadyUsed(param1)) {
                Text.erP(escaper.getPlayer(), 'unknown monster type')
                return true
            }
            //checkParam2
            if (
                !(StringLength(param2) === 6 && SubStringBJ(param2, 1, 1) === "'" && SubStringBJ(param2, 6, 6) === "'")
            ) {
                Text.erP(escaper.getPlayer(), "wrong unit type id (exemple : 'hfoo')")
                return true
            }
            if (
                getUdgMonsterTypes()
                    .getByLabel(param1)
                    ?.setUnitTypeId(String2Ascii(SubStringBJ(param2, 2, 5) ?? ''))
            ) {
                Text.mkP(escaper.getPlayer(), 'unit type changed')
            } else {
                Text.erP(escaper.getPlayer(), "this unit type doesn't exist")
            }
            return true
        },
    })

    //-setMonsterImmolation(setmi) <monsterLabel> <immolationRadius>   --> immolation between 5 and 400, divisible by 5
    registerCommand({
        name: 'setMonsterImmolation',
        alias: ['setmi'],
        group,
        argDescription: '<monsterLabel> <immolationRadius>',
        description: 'Change the immolation radius of a monster',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (!(nbParam === 2)) {
                return true
            }
            //checkParam1
            if (!getUdgMonsterTypes().isLabelAlreadyUsed(param1)) {
                Text.erP(escaper.getPlayer(), 'unknown monster type')
                return true
            }
            //checkParam2
            const x = S2I(param2)
            if (x !== 0 && !IMMOLATION_SKILLS[x]) {
                Text.erP(
                    escaper.getPlayer(),
                    'wrong immolation radius ; should be an integer divisible by 5 and between 0 and 400'
                )
                return true
            }
            if (getUdgMonsterTypes().getByLabel(param1)?.setImmolation(x)) {
                Text.mkP(escaper.getPlayer(), 'immolation changed')
            } else {
                Text.erP(escaper.getPlayer(), "couldn't change immolation")
            }
            return true
        },
    })

    //-setMonsterMoveSpeed(setmms) <monsterLabel> <speed>
    registerCommand({
        name: 'setMonsterMoveSpeed',
        alias: ['setmms'],
        group,
        argDescription: '<monsterLabel> <speed>',
        description: 'Change the move speed of a monster',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (!(nbParam === 2)) {
                return true
            }
            //checkParam1
            if (!getUdgMonsterTypes().isLabelAlreadyUsed(param1)) {
                Text.erP(escaper.getPlayer(), 'unknown monster type')
                return true
            }
            //checkParam2
            if (!IsPositiveInteger(param2) || S2I(param2) > Constants.MAX_MOVE_SPEED) {
                Text.erP(escaper.getPlayer(), 'wrong speed value ; should be a positive integer between 0 and 522')
                return true
            }
            if (getUdgMonsterTypes().getByLabel(param1)?.setUnitMoveSpeed(S2R(param2))) {
                Text.mkP(escaper.getPlayer(), 'move speed changed')
            } else {
                Text.erP(escaper.getPlayer(), "couldn't change move speed")
            }
            return true
        },
    })

    //-setMonsterScale(setms) <monsterLabel> <scale>   --> affects the size of this kind of monster
    registerCommand({
        name: 'setMonsterScale',
        alias: ['setms'],
        group,
        argDescription: '<monsterLabel> <scale>',
        description: 'Change the scale of a monster',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (!(nbParam === 2)) {
                return true
            }
            //checkParam1
            if (!getUdgMonsterTypes().isLabelAlreadyUsed(param1)) {
                Text.erP(escaper.getPlayer(), 'unknown monster type')
                return true
            }
            //checkParam2
            if (S2R(param2) <= 0 && param2 !== 'default' && param2 !== 'd') {
                Text.erP(escaper.getPlayer(), 'wrong scale value ; should be a real upper than 0 or "default" or "d"')
                return true
            }

            let x = 0
            if (param2 === 'default' || param2 === 'd') {
                x = -1
            } else {
                x = S2R(param2)
            }

            if (getUdgMonsterTypes().getByLabel(param1)?.setScale(x)) {
                Text.mkP(escaper.getPlayer(), 'scale changed')
            } else {
                Text.erP(escaper.getPlayer(), "couldn't change scale, probably because the old value is the same")
            }
            return true
        },
    })

    //-setMonsterCreateTerrain(setmct) <monsterLabel> <terrainLabel>   --> Create terrain
    registerCommand({
        name: 'setMonsterCreateTerrain',
        alias: ['setmct'],
        group,
        argDescription: '<monsterLabel> <terrainLabel>',
        description: 'Change the scale of a monster',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (!(nbParam === 2)) {
                return true
            }

            const monsterType = getUdgMonsterTypes().getByLabel(param1)

            //checkParam1
            if (!monsterType) {
                Text.erP(escaper.getPlayer(), 'unknown monster type')
                return true
            }

            //checkParam2
            if (!getUdgTerrainTypes().getByLabel(param2)) {
                monsterType.setCreateTerrainLabel(undefined)
                Text.mkP(escaper.getPlayer(), 'Create terrain disabled')
                return true
            }

            monsterType.setCreateTerrainLabel(param2)
            Text.mkP(escaper.getPlayer(), `Create terrain changed to: ${param2}`)
            return true
        },
    })

    //-setMonsterClickable(setmc) <monsterLabel> <boolean clickable>   --> sets if locust or not for this kind of monster
    registerCommand({
        name: 'setMonsterClickable',
        alias: ['setmc'],
        group,
        argDescription: '<monsterLabel> <boolean clickable>',
        description: 'Sets if locust or not for this kind of monster',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (!(nbParam === 2)) {
                return true
            }
            //checkParam1
            if (!getUdgMonsterTypes().isLabelAlreadyUsed(param1)) {
                Text.erP(escaper.getPlayer(), 'unknown monster type')
                return true
            }
            //checkParam2
            if (!IsBoolString(param2)) {
                Text.erP(escaper.getPlayer(), "wrong \"is clickable\" value ; should be 'true', 'false', '0' or '1'")
                return true
            }
            if (getUdgMonsterTypes().getByLabel(param1)?.setIsClickable(S2B(param2))) {
                if (S2B(param2)) {
                    Text.mkP(escaper.getPlayer(), 'this monster type is now clickable')
                } else {
                    Text.mkP(escaper.getPlayer(), 'this monster type is now unclickable')
                }
            } else {
                if (S2B(param2)) {
                    Text.erP(escaper.getPlayer(), 'this monster type is already clickable')
                } else {
                    Text.erP(escaper.getPlayer(), 'this monster type is already unclickable')
                }
            }
            return true
        },
    })

    //-setMonsterKillEffect(setmke) <monsterLabel> <killingEffect>
    registerCommand({
        name: 'setMonsterKillEffect',
        alias: ['setmke'],
        group,
        argDescription: '<monsterLabel> <killingEffect>',
        description: 'Sets the killing effect of a monster',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (!(nbParam === 2)) {
                return true
            }
            //checkParam1
            if (!getUdgMonsterTypes().isLabelAlreadyUsed(param1)) {
                Text.erP(escaper.getPlayer(), 'unknown monster type')
                return true
            }
            getUdgMonsterTypes().getByLabel(param1)?.setKillingEffectStr(param2)
            Text.mkP(escaper.getPlayer(), 'kill effect changed for this monster type')
            return true
        },
    })

    //-setMonsterMeteorsToKill(setmmtk) <monsterLabel> <meteorNumber>
    registerCommand({
        name: 'setMonsterMeteorsToKill',
        alias: ['setmmtk'],
        group,
        argDescription: '<monsterLabel> <meteorNumber>',
        description: 'Sets the number of meteors to kill for this monster type',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (!(nbParam === 2)) {
                return true
            }
            //checkParam1
            if (!getUdgMonsterTypes().isLabelAlreadyUsed(param1)) {
                Text.erP(escaper.getPlayer(), 'unknown monster type')
                return true
            }
            //checkParam2
            if (!(IsPositiveInteger(param2) && S2I(param2) > 0 && S2I(param2) < 10)) {
                Text.erP(escaper.getPlayer(), 'param2 must be an integer between 1 and 9')
                return true
            }
            getUdgMonsterTypes().getByLabel(param1)?.setNbMeteorsToKill(S2I(param2))
            Text.mkP(escaper.getPlayer(), 'number of meteors to kill changed for this monster type')
            return true
        },
    })

    //-setMonsterHeight(setmh) <monsterLabel> <height>|default|d
    registerCommand({
        name: 'setMonsterHeight',
        alias: ['setmh'],
        group,
        argDescription: '<monsterLabel> <height>|default|d',
        description: 'Sets the height of a monster',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (!(nbParam === 2)) {
                return true
            }
            //checkParam1
            if (!getUdgMonsterTypes().isLabelAlreadyUsed(param1)) {
                Text.erP(escaper.getPlayer(), 'unknown monster type')
                return true
            }

            let x = 0

            //checkParam2
            if (param2 === 'default' || param2 === 'd') {
                x = -1
            } else if (S2R(param2) > 0 || param2 === '0') {
                x = S2R(param2)
            } else {
                Text.erP(escaper.getPlayer(), 'wrong height ; should be a positive real or "default" or "d"')
                return true
            }
            if (getUdgMonsterTypes().getByLabel(param1)?.setHeight(x)) {
                Text.mkP(escaper.getPlayer(), 'height changed for this monster type')
            } else {
                Text.erP(escaper.getPlayer(), 'the height is already to this value')
            }
            return true
        },
    })

    //-setMonsterKillRectDimensions(setmkrd) <monsterLabel> <width> <height>
    registerCommand({
        name: 'setMonsterKillRectDimensions',
        alias: ['setmkrd'],
        group,
        argDescription: '<monsterLabel> <width> <height>',
        description:
            'Sets dimensions of a monster to apply a rectangle kill zone (applies only to non immobile monsters ; use when circle kill zone is not adapted)',
        cb: ({ nbParam, param1, param2, param3 }, escaper) => {
            if (nbParam !== 3) {
                return USAGE
            }

            //checkParam1
            if (!getUdgMonsterTypes().isLabelAlreadyUsed(param1)) {
                Text.erP(escaper.getPlayer(), 'unknown monster type')
                return true
            }

            //checkParam 2 & 3
            const width = S2I(param2)
            const height = S2I(param3)
            if (width <= 0 || height <= 0) {
                Text.erP(escaper.getPlayer(), 'wrong width or height ; should be positives integers')
                return true
            }

            if (getUdgMonsterTypes().getByLabel(param1)?.setKillRectDimensions(width, height)) {
                Text.mkP(escaper.getPlayer(), 'kill rectangle dimensions changed for this monster type')
            } else {
                Text.erP(escaper.getPlayer(), 'the kill rectangle dimensions have to be minimum 32x32')
            }
            return true
        },
    })

    //-setMonsterLifeBonus(setmlb) <monsterLabel> <width> <height>
    registerCommand({
        name: 'setMonsterLifeBonus',
        alias: ['setmlb'],
        group,
        argDescription: '<monsterLabel> <enabled> [<nbLivesEarned = 1> [<minimumSurviveTime = 0>]]',
        description:
            'Enables or disables the life bonus characteristic for a monster type. If enabled, a monster will gives lives when a hero touches them and survives the required time.',
        cb: ({ nbParam, param1, param2, param3, param4 }, escaper) => {
            if (nbParam < 2 || nbParam > 4) {
                return USAGE
            }

            //checkParam1
            const mt = getUdgMonsterTypes().getByLabel(param1)
            if (!mt) {
                Text.erP(escaper.getPlayer(), 'unknown monster type')
                return true
            }

            //checkParam2
            if (!IsBoolString(param2)) {
                return USAGE
            }
            const enabling = S2B(param2)

            //checkParam3
            let nbLivesEarned: number | undefined
            if (nbParam >= 3) {
                if (!IsPositiveInteger(param3)) {
                    return USAGE
                }
                nbLivesEarned = S2I(param3)
            }

            //checkParam4
            let minimumSurviveTime: number | undefined
            if (nbParam >= 4) {
                if (S2R(param4) < 0) {
                    return USAGE
                }
                minimumSurviveTime = S2R(param4)
            }

            //apply the command
            mt.setLifeBonus(enabling, nbLivesEarned, minimumSurviveTime)
            Text.mkP(escaper.getPlayer(), 'life bonus characteristic updated for this monster type')

            return true
        },
    })

    //-removeMonsterKillRectDimensions(remmkrd) <monsterLabel> <width> <height>
    registerCommand({
        name: 'removeMonsterKillRectDimensions',
        alias: ['remmkrd'],
        group,
        argDescription: '<monsterLabel>',
        description:
            'Remove kill rectangle dimensions of a monster (the corresponding monster units will no longer kills through a rectangle zone)',
        cb: ({ nbParam, param1 }, escaper) => {
            if (nbParam !== 1) {
                return true
            }
            //checkParam1
            const monsterType = getUdgMonsterTypes().getByLabel(param1)
            if (!monsterType) {
                Text.erP(escaper.getPlayer(), 'unknown monster type')
                return true
            }

            if (monsterType.getKillRectDimensions()) {
                monsterType.removeKillRectDimensions()
                Text.mkP(escaper.getPlayer(), 'kill rectangle dimensions removed for this monster type')
            } else {
                Text.erP(
                    escaper.getPlayer(),
                    'the kill rectangle dimensions already does not exists for this monster type'
                )
            }
            return true
        },
    })

    //-createMonsterImmobile(crmi) <monsterLabel> [<facingAngle>]   --> if facing angle not specified, random angles will be chosen
    registerCommand({
        name: 'createMonsterImmobile',
        alias: ['crmi'],
        group,
        argDescription: '<monsterLabel> [<facingAngle>]',
        description:
            'creates a monster at the current location, facing the specified angle (or random if not specified)',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (nbParam < 1 || nbParam > 2) {
                return true
            }
            //checkParam1
            if (!getUdgMonsterTypes().isLabelAlreadyUsed(param1)) {
                Text.erP(escaper.getPlayer(), 'unknown monster type')
                return true
            }

            let facingAngle = 0

            //checkParam2
            if (nbParam === 2) {
                if (S2R(param2) === 0 && param2 !== '0') {
                    Text.erP(escaper.getPlayer(), 'wrong angle value ; should be a real (-1 for random angle)')
                    return true
                }
                facingAngle = S2R(param2)
            } else {
                facingAngle = -1
            }

            const monsterType = getUdgMonsterTypes().getByLabel(param1)
            monsterType && escaper.makeCreateNoMoveMonsters(monsterType, facingAngle)

            Text.mkP(escaper.getPlayer(), 'monster making on')
            return true
        },
    })

    //-createMonster(crm) <monsterLabel>   --> simple patrols (2 locations)
    registerCommand({
        name: 'createMonster',
        alias: ['crm'],
        group,
        argDescription: '<monsterLabel>',
        description: 'Creates a monster at the current location, patrolling between 2 locations',
        cb: ({ nbParam, param1 }, escaper) => {
            if (!(nbParam === 1)) {
                return true
            }
            //checkParam1
            if (!getUdgMonsterTypes().isLabelAlreadyUsed(param1)) {
                Text.erP(escaper.getPlayer(), 'unknown monster type')
                return true
            }

            const monsterType = getUdgMonsterTypes().getByLabel(param1)
            monsterType && escaper.makeCreateSimplePatrolMonsters('normal', monsterType)

            Text.mkP(escaper.getPlayer(), 'monster making on')
            return true
        },
    })

    //-createMonsterString(crms) <monsterLabel>   --> simple patrols where the second loc of a monster is the first loc of the next one
    registerCommand({
        name: 'createMonsterString',
        alias: ['crms'],
        group,
        argDescription: '<monsterLabel>',
        description:
            'creates a monster at the current location, patrolling between 2 locations, where the second loc of a monster is the first loc of the next one',
        cb: ({ nbParam, param1 }, escaper) => {
            if (!(nbParam === 1)) {
                return true
            }
            //checkParam1
            if (!getUdgMonsterTypes().isLabelAlreadyUsed(param1)) {
                Text.erP(escaper.getPlayer(), 'unknown monster type')
                return true
            }

            const monsterType = getUdgMonsterTypes().getByLabel(param1)
            monsterType && escaper.makeCreateSimplePatrolMonsters('string', monsterType)

            Text.mkP(escaper.getPlayer(), 'monster making on')
            return true
        },
    })

    //-createMonsterAuto(crma) <monsterLabel> [angle]  --> simple patrols created with only one click (click on a slide terrain)
    registerCommand({
        name: 'createMonsterAuto',
        alias: ['crma'],
        group,
        argDescription: '<monsterLabel> [angle]',
        description:
            'creates a monster at the current location, patrolling between 2 locations, created with only one click (click on a slide terrain)',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (!(nbParam === 1) && !(nbParam === 2)) {
                return true
            }

            //checkParam1
            if (!getUdgMonsterTypes().isLabelAlreadyUsed(param1)) {
                Text.erP(escaper.getPlayer(), 'unknown monster type')
                return true
            }

            const angle = nbParam === 2 ? convertTextToAngle(param2) : undefined

            if (nbParam === 2 && angle === undefined) {
                return USAGE
            }

            const monsterType = getUdgMonsterTypes().getByLabel(param1)
            monsterType && escaper.makeCreateSimplePatrolMonsters('auto', monsterType, angle)

            Text.mkP(escaper.getPlayer(), 'monster making on')
            return true
        },
    })

    //-setAutoDistOnTerrain(setadot) <newDist>   --> for patrol monsters created in one click, distance between locations and slide terrain
    registerCommand({
        name: 'setAutoDistOnTerrain',
        alias: ['setadot'],
        group,
        argDescription: '<newDist>',
        description: 'For patrol monsters created in one click, distance between locations and slide terrain',
        cb: ({ nbParam, param1 }, escaper) => {
            if (!(nbParam === 1 && (S2R(param1) !== 0 || param1 === '0' || param1 === 'default' || param1 === 'd'))) {
                return true
            }
            if (param1 === 'default' || param1 === 'd') {
                MakeMonsterSimplePatrol.changeDistOnTerrainDefault()
            } else {
                if (!MakeMonsterSimplePatrol.changeDistOnTerrain(S2R(param1))) {
                    Text.erP(escaper.getPlayer(), 'distance specified out of bounds')
                    return true
                }
            }
            Text.mkP(escaper.getPlayer(), 'distance on terrain changed')
            return true
        },
    })

    //-createMonsterMultiPatrols(crmmp) <monsterLabel>   --> patrols until 20 locations
    registerCommand({
        name: 'createMonsterMultiPatrols',
        alias: ['crmmp'],
        group,
        argDescription: '<monsterLabel>',
        description: 'Creates a monster at the current location, patrolling between 2 locations, until 20 locations',
        cb: ({ nbParam, param1 }, escaper) => {
            if (!(nbParam === 1)) {
                return true
            }
            //checkParam1
            if (!getUdgMonsterTypes().isLabelAlreadyUsed(param1)) {
                Text.erP(escaper.getPlayer(), 'unknown monster type')
                return true
            }

            const monsterType = getUdgMonsterTypes().getByLabel(param1)
            monsterType && escaper.makeCreateMultiplePatrolsMonsters('normal', monsterType)

            Text.mkP(escaper.getPlayer(), 'monster making on')
            return true
        },
    })

    //-createMonsterMultiPatrolsString(crmmps) <monsterLabel>   --> patrols until 20 locations, with come back at last location
    registerCommand({
        name: 'createMonsterMultiPatrolsString',
        alias: ['crmmps'],
        group,
        argDescription: '<monsterLabel>',
        description:
            'creates a monster at the current location, patrolling between 2 locations, until 20 locations, with come back at last location',
        cb: ({ nbParam, param1 }, escaper) => {
            if (!(nbParam === 1)) {
                return true
            }
            //checkParam1
            if (!getUdgMonsterTypes().isLabelAlreadyUsed(param1)) {
                Text.erP(escaper.getPlayer(), 'unknown monster type')
                return true
            }

            const monsterType = getUdgMonsterTypes().getByLabel(param1)
            monsterType && escaper.makeCreateMultiplePatrolsMonsters('string', monsterType)
            Text.mkP(escaper.getPlayer(), 'monster making on')
            return true
        },
    })

    //-createMonsterTeleport(crmt) <monsterLabel> <period> <angle>   --> teleport monster until 20 locations
    registerCommand({
        name: 'createMonsterTeleport',
        alias: ['crmt'],
        group,
        argDescription: '<monsterLabel> <period> <angle>',
        description: 'Creates a monster at the current location, patrolling between 2 locations, until 20 locations',
        cb: ({ nbParam, param1, param2, param3 }, escaper) => {
            if (!(nbParam === 3)) {
                return true
            }
            //checkParam1
            if (!getUdgMonsterTypes().isLabelAlreadyUsed(param1)) {
                Text.erP(escaper.getPlayer(), 'unknown monster type')
                return true
            }
            //checkParam2
            const x = S2R(param2)
            if (x < MONSTER_TELEPORT_PERIOD_MIN || x > MONSTER_TELEPORT_PERIOD_MAX) {
                Text.erP(
                    escaper.getPlayer(),
                    'the period must be between ' +
                        R2S(MONSTER_TELEPORT_PERIOD_MIN) +
                        ' and ' +
                        R2S(MONSTER_TELEPORT_PERIOD_MAX)
                )
                return true
            }
            //checkParam3
            if (S2R(param3) === 0 && param3 !== '0') {
                Text.erP(escaper.getPlayer(), 'wrong angle value ; should be a real (-1 for random angle)')
                return true
            }

            const monsterType = getUdgMonsterTypes().getByLabel(param1)
            monsterType && escaper.makeCreateTeleportMonsters('normal', monsterType, x, S2R(param3))

            Text.mkP(escaper.getPlayer(), 'monster making on')
            return true
        },
    })

    //-createMonsterTeleportStrings(crmts) <monsterLabel> <period> <angle>   --> teleport monster until 20 locations
    registerCommand({
        name: 'createMonsterTeleportStrings',
        alias: ['crmts'],
        group,
        argDescription: '<monsterLabel> <period> <angle>',
        description: 'Creates a monster at the current location, patrolling between 2 locations, until 20 locations',
        cb: ({ nbParam, param1, param2, param3 }, escaper) => {
            if (!(nbParam === 3)) {
                return true
            }
            //checkParam1
            if (!getUdgMonsterTypes().isLabelAlreadyUsed(param1)) {
                Text.erP(escaper.getPlayer(), 'unknown monster type')
                return true
            }
            //checkParam2
            const x = S2R(param2)
            if (x < MONSTER_TELEPORT_PERIOD_MIN || x > MONSTER_TELEPORT_PERIOD_MAX) {
                Text.erP(
                    escaper.getPlayer(),
                    'the period must be between ' +
                        R2S(MONSTER_TELEPORT_PERIOD_MIN) +
                        ' and ' +
                        R2S(MONSTER_TELEPORT_PERIOD_MAX)
                )
                return true
            }
            //checkParam3
            if (S2R(param3) === 0 && param3 !== '0') {
                Text.erP(escaper.getPlayer(), 'wrong angle value ; should be a real (-1 for random angle)')
                return true
            }

            const monsterType = getUdgMonsterTypes().getByLabel(param1)
            monsterType && escaper.makeCreateTeleportMonsters('string', monsterType, x, S2R(param3))

            Text.mkP(escaper.getPlayer(), 'monster making on')
            return true
        },
    })

    //-next(n)   --> finalize the current multi patrols or teleport monster and start the next one
    registerCommand({
        name: 'next',
        alias: ['n'],
        group,
        argDescription: '',
        description: 'Finalize the current multi patrols or teleport monster and start the next one',
        cb: ({ noParam }, escaper) => {
            if (!noParam) {
                return true
            }
            if (escaper.makeMmpOrMtNext()) {
                Text.mkP(escaper.getPlayer(), 'next')
            } else {
                Text.erP(escaper.getPlayer(), "you're not making multipatrol or teleport monsters")
            }
            return true
        },
    })

    //-monsterTeleportWait(mtw)   --> ajoute une période d'attente le MonsterTeleport en train d'être créé
    registerCommand({
        name: 'monsterTeleportWait',
        alias: ['mtw'],
        group,
        argDescription: '',
        description: 'A wait period for the monster teleport being created',
        cb: ({ noParam }, escaper) => {
            if (!noParam) {
                return true
            }
            if (escaper.makeMonsterTeleportWait()) {
                Text.mkP(escaper.getPlayer(), 'wait period added')
            } else {
                Text.erP(escaper.getPlayer(), 'impossible to add a wait period')
            }
            return true
        },
    })

    //-monsterTeleportHide(mth)   --> ajoute une période où le MonsterTeleport est caché et ne tue pas
    registerCommand({
        name: 'monsterTeleportHide',
        alias: ['mth'],
        group,
        argDescription: '',
        description: 'A hide period for the monster teleport being created',
        cb: ({ noParam }, escaper) => {
            if (!noParam) {
                return true
            }
            if (escaper.makeMonsterTeleportHide()) {
                Text.mkP(escaper.getPlayer(), 'hide period added')
            } else {
                Text.erP(escaper.getPlayer(), 'impossible to add a hide period')
            }
            return true
        },
    })

    //-setUnitTeleportPeriod(setutp) <period>
    registerCommand({
        name: 'setUnitTeleportPeriod',
        alias: ['setutp'],
        group,
        argDescription: '<period>',
        description: 'Set the period for the unit teleport being created',
        cb: ({ nbParam, param1 }, escaper) => {
            if (nbParam !== 1) {
                return true
            }
            //checkParam1
            const x = S2R(param1)
            if (x < MONSTER_TELEPORT_PERIOD_MIN || x > MONSTER_TELEPORT_PERIOD_MAX) {
                Text.erP(
                    escaper.getPlayer(),
                    'the period must be between ' +
                        R2S(MONSTER_TELEPORT_PERIOD_MIN) +
                        ' and ' +
                        R2S(MONSTER_TELEPORT_PERIOD_MAX)
                )
                return true
            }
            //apply command
            escaper.makeSetUnitTeleportPeriod('oneByOne', x)
            Text.mkP(escaper.getPlayer(), 'setting unit teleport period on')
            return true
        },
    })

    //-setUnitTeleportPeriodBetweenPoints(setutpbp) <period>
    registerCommand({
        name: 'setUnitTeleportPeriodBetweenPoints',
        alias: ['setutpbp'],
        group,
        argDescription: '<period>',
        description: 'Set the period for the unit teleport being created',
        cb: ({ nbParam, param1 }, escaper) => {
            if (nbParam !== 1) {
                return true
            }
            //checkParam1
            const x = S2R(param1)
            if (x < MONSTER_TELEPORT_PERIOD_MIN || x > MONSTER_TELEPORT_PERIOD_MAX) {
                Text.erP(
                    escaper.getPlayer(),
                    'the period must be between ' +
                        R2S(MONSTER_TELEPORT_PERIOD_MIN) +
                        ' and ' +
                        R2S(MONSTER_TELEPORT_PERIOD_MAX)
                )
                return true
            }
            //apply command
            escaper.makeSetUnitTeleportPeriod('twoClics', x)
            Text.mkP(escaper.getPlayer(), 'setting unit teleport period on')
            return true
        },
    })

    //-getUnitTeleportPeriod(getutp)
    registerCommand({
        name: 'getUnitTeleportPeriod',
        alias: ['getutp'],
        group,
        argDescription: '',
        description: 'Displays the period of any teleporting unit you click',
        cb: ({ noParam }, escaper) => {
            if (!noParam) {
                return true
            }
            //apply command
            escaper.makeGetUnitTeleportPeriod()
            Text.mkP(escaper.getPlayer(), 'getting unit teleport period on')
            return true
        },
    })

    //-setUnitMonsterType(setumt) <monsterLabel>
    registerCommand({
        name: 'setUnitMonsterType',
        alias: ['setumt'],
        group,
        argDescription: '<monsterLabel>',
        description: '',
        cb: ({ nbParam, param1 }, escaper) => {
            if (nbParam !== 1) {
                return true
            }
            //checkParam1
            if (!getUdgMonsterTypes().isLabelAlreadyUsed(param1)) {
                Text.erP(escaper.getPlayer(), 'unknown monster type')
                return true
            }
            //apply command
            const monsterType = getUdgMonsterTypes().getByLabel(param1)
            monsterType && escaper.makeSetUnitMonsterType('oneByOne', monsterType)
            Text.mkP(escaper.getPlayer(), 'setting unit monster type on')
            return true
        },
    })

    //-setUnitMonsterTypeBetweenPoints(setumtbp) <monsterLabel>
    registerCommand({
        name: 'setUnitMonsterTypeBetweenPoints',
        alias: ['setumtbp'],
        group,
        argDescription: '<monsterLabel>',
        description: '',
        cb: ({ nbParam, param1 }, escaper) => {
            if (nbParam !== 1) {
                return true
            }
            //checkParam1
            if (!getUdgMonsterTypes().isLabelAlreadyUsed(param1)) {
                Text.erP(escaper.getPlayer(), 'unknown monster type')
                return true
            }
            //apply command
            const monsterType = getUdgMonsterTypes().getByLabel(param1)
            monsterType && escaper.makeSetUnitMonsterType('twoClics', monsterType)
            Text.mkP(escaper.getPlayer(), 'setting unit monster type on')
            return true
        },
    })

    //-displayMonsters(dm) [<monsterLabel>] [page]   --> displays the characteristics of the kinds of monsters added by the maker(s)
    registerCommand({
        name: 'displayMonsters',
        alias: ['dm'],
        group,
        argDescription: '[<monsterLabel>] [page]',
        description: 'Displays the characteristics of the kinds of monsters added by the maker(s)',
        cb: ({ cmd }, escaper) => {
            getUdgMonsterTypes().displayPaginatedForPlayer(escaper.getPlayer(), cmd)
            return true
        },
    })

    //-deleteMonstersBetweenPoints(delmbp) [<deleteMode>]   --> delete monsters in a rectangle formed with two clicks
    registerCommand({
        name: 'deleteMonstersBetweenPoints',
        alias: ['delmbp'],
        group,
        argDescription: '[<deleteMode>]',
        description: 'Delete monsters in a rectangle formed with two clicks',
        cb: ({ nbParam, param1 }, escaper) => {
            //delete modes : all, noMove, move, simplePatrol, multiplePatrols
            if (!(nbParam <= 1)) {
                return true
            }

            let str = ''

            if (nbParam === 1) {
                if (param1 === 'all' || param1 === 'a') {
                    str = 'all'
                } else {
                    if (param1 === 'noMove' || param1 === 'nm') {
                        str = 'noMove'
                    } else {
                        if (param1 === 'move' || param1 === 'm') {
                            str = 'move'
                        } else {
                            if (param1 === 'simplePatrol' || param1 === 'sp') {
                                str = 'simplePatrol'
                            } else {
                                if (param1 === 'multiplePatrols' || param1 === 'mp') {
                                    str = 'multiplePatrols'
                                } else {
                                    return true
                                }
                            }
                        }
                    }
                }
            } else {
                str = 'all'
            }
            escaper.makeDeleteMonsters(str)
            Text.mkP(escaper.getPlayer(), 'monsters deleting on')
            return true
        },
    })

    //-deleteMonster(delm)   --> delete the monsters clicked by the player
    registerCommand({
        name: 'deleteMonster',
        alias: ['delm'],
        group,
        argDescription: '',
        description: 'Delete the monsters clicked by the player',
        cb: ({ noParam }, escaper) => {
            if (noParam) {
                escaper.makeDeleteMonsters('oneByOne')
                Text.mkP(escaper.getPlayer(), 'monster deleting on')
            }
            return true
        },
    })

    //-setMonsterWanderable(setmw) <monsterLabel> <boolean clickable>
    registerCommand({
        name: 'setMonsterWanderable',
        alias: ['setmw'],
        group,
        argDescription: '<monsterLabel> <boolean clickable>',
        description: '',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (!(nbParam === 2)) {
                return true
            }
            //checkParam1
            if (!getUdgMonsterTypes().isLabelAlreadyUsed(param1)) {
                Text.erP(escaper.getPlayer(), 'unknown monster type')
                return true
            }
            //checkParam2
            if (!IsBoolString(param2)) {
                Text.erP(escaper.getPlayer(), "wrong \"is wanderable\" value ; should be 'true', 'false', '0' or '1'")
                return true
            }
            if (getUdgMonsterTypes().getByLabel(param1)?.setIsWanderable(S2B(param2))) {
                if (S2B(param2)) {
                    Text.mkP(escaper.getPlayer(), 'this monster type is now wanderable')
                } else {
                    Text.mkP(escaper.getPlayer(), 'this monster type is now unable to wander')
                }
            } else {
                if (S2B(param2)) {
                    Text.erP(escaper.getPlayer(), 'this monster type is already wanderable')
                } else {
                    Text.erP(escaper.getPlayer(), 'this monster type is already unable to wander')
                }
            }
            return true
        },
    })

    //-newCaster(newc) <label> <casterMonsterType> <projectileMonsterType> [<range> [<projectileSpeed> [<loadTime>]]]
    registerCommand({
        name: 'newCaster',
        alias: ['newc'],
        group,
        argDescription:
            '<label> <casterMonsterType> <projectileMonsterType> [<range> [<projectileSpeed> [<loadTime>]]]',
        description: 'Create a new caster monster',
        cb: ({ cmd, nbParam, param1, param2, param3, param4 }, escaper) => {
            if (nbParam < 3 || nbParam > 6) {
                return true
            }
            //checkParam1
            if (getUdgCasterTypes().isLabelAlreadyUsed(param1)) {
                Text.erP(escaper.getPlayer(), 'Label "' + param1 + '" already used')
                return true
            }
            //checkParam2
            if (!getUdgMonsterTypes().isLabelAlreadyUsed(param2)) {
                Text.erP(escaper.getPlayer(), 'Unknown monster type "' + param2 + '"')
                return true
            }
            //checkParam3
            if (!getUdgMonsterTypes().isLabelAlreadyUsed(param3)) {
                Text.erP(escaper.getPlayer(), 'Unknown monster type "' + param3 + '"')
                return true
            }

            let x = 0
            let y = 0
            let speed = 0

            //checkParam4 range
            if (nbParam >= 4) {
                if (S2R(param4) <= 0) {
                    Text.erP(escaper.getPlayer(), 'The range must be a real higher than 0')
                    return true
                }
                x = S2R(param4)
                //checkParam5 projectile speed
                if (nbParam >= 5) {
                    if (S2R(CmdParam(cmd, 5)) < MIN_CASTER_PROJECTILE_SPEED) {
                        Text.erP(
                            escaper.getPlayer(),
                            'The projectile speed must be a real higher or equals to ' +
                                R2S(MIN_CASTER_PROJECTILE_SPEED)
                        )
                        return true
                    }
                    speed = S2R(CmdParam(cmd, 5))
                    //checkParam6 load time
                    if (nbParam === 6) {
                        if (S2R(CmdParam(cmd, 6)) < MIN_CASTER_LOAD_TIME) {
                            Text.erP(
                                escaper.getPlayer(),
                                'The load time must be a real higher or equals to ' + R2S(MIN_CASTER_LOAD_TIME)
                            )
                            return true
                        }
                        y = S2R(CmdParam(cmd, 6))
                    } else {
                        y = DEFAULT_CASTER_LOAD_TIME
                    }
                } else {
                    y = DEFAULT_CASTER_LOAD_TIME
                    speed = DEFAULT_CASTER_PROJECTILE_SPEED
                }
            } else {
                y = DEFAULT_CASTER_LOAD_TIME
                speed = DEFAULT_CASTER_PROJECTILE_SPEED
                x = DEFAULT_CASTER_RANGE
            }

            //apply command
            const casterMonsterType = getUdgMonsterTypes().getByLabel(param2)
            const projectileMonsterType = getUdgMonsterTypes().getByLabel(param3)

            casterMonsterType &&
                projectileMonsterType &&
                getUdgCasterTypes().new(
                    param1,
                    casterMonsterType,
                    projectileMonsterType,
                    x,
                    speed,
                    y,
                    DEFAULT_CASTER_ANIMATION
                )
            Text.mkP(escaper.getPlayer(), 'new caster type "' + param1 + '" created')
            return true
        },
    })

    //-setCasterLabel(setcl) <oldCasterLabel> <newCasterLabel>
    registerCommand({
        name: 'setCasterLabel',
        alias: ['setcl'],
        group,
        argDescription: '<oldCasterLabel> <newCasterLabel>',
        description: 'Change the label of a caster monster',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (!(nbParam === 2)) {
                return true
            }
            let b = !!getUdgCasterTypes().getByLabel(param1)
            if (b) {
                b = !getUdgCasterTypes().isLabelAlreadyUsed(param2)
            }
            if (b) {
                getUdgCasterTypes().getByLabel(param1)?.setLabel(param2)
                Text.mkP(escaper.getPlayer(), 'label changed to "' + param2 + '"')
            } else {
                Text.erP(escaper.getPlayer(), 'impossible to change label')
            }
            return true
        },
    })

    //-setCasterAlias(setca) <casterLabel> <alias>
    registerCommand({
        name: 'setCasterAlias',
        alias: ['setca'],
        group,
        argDescription: '<casterLabel> <alias>',
        description: 'Change the alias of a caster monster',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (!(nbParam === 2)) {
                return true
            }
            let b = !!getUdgCasterTypes().getByLabel(param1)
            if (b) {
                b = !getUdgCasterTypes().isLabelAlreadyUsed(param2)
            }
            if (b) {
                getUdgCasterTypes().getByLabel(param1)?.setAlias(param2)
                Text.mkP(escaper.getPlayer(), 'alias changed to "' + param2 + '"')
            } else {
                Text.erP(escaper.getPlayer(), 'impossible to change alias')
            }
            return true
        },
    })

    //-setCasterCaster(setcc) <casterLabel> <casterMonsterType>
    registerCommand({
        name: 'setCasterCaster',
        alias: ['setcc'],
        group,
        argDescription: '<casterLabel> <casterMonsterType>',
        description: 'Change the caster monster type of a caster monster',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (nbParam !== 2) {
                return true
            }
            //checkParam 1
            if (!getUdgCasterTypes().isLabelAlreadyUsed(param1)) {
                Text.erP(escaper.getPlayer(), 'unknown caster type "' + param1 + '"')
                return true
            }
            //checkParam 2
            if (!getUdgMonsterTypes().isLabelAlreadyUsed(param2)) {
                Text.erP(escaper.getPlayer(), 'unknown monster type "' + param2 + '"')
                return true
            }
            //apply command
            const monsterType = getUdgMonsterTypes().getByLabel(param2)
            monsterType && getUdgCasterTypes().getByLabel(param1)?.setCasterMonsterType(monsterType)
            Text.mkP(escaper.getPlayer(), 'caster monster type changed')
            return true
        },
    })

    //-setCasterProjectile(setcp) <casterLabel> <projectileMonsterType>
    registerCommand({
        name: 'setCasterProjectile',
        alias: ['setcp'],
        group,
        argDescription: '<casterLabel> <projectileMonsterType>',
        description: 'Change the projectile monster type of a caster monster',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (nbParam !== 2) {
                return true
            }
            //checkParam 1
            if (!getUdgCasterTypes().isLabelAlreadyUsed(param1)) {
                Text.erP(escaper.getPlayer(), 'unknown caster type "' + param1 + '"')
                return true
            }
            //checkParam 2
            if (!getUdgMonsterTypes().isLabelAlreadyUsed(param2)) {
                Text.erP(escaper.getPlayer(), 'unknown monster type "' + param2 + '"')
                return true
            }
            //apply command
            const monsterType = getUdgMonsterTypes().getByLabel(param2)
            monsterType && getUdgCasterTypes().getByLabel(param1)?.setProjectileMonsterType(monsterType)
            Text.mkP(escaper.getPlayer(), 'projectile monster type changed')
            return true
        },
    })

    //-setCasterRange(setcr) <casterLabel> <range>
    registerCommand({
        name: 'setCasterRange',
        alias: ['setcr'],
        group,
        argDescription: '<casterLabel> <range>',
        description: 'Change the range of a caster monster',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (nbParam !== 2) {
                return true
            }
            //checkParam 1
            if (!getUdgCasterTypes().isLabelAlreadyUsed(param1)) {
                Text.erP(escaper.getPlayer(), 'unknown caster type "' + param1 + '"')
                return true
            }
            //checkParam 2
            if (S2R(param2) <= 0) {
                Text.erP(escaper.getPlayer(), 'the range must be a real higher than 0')
                return true
            }
            //apply command
            getUdgCasterTypes().getByLabel(param1)?.setRange(S2R(param2))
            Text.mkP(escaper.getPlayer(), 'range changed')
            return true
        },
    })

    //-setCasterSpeed(setcs) <casterLabel> <projectileSpeed>
    registerCommand({
        name: 'setCasterSpeed',
        alias: ['setcs'],
        group,
        argDescription: '<casterLabel> <projectileSpeed>',
        description: 'Change the speed of a caster monster',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (nbParam !== 2) {
                return true
            }
            //checkParam 1
            if (!getUdgCasterTypes().isLabelAlreadyUsed(param1)) {
                Text.erP(escaper.getPlayer(), 'unknown caster type "' + param1 + '"')
                return true
            }
            //checkParam 2
            if (S2R(param2) < MIN_CASTER_PROJECTILE_SPEED) {
                Text.erP(
                    escaper.getPlayer(),
                    'the projectile speed must be a real higher or equals to ' + R2S(MIN_CASTER_PROJECTILE_SPEED)
                )
                return true
            }
            //apply command
            getUdgCasterTypes().getByLabel(param1)?.setProjectileSpeed(S2R(param2))
            Text.mkP(escaper.getPlayer(), 'projectile speed changed')
            return true
        },
    })

    //-setCasterLoadtime(setclt) <casterLabel> <loadTime>
    registerCommand({
        name: 'setCasterLoadTime',
        alias: ['setclt'],
        group,
        argDescription: '<casterLabel> <loadTime>',
        description: 'Change the load time of a caster monster',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (nbParam !== 2) {
                return true
            }
            //checkParam 1
            if (!getUdgCasterTypes().isLabelAlreadyUsed(param1)) {
                Text.erP(escaper.getPlayer(), 'unknown caster type "' + param1 + '"')
                return true
            }
            //checkParam 2
            if (S2R(param2) < MIN_CASTER_LOAD_TIME) {
                Text.erP(
                    escaper.getPlayer(),
                    'the load time must be a real higher or equals to ' + R2S(MIN_CASTER_LOAD_TIME)
                )
                return true
            }
            //apply command
            getUdgCasterTypes().getByLabel(param1)?.setLoadTime(S2R(param2))
            Text.mkP(escaper.getPlayer(), 'load time changed')
            return true
        },
    })

    //-setCasterAnimation(setcan) <casterLabel> <animation>
    registerCommand({
        name: 'setCasterAnimation',
        alias: ['setcan'],
        group,
        argDescription: '<casterLabel> <animation>',
        description: 'Change the animation of a caster monster',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (nbParam < 2) {
                return true
            }
            //checkParam 1
            if (!getUdgCasterTypes().isLabelAlreadyUsed(param1)) {
                Text.erP(escaper.getPlayer(), 'unknown caster type "' + param1 + '"')
                return true
            }
            //apply command
            getUdgCasterTypes().getByLabel(param1)?.setAnimation(param2)
            Text.mkP(escaper.getPlayer(), 'caster animation changed')
            return true
        },
    })

    //-createCaster(crc) <casterLabel> [<facingAngle>]
    registerCommand({
        name: 'createCaster',
        alias: ['crc'],
        group,
        argDescription: '<casterLabel> [<facingAngle>]',
        description: 'Create a caster monster',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (nbParam < 1 || nbParam > 2) {
                return true
            }
            //checkParam 1
            if (!getUdgCasterTypes().isLabelAlreadyUsed(param1)) {
                Text.erP(escaper.getPlayer(), 'unknown caster type "' + param1 + '"')
                return true
            }

            let x = 0

            //checkParam2
            if (nbParam === 2) {
                if (S2R(param2) === 0 && param2 !== '0') {
                    Text.erP(escaper.getPlayer(), 'wrong angle value ; should be a real (-1 for random angle)')
                    return true
                }
                x = S2R(param2)
            } else {
                x = -1
            }
            //apply command
            const casterType = getUdgCasterTypes().getByLabel(param1)
            casterType && escaper.makeCreateCaster(casterType, x)
            Text.mkP(escaper.getPlayer(), 'casters making on')
            return true
        },
    })

    //-deleteCastersBetweenPoints(delcbp)   --> delete casters in a rectangle formed with two clicks
    registerCommand({
        name: 'deleteCastersBetweenPoints',
        alias: ['delcbp'],
        group,
        argDescription: '',
        description: 'Delete casters in a rectangle formed with two clicks',
        cb: ({ noParam }, escaper) => {
            if (noParam) {
                escaper.makeDeleteCasters('twoClics')
                Text.mkP(escaper.getPlayer(), 'casters deleting on')
            }
            return true
        },
    })

    //-deleteCaster(delc)   --> delete the casters clicked by the player
    registerCommand({
        name: 'deleteCaster',
        alias: ['delc'],
        group,
        argDescription: '',
        description: 'Delete the casters clicked by the player',
        cb: ({ noParam }, escaper) => {
            if (noParam) {
                escaper.makeDeleteCasters('oneByOne')
                Text.mkP(escaper.getPlayer(), 'casters deleting on')
            }
            return true
        },
    })

    //-displayCasters(dc) [<casterLabel>] [page]
    registerCommand({
        name: 'displayCasters',
        alias: ['dc'],
        group,
        argDescription: '[<casterLabel>] [page]',
        description: 'Display the casters of the map',
        cb: ({ cmd }, escaper) => {
            getUdgCasterTypes().displayPaginatedForPlayer(escaper.getPlayer(), cmd)
            return true
        },
    })

    //-createClearMob(crcm) <disableDuration>
    registerCommand({
        name: 'createClearMob',
        alias: ['crcm'],
        group,
        argDescription: '<disableDuration>',
        description: 'Create a clear mob',
        cb: ({ nbParam, param1 }, escaper) => {
            if (!(nbParam === 1)) {
                return true
            }
            const x = S2R(param1)
            if (x !== 0 && (x > CLEAR_MOB_MAX_DURATION || x < FRONT_MONTANT_DURATION)) {
                Text.erP(
                    escaper.getPlayer(),
                    'the disable duration must be a real between ' +
                        R2S(FRONT_MONTANT_DURATION) +
                        ' and ' +
                        R2S(CLEAR_MOB_MAX_DURATION)
                )
                return true
            }
            escaper.makeCreateClearMobs(x)
            Text.mkP(escaper.getPlayer(), 'clear mob making on')
            return true
        },
    })

    //-deleteClearMob(delcm)
    registerCommand({
        name: 'deleteClearMob',
        alias: ['delcm'],
        group,
        argDescription: '',
        description: 'Delete the clear mob',
        cb: ({ noParam }, escaper) => {
            if (!noParam) {
                return true
            }
            escaper.makeDeleteClearMobs()
            Text.mkP(escaper.getPlayer(), 'clear mobs deleting on')
            return true
        },
    })

    //-setClearMobEffect(setcme) <effectPath>
    registerCommand({
        name: 'setClearMobEffect',
        alias: ['setcme'],
        group,
        argDescription: '<effectPath>',
        description: 'Set special effect to play when stepping on clear mob trigger',
        cb: ({ nbParam, param1 }, escaper) => {
            if (!(nbParam === 1)) {
                return true
            }
            escaper.makeSetClearMobEffect(param1)
            Text.mkP(escaper.getPlayer(), 'Click on the trigger mob to set its effect')
            return true
        },
    })

    //-setBlockMobEffect(setbme) <effectPath>
    registerCommand({
        name: 'setBlockMobEffect',
        alias: ['setbme', 'setClearMobBlockMobEffect', 'setcmbme'],
        group,
        argDescription: '<effectPath>',
        description: 'Set special effect to play on block mobs when clear mob is triggered',
        cb: ({ nbParam, param1 }, escaper) => {
            if (!(nbParam === 1)) {
                return true
            }
            escaper.makeSetBlockMobEffect(param1)
            Text.mkP(escaper.getPlayer(), 'Click on the trigger mob to set its block mob effect')
            return true
        },
    })

    //-setClearMobDisableDuration(setcmdd) <disableDuration>
    registerCommand({
        name: 'setClearMobDisableDuration',
        alias: ['setcmdd'],
        group,
        argDescription: '<disableDuration>',
        description: 'Set the disable duration of the clear mob',
        cb: ({ nbParam, param1 }, escaper) => {
            if (!(nbParam === 1)) {
                return true
            }
            const x = S2R(param1)
            if (x !== 0 && (x > CLEAR_MOB_MAX_DURATION || x < FRONT_MONTANT_DURATION)) {
                Text.erP(
                    escaper.getPlayer(),
                    'the disable duration must be a real between ' +
                        R2S(FRONT_MONTANT_DURATION) +
                        ' and ' +
                        R2S(CLEAR_MOB_MAX_DURATION)
                )
                return true
            }
            escaper.makeSetClearMobDisableDuration(x)
            Text.mkP(escaper.getPlayer(), 'clear mob disable duration setting on')
            return true
        },
    })

    //-createCircleMob [<speed> [<direction> [<radius>]]]
    registerCommand({
        name: 'createCircleMob',
        alias: ['crcim'],
        group,
        argDescription: '[<speed> [<direction> [<facing [<radius>]]]]',
        description: '',
        cb: ({ param1, param2, param3, param4 }, escaper) => {
            if (param1 !== '' && param1 !== '0' && S2I(param1) === 0) {
                Text.erP(escaper.getPlayer(), 'Speed must be > 0')
                return true
            }

            param2 = param2.toLowerCase()

            if (param2 !== '' && param2 !== 'cw' && param2 !== 'ccw') {
                Text.erP(escaper.getPlayer(), 'Direction must be "cw" or "ccw"')
                return true
            }

            if (param3 !== '' && param3 !== 'cw' && param3 !== 'ccw' && param3 !== 'in' && param3 !== 'out') {
                Text.erP(escaper.getPlayer(), 'Facing must be "cw", "ccw", "in" or "out"')
                return true
            }

            if (param4 !== '' && S2I(param4) === 0) {
                Text.erP(escaper.getPlayer(), 'Radius must be > 0')
                return true
            }

            Text.mkP(escaper.getPlayer(), 'Circle creation on. First click on the center mob')

            escaper.makeCreateCircleMob(
                param1 === '' ? null : S2I(param1),
                param2 === '' ? null : param2,
                param3 === '' ? null : param3,
                param4 === '' ? null : S2I(param4)
            )

            return true
        },
    })

    //-deleteCircleMob
    registerCommand({
        name: 'deleteCircleMob',
        alias: ['delcim'],
        group,
        argDescription: '',
        description: '',
        cb: ({ noParam }, escaper) => {
            if (!noParam) {
                return true
            }
            escaper.makeDeleteCircleMob()
            Text.mkP(escaper.getPlayer(), 'circles deleting on')
            return true
        },
    })

    //-setCircleMobSpeed(setcims) <speed>
    registerCommand({
        name: 'setCircleMobSpeed',
        alias: ['setcims'],
        group,
        argDescription: '<speed>',
        description: '',
        cb: ({ param1 }, escaper) => {
            if (param1 !== '0' && S2R(param1) == 0) {
                Text.erP(escaper.getPlayer(), 'Speed must be > 0')
                return true
            }

            escaper.makeSetCircleMobSpeed(S2R(param1))
            Text.mkP(escaper.getPlayer(), 'Click on the circle to apply')
            return true
        },
    })

    //-setCircleMobDirection(setcimd) <direction>
    registerCommand({
        name: 'setCircleMobDirection',
        alias: ['setcimd'],
        group,
        argDescription: 'cw | ccw',
        description: 'Clockwise of counter-clockwise',
        cb: ({ param1 }, escaper) => {
            param1 = param1.toLowerCase()
            if (param1 !== 'cw' && param1 !== 'ccw') {
                Text.erP(escaper.getPlayer(), 'Direction must be "cw" or "ccw"')
                return true
            }

            escaper.makeSetCircleMobDirection(param1)
            Text.mkP(escaper.getPlayer(), 'Click on the circle to apply')
            return true
        },
    })

    //-setCircleMobFacing(setcimf) <facing>
    registerCommand({
        name: 'setCircleMobFacing',
        alias: ['setcimf'],
        group,
        argDescription: 'cw | ccw | in | out',
        description: 'In or out of the circle',
        cb: ({ param1 }, escaper) => {
            param1 = param1.toLowerCase()
            if (param1 !== 'cw' && param1 !== 'ccw' && param1 !== 'in' && param1 !== 'out') {
                Text.erP(escaper.getPlayer(), 'Facing must be "cw", "ccw", "in" or "out"')
                return true
            }

            escaper.makeSetCircleMobFacing(param1)
            Text.mkP(escaper.getPlayer(), 'Click on the circle to apply')
            return true
        },
    })

    //-setCircleMobShape(setcimsh) <shape>
    registerCommand({
        name: 'setCircleMobShape',
        alias: ['setcimsh'],
        group,
        argDescription:
            'circle | square | triangle | pentagon | hexagon | octagon | eight | star | spiral | heart | infinity | rose | butterfly',
        description: 'Shape of the CircleMob formation',
        cb: ({ param1 }, escaper) => {
            param1 = param1.toLowerCase()
            const validShapes = [
                'circle',
                'square',
                'triangle',
                'pentagon',
                'hexagon',
                'octagon',
                'eight',
                'star',
                'spiral',
                'heart',
                'infinity',
                'rose',
                'butterfly',
            ]
            if (!validShapes.includes(param1)) {
                Text.erP(
                    escaper.getPlayer(),
                    'Shape must be one of: circle, square, triangle, pentagon, hexagon, octagon, eight, star, spiral, heart, infinity, rose, butterfly'
                )
                return true
            }

            escaper.makeSetCircleMobShape(param1 as any)
            Text.mkP(escaper.getPlayer(), 'Click on the circle to apply')
            return true
        },
    })

    //-setCircleMobInitialAngle(setcimia) <angle>
    registerCommand({
        name: 'setCircleMobInitialAngle',
        alias: ['setcimia'],
        group,
        argDescription: '<angle>',
        description: '',
        cb: ({ param1 }, escaper) => {
            const angle = convertTextToAngle(param1)

            if (!angle) {
                Text.erP(escaper.getPlayer(), 'Angle must be > 0 and <= 360')
                return true
            }

            escaper.makeSetCircleMobInitialAngle(angle)
            Text.mkP(escaper.getPlayer(), 'Click on the circle to apply')
            return true
        },
    })

    //-setCircleMobRadius(setcimr) <radius>
    registerCommand({
        name: 'setCircleMobRadius',
        alias: ['setcimr'],
        group,
        argDescription: '<radius>',
        description: '',
        cb: ({ param1 }, escaper) => {
            if (S2I(param1) <= 0) {
                Text.erP(escaper.getPlayer(), 'Radius must be > 0')
                return true
            }

            escaper.makeSetCircleMobRadius(S2I(param1))
            Text.mkP(escaper.getPlayer(), 'Click on the circle to apply')
            return true
        },
    })

    //-setMonsterJumpPad(setmjp) <jumpPadZ>
    registerCommand({
        name: 'setMonsterJumpPad',
        alias: ['setmjp'],
        group,
        argDescription: '<jumpPadZ>',
        description: '',
        cb: ({ param1 }, escaper) => {
            if (!(S2I(param1) > 0 && S2I(param1) <= 100)) {
                Text.erP(escaper.getPlayer(), 'JumpPad must be > 0 and <= 100')
                return true
            }

            escaper.makeSetMonsterJumpPad(S2I(param1) === 0 ? undefined : S2I(param1))

            Text.mkP(escaper.getPlayer(), 'Click on a monster to apply')
            return true
        },
    })

    //-setMonsterJumpPadEffect(setmjpe) <jumpPadEffect>
    registerCommand({
        name: 'setMonsterJumpPadEffect',
        alias: ['setmjpe'],
        group,
        argDescription: '[jumpPadEffect]',
        description: '',
        cb: ({ param1 }, escaper) => {
            escaper.makeSetMonsterJumpPadEffect(param1)

            Text.mkP(escaper.getPlayer(), 'Click on a monster to apply')
            return true
        },
    })

    //-setMonsterAttackGround(setmag) [<delay>]
    registerCommand({
        name: 'setMonsterAttackGround',
        alias: ['setmag'],
        group,
        argDescription: '[<delay>]',
        description: 'Set monster to attack ground with optional delay',
        cb: ({ param1 }, escaper) => {
            const delay = param1 !== '' ? S2R(param1) : 0

            if (param1 && (delay < 0 || delay > 60)) {
                Text.erP(escaper.getPlayer(), 'Delay must be between 0 and 60 seconds')
                return true
            }

            escaper.makeSetMonsterAttackGroundOrder(delay)

            Text.mkP(escaper.getPlayer(), 'Click on a monster to apply')
            return true
        },
    })
}
