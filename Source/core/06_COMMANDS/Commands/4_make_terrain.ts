import { getUdgTerrainTypes } from '../../../../globals'
import { ServiceManager } from '../../../Services'
import { IsBoolString, S2B } from '../../01_libraries/Basic_functions'
import { Constants } from '../../01_libraries/Constants'
import { IsInteger, IsPositiveInteger } from '../../01_libraries/Functions_on_numbers'
import { udg_colorCode } from '../../01_libraries/Init_colorCodes'
import { Text } from '../../01_libraries/Text'
import { DEATH_TERRAIN_MAX_TOLERANCE, TerrainTypeDeath } from '../../04_STRUCTURES/TerrainType/TerrainTypeDeath'
import { TerrainTypeSlide } from '../../04_STRUCTURES/TerrainType/TerrainTypeSlide'
import { TerrainTypeWalk } from '../../04_STRUCTURES/TerrainType/TerrainTypeWalk'
import { TerrainTypeFromString } from '../../07_TRIGGERS/Modify_terrain_Functions/Terrain_type_from_string'
import { HERO_ROTATION_SPEED } from '../../07_TRIGGERS/Slide_and_CheckTerrain_triggers/SlidingMax'
import { ChangeAllTerrains } from '../../07_TRIGGERS/Triggers_to_modify_terrains/Change_all_terrains'
import { ChangeOneTerrain } from '../../07_TRIGGERS/Triggers_to_modify_terrains/Change_one_terrain'
import { ExchangeTerrains } from '../../07_TRIGGERS/Triggers_to_modify_terrains/Exchange_terrains'
import { RandomizeTerrains } from '../../07_TRIGGERS/Triggers_to_modify_terrains/Randomize_terrains'

export const initExecuteCommandMake_terrain = () => {
    const { registerCommand } = ServiceManager.getService('Cmd')
    const group = 'make'

    //-newWalk(neww) <label> <terrainType> [<walkSpeed>]   --> add a new kind of walk terrain
    registerCommand({
        name: 'newWalk',
        alias: ['neww'],
        group,
        argDescription: '<label> <terrainType> [<walkSpeed>]',
        description: 'Add a new kind of walk terrain',
        cb: ({ nbParam, param1, param2, param3 }, escaper) => {
            if (nbParam < 2 || nbParam > 3) {
                return true
            }

            let speed = 0

            if (nbParam === 3) {
                if (!IsPositiveInteger(param3) || S2R(param3) > 522) {
                    Text.erP(escaper.getPlayer(), 'wrong speed value, should be a real between 0 and 522')
                    return true
                }
                speed = S2R(param3)
            } else {
                speed = Constants.HERO_WALK_SPEED
            }

            getUdgTerrainTypes().newWalk(param1, TerrainTypeFromString.TerrainTypeString2TerrainTypeId(param2), speed)

            Text.mkP(escaper.getPlayer(), 'New terrain type "' + param1 + '" added')

            return true
        },
    })

    //-newDeath(newd) <label> <terrainType> [<killingEffect> [<terrainTimeToKill>]]   --> add a new kind of death terrain
    registerCommand({
        name: 'newDeath',
        alias: ['newd'],
        group,
        argDescription: '<label> <terrainType> [<killingEffect> [<terrainTimeToKill>]]',
        description: 'Add a new kind of death terrain',
        cb: ({ nbParam, param1, param2, param3, param4 }, escaper) => {
            if (nbParam < 2 || nbParam > 4) {
                return true
            }

            let str = ''
            let x = 0

            if (nbParam >= 3) {
                str = param3
            } else {
                str = ''
            }
            if (nbParam === 4) {
                if (param4 !== '0' && S2R(param4) === 0) {
                    return true
                }
                x = S2R(param4)
            } else {
                x = Constants.TERRAIN_DEATH_TIME_TO_KILL
            }

            getUdgTerrainTypes().newDeath(
                param1,
                TerrainTypeFromString.TerrainTypeString2TerrainTypeId(param2),
                str,
                x,
                0
            )

            Text.mkP(escaper.getPlayer(), 'New terrain type "' + param1 + '" added')

            return true
        },
    })

    //-newSlide(news) <label> <terrainType> [<slideSpeed> [<canTurn>]]   --> add a new kind of slide terrain
    registerCommand({
        name: 'newSlide',
        alias: ['news'],
        group,
        argDescription: '<label> <terrainType> [<slideSpeed> [<canTurn>]]',
        description: 'Add a new kind of slide terrain',
        cb: ({ nbParam, param1, param2, param3, param4 }, escaper) => {
            if (nbParam < 2 || nbParam > 4) {
                return true
            }

            let speed = 0
            let b = false

            if (nbParam >= 3) {
                if (!IsInteger(param3)) {
                    Text.erP(escaper.getPlayer(), 'the slide speed must be an integer')
                    return true
                }
                speed = S2R(param3)
            } else {
                speed = Constants.HERO_SLIDE_SPEED
            }
            if (nbParam === 4) {
                if (!IsBoolString(param4)) {
                    Text.erP(escaper.getPlayer(), 'the property "canTurn" must be a boolean (true or false)')
                    return true
                }
                b = S2B(param4)
            } else {
                b = true
            }

            getUdgTerrainTypes().newSlide(
                param1,
                TerrainTypeFromString.TerrainTypeString2TerrainTypeId(param2),
                speed,
                b
            )

            Text.mkP(escaper.getPlayer(), 'New terrain type "' + param1 + '" added')

            return true
        },
    })

    //-setTerrainLabel(settl) <oldTerrainLabel> <newTerrainLabel>
    registerCommand({
        name: 'setTerrainLabel',
        alias: ['settl'],
        group,
        argDescription: '<oldTerrainLabel> <newTerrainLabel>',
        description: 'Change the label of a terrain type',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (!(nbParam === 2)) {
                return true
            }
            let b = !!getUdgTerrainTypes().getByLabel(param1)
            if (b) {
                b = !getUdgTerrainTypes().isLabelAlreadyUsed(param2)
            }
            if (b) {
                getUdgTerrainTypes().getByLabel(param1)?.setLabel(param2)
                Text.mkP(escaper.getPlayer(), 'label changed to "' + param2 + '"')
            } else {
                Text.erP(escaper.getPlayer(), 'impossible to change label')
            }
            return true
        },
    })

    //-setTerrainAlias(setta) <terrainLabel> <alias>   --> an alias is a shortcut which can be used like a label
    registerCommand({
        name: 'setTerrainAlias',
        alias: ['setta'],
        group,
        argDescription: '<terrainLabel> <alias>',
        description: 'An alias is a shortcut which can be used like a label',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (!(nbParam === 2)) {
                return true
            }
            let b = !!getUdgTerrainTypes().getByLabel(param1)
            if (b) {
                b = !getUdgTerrainTypes().isLabelAlreadyUsed(param2)
            }
            if (b) {
                getUdgTerrainTypes().getByLabel(param1)?.setAlias(param2)
                Text.mkP(escaper.getPlayer(), 'Alias changed to "' + param2 + '"')
            } else {
                Text.erP(escaper.getPlayer(), 'Impossible to change alias')
            }
            return true
        },
    })

    //-setTerrainWalkSpeed(settws) <walkTerrainLabel> <walkSpeed>   --> max walk speed : 522
    registerCommand({
        name: 'setTerrainWalkSpeed',
        alias: ['settws'],
        group,
        argDescription: '<walkTerrainLabel> <walkSpeed>',
        description: 'Max walk speed : 522',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (!(nbParam === 2)) {
                return true
            }
            const terrainType = getUdgTerrainTypes().getByLabel(param1)
            if (!terrainType) {
                Text.erP(escaper.getPlayer(), 'Unknown terrain')
                return true
            }
            if (!(terrainType instanceof TerrainTypeWalk)) {
                Text.erP(escaper.getPlayer(), 'The terrain must be of walk type')
                return true
            }
            if (!IsPositiveInteger(param2) || S2R(param2) > 522) {
                Text.erP(escaper.getPlayer(), 'Wrong speed value, should be a real between 0 and 522')
                return true
            }
            terrainType.setWalkSpeed(S2R(param2))
            Text.mkP(escaper.getPlayer(), 'Terrain walk speed changed')
            return true
        },
    })

    //-setTerrainKillEffect(settke) <deathTerrainLabel> <killingEffect>   --> special effect appearing when a hero touch the death terrain
    registerCommand({
        name: 'setTerrainKillEffect',
        alias: ['settke'],
        group,
        argDescription: '<deathTerrainLabel> <killingEffect>',
        description: 'Special effect appearing when a hero touch the death terrain',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (!(nbParam === 2)) {
                return true
            }
            const terrainType = getUdgTerrainTypes().getByLabel(param1)
            if (!terrainType) {
                Text.erP(escaper.getPlayer(), 'Unknown terrain')
                return true
            }
            if (!(terrainType instanceof TerrainTypeDeath)) {
                Text.erP(escaper.getPlayer(), 'The terrain must be of death type')
                return true
            }
            terrainType.setKillingEffectStr(param2)
            Text.mkP(escaper.getPlayer(), 'Terrain kill effect changed')
            return true
        },
    })

    //-setTerrainKillDelay(settkd) <deathTerrainLabel> <killingDelay>   --> time before which the hero dies when he touch the death terrain
    registerCommand({
        name: 'setTerrainKillDelay',
        alias: ['settkd'],
        group,
        argDescription: '<deathTerrainLabel> <killingDelay>',
        description: 'Time before which the hero dies when he touch the death terrain',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (!(nbParam === 2)) {
                return true
            }
            const terrainType = getUdgTerrainTypes().getByLabel(param1)
            if (!terrainType) {
                Text.erP(escaper.getPlayer(), 'unknown terrain')
                return true
            }
            if (!(terrainType instanceof TerrainTypeDeath)) {
                Text.erP(escaper.getPlayer(), 'the terrain must be of death type')
                return true
            }
            if (param2 !== '0' && S2R(param2) === 0) {
                Text.erP(escaper.getPlayer(), 'wrong delay value')
                return true
            }
            terrainType.setTimeToKill(S2R(param2))
            Text.mkP(escaper.getPlayer(), 'terrain kill delay changed')
            return true
        },
    })

    //-setTerrainKillTolerance(settkt) <deathTerrainLabel> <tolerance dist>   --> max distance to the closest non death terrain, where heroes won't die
    registerCommand({
        name: 'setTerrainKillTolerance',
        alias: ['settkt'],
        group,
        argDescription: '<deathTerrainLabel> <tolerance dist>',
        description: "max distance to the closest non death terrain, where heroes won't die",
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (!(nbParam === 2)) {
                return true
            }
            const terrainType = getUdgTerrainTypes().getByLabel(param1)
            if (!terrainType) {
                Text.erP(escaper.getPlayer(), 'unknown terrain')
                return true
            }
            if (!(terrainType instanceof TerrainTypeDeath)) {
                Text.erP(escaper.getPlayer(), 'the terrain must be of death type')
                return true
            }
            if (param2 !== '0' && S2R(param2) === 0) {
                Text.erP(escaper.getPlayer(), 'wrong tolerance value')
                return true
            }
            if (terrainType.setToleranceDist(S2R(param2))) {
                Text.mkP(escaper.getPlayer(), 'tolerance distance changed')
            } else {
                Text.erP(escaper.getPlayer(), 'tolerance must be between 0 and ' + R2S(DEATH_TERRAIN_MAX_TOLERANCE))
            }
            return true
        },
    })

    //-setTerrainSlideSpeed(settss) <slideTerrainLabel> <slideSpeed>
    registerCommand({
        name: 'setTerrainSlideSpeed',
        alias: ['settss'],
        group,
        argDescription: '<slideTerrainLabel> <slideSpeed>',
        description: 'Max slide speed : 522',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (!(nbParam === 2)) {
                return true
            }
            const terrainType = getUdgTerrainTypes().getByLabel(param1)
            if (!terrainType) {
                Text.erP(escaper.getPlayer(), 'unknown terrain')
                return true
            }
            if (!(terrainType instanceof TerrainTypeSlide)) {
                Text.erP(escaper.getPlayer(), 'the terrain must be of slide type')
                return true
            }
            if (!IsInteger(param2)) {
                Text.erP(escaper.getPlayer(), 'wrong speed value')
                return true
            }
            terrainType.setSlideSpeed(S2R(param2))
            Text.mkP(escaper.getPlayer(), 'terrain slide speed changed')
            return true
        },
    })

    //-setTerrainRotationSpeed(settrs) <slideTerrainLabel> <rotationSpeed>
    registerCommand({
        name: 'setTerrainRotationSpeed',
        alias: ['settrs'],
        group,
        argDescription: '<slideTerrainLabel> <rotationSpeed>',
        description:
            'You have to specify rounds per second. Example : 1.3. Normal speed is 1; You can specify "default" | "d".',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (!(nbParam === 2)) {
                return true
            }
            const terrainType = getUdgTerrainTypes().getByLabel(param1)
            if (!terrainType) {
                Text.erP(escaper.getPlayer(), 'unknown terrain')
                return true
            }
            if (!(terrainType instanceof TerrainTypeSlide)) {
                Text.erP(escaper.getPlayer(), 'the terrain must be of slide type')
                return true
            }

            let speed: number
            if (param2 == 'd' || param2 == 'default') {
                speed = HERO_ROTATION_SPEED
            } else if (S2R(param2) <= 0) {
                Text.erP(escaper.getPlayer(), 'the rotation speed must be positive')
                return true
            } else {
                speed = S2R(param2)
            }

            terrainType.setRotationSpeed(speed)
            Text.mkP(escaper.getPlayer(), 'terrain rotation speed changed')
            return true
        },
    })

    //-setTerrainGravity(settg) <terrainLabel> <gravity>
    registerCommand({
        name: 'setTerrainGravity',
        alias: ['settg'],
        group,
        argDescription: '<terrainLabel> <gravity>',
        description: '',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (!(nbParam === 2) || (S2R(param2) === 0 && param2 !== '0')) {
                return true
            }

            const terrainType = getUdgTerrainTypes().getByLabel(param1)

            if (!terrainType) {
                Text.erP(escaper.getPlayer(), 'unknown terrain')
                return true
            }

            terrainType.setGravity(S2R(param2))
            Text.mkP(escaper.getPlayer(), 'terrain gravity changed')
            return true
        },
    })

    //-setTerrainCanTurn(settct) <slideTerrainLabel> <canTurn>
    registerCommand({
        name: 'setTerrainCanTurn',
        alias: ['settct'],
        group,
        argDescription: '<slideTerrainLabel> <canTurn>',
        description: 'Can the hero turn when he slide on the terrain',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (!(nbParam === 2)) {
                return true
            }
            const terrainType = getUdgTerrainTypes().getByLabel(param1)
            if (!terrainType) {
                Text.erP(escaper.getPlayer(), 'unknown terrain')
                return true
            }
            if (!(terrainType instanceof TerrainTypeSlide)) {
                Text.erP(escaper.getPlayer(), 'the terrain must be of slide type')
                return true
            }
            if (!IsBoolString(param2)) {
                Text.erP(escaper.getPlayer(), 'the property "canTurn" must be a boolean (true or false)')
                return true
            }
            if (terrainType.setCanTurn(S2B(param2))) {
                if (S2B(param2)) {
                    Text.mkP(escaper.getPlayer(), 'the heroes can now turn on this slide terrain')
                } else {
                    Text.mkP(escaper.getPlayer(), "the heroes can't turn on this slide terrain anymore")
                }
            } else {
                if (S2B(param2)) {
                    Text.erP(escaper.getPlayer(), 'the heroes can already turn on this slide terrain')
                } else {
                    Text.erP(escaper.getPlayer(), "the heroes already can't turn on this slide terrain")
                }
            }
            return true
        },
    })

    //-changeTerrain(cht) <terrainLabel> <newTerrainType>   --> examples of terrain types : 'Nice', 46
    registerCommand({
        name: 'changeTerrain',
        alias: ['cht'],
        group,
        argDescription: '<terrainLabel> <newTerrainType>',
        description: "change the terrain type of a terrain, examples of terrain types : 'Nice', 46",
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (!(nbParam === 2)) {
                return true
            }
            Text.DisplayLineToPlayer(escaper.getPlayer())
            const str = ChangeOneTerrain.ChangeOneTerrain(param1, param2)
            if (str !== null) {
                Text.mkP(escaper.getPlayer(), 'changed to ' + udg_colorCode[Constants.RED] + str)
            } else {
                Text.erP(escaper.getPlayer(), "couldn't change terrain")
            }
            return true
        },
    })

    //-changeAllTerrains(chat) [known(k)|notKnown(nk)]
    registerCommand({
        name: 'changeAllTerrains',
        alias: ['chat'],
        group,
        argDescription: '[known(k)|notKnown(nk)]',
        description: 'Change all terrains to a random terrain type, or to a terrain type known to the player',
        cb: ({ noParam, nbParam, param1 }, escaper) => {
            let str = ''

            if (noParam) {
                str = 'normal'
            } else {
                if (nbParam === 1) {
                    if (param1 === 'known' || param1 === 'k') {
                        str = 'known'
                    } else {
                        if (param1 === 'notKnown' || param1 === 'nk') {
                            str = 'notKnown'
                        } else {
                            return true
                        }
                    }
                }
            }
            if (!ChangeAllTerrains.ChangeAllTerrains(str)) {
                Text.erP(escaper.getPlayer(), "couldn't change terrains")
            }
            return true
        },
    })

    //-changeAllTerrainsAtRevive(chatar) <boolean change>
    registerCommand({
        name: 'changeAllTerrainsAtRevive',
        alias: ['chatar'],
        group,
        argDescription: '<boolean change>',
        description: 'Change all terrains to a random terrain type',
        cb: ({ nbParam, param1 }, escaper) => {
            if (
                nbParam === 1 &&
                IsBoolString(param1) &&
                S2B(param1) !== ChangeAllTerrains.udg_changeAllTerrainsAtRevive
            ) {
                ChangeAllTerrains.udg_changeAllTerrainsAtRevive = S2B(param1)
                Text.mkP(escaper.getPlayer(), 'change all terrains at revive ' + StringCase(param1, true))
            }
            return true
        },
    })

    //-exchangeTerrains(excht) [<terrainLabelA> <terrainLabelB>]   --> without parameter, click on the terrains to exchange them
    registerCommand({
        name: 'exchangeTerrains',
        alias: ['excht'],
        group,
        argDescription: '[<terrainLabelA> <terrainLabelB>]',
        description: 'Exchange two terrains, without parameter, click on the terrains to exchange them',
        cb: ({ noParam, nbParam, param1, param2 }, escaper) => {
            if (noParam) {
                escaper.makeExchangeTerrains()
                Text.mkP(escaper.getPlayer(), 'exchange terrains on')
                return true
            }
            if (!(nbParam === 2)) {
                return true
            }
            if (ExchangeTerrains(param1, param2)) {
                Text.mkP(escaper.getPlayer(), 'terrains exchanged')
            } else {
                Text.erP(escaper.getPlayer(), "couldn't exchange terrains")
            }
            return true
        },
    })

    //-randomizeTerrains(rdmt)
    registerCommand({
        name: 'randomizeTerrains',
        alias: ['rdmt'],
        group,
        argDescription: '',
        description: 'Randomize terrains',
        cb: ({ noParam }) => {
            if (noParam) {
                RandomizeTerrains.RandomizeTerrains()
            }
            return true
        },
    })

    //-createTerrain(crt) <terrainLabel> [<brushSize> [<shape>]]  --> create the terrain on the map, by clicking
    registerCommand({
        name: 'createTerrain',
        alias: ['crt'],
        group,
        argDescription: '<terrainLabel> [<brushSize> [<shape>]',
        description: 'Create the terrain on the map, by clicking',
        cb: ({ nbParam, param1, param2, param3 }, escaper) => {
            if (nbParam < 1 || nbParam > 3) {
                return true
            }

            const terrainType = getUdgTerrainTypes().getByLabel(param1)
            if (!terrainType) {
                Text.erP(escaper.getPlayer(), 'terrain "' + param1 + '" doesn\'t exist')
            } else {
                if (nbParam > 1) {
                    //brush mode
                    //param2 : brush size
                    const brushSize = S2I(param2)
                    if (brushSize < 1 || brushSize > 8) {
                        Text.erP(escaper.getPlayer(), 'brush size has to be between 1 and 8')
                    } else {
                        let shape: 'circle' | 'square' = 'square'
                        if (param3 == 'circle' || param3 == 'c') {
                            shape = 'circle'
                        }
                        escaper.makeCreateTerrainBrush(terrainType, brushSize, shape)
                    }
                } else {
                    //classic two clicks mode
                    escaper.makeCreateTerrain(terrainType)
                }
                Text.mkP(escaper.getPlayer(), 'creating terrain on')
            }
            return true
        },
    })

    //-setBrushSize <brushSize>
    registerCommand({
        name: 'setBrushSize',
        alias: ['setbs'],
        group,
        argDescription: '<brushSize>',
        description: 'Sets the brush size',
        cb: ({ nbParam, param1 }, escaper) => {
            if (nbParam != 1) {
                return true
            }

            const brushSize = S2I(param1)
            if (brushSize < 1 || brushSize > 8) {
                Text.erP(escaper.getPlayer(), 'brush size has to be between 1 and 8')
            } else {
                escaper.setBrushSize(brushSize)
                Text.mkP(escaper.getPlayer(), 'brush size set')
            }

            return true
        },
    })

    //-setGumTerrain <terrainLabel>
    registerCommand({
        name: 'setGumTerrain',
        alias: ['setgt'],
        group,
        argDescription: '<terrainLabel>',
        description: 'Sets the gum terrain',
        cb: ({ nbParam, param1 }, escaper) => {
            if (nbParam != 1) {
                return true
            }

            const terrainType = getUdgTerrainTypes().getByLabel(param1)
            if (!terrainType) {
                Text.erP(escaper.getPlayer(), 'terrain "' + param1 + '" doesn\'t exist')
            } else {
                escaper.setGumTerrain(terrainType)
                Text.mkP(escaper.getPlayer(), 'gum terrain set')
            }

            return true
        },
    })

    //-setGumBrushSize <brushSize>
    registerCommand({
        name: 'setGumBrushSize',
        alias: ['setgbs'],
        group,
        argDescription: '<brushSize>',
        description: 'Set the gum brush size',
        cb: ({ nbParam, param1 }, escaper) => {
            if (nbParam != 1) {
                return true
            }

            const brushSize = S2I(param1)
            if (brushSize < 1 || brushSize > 8) {
                Text.erP(escaper.getPlayer(), 'brush size has to be between 1 and 8')
            } else {
                escaper.setGumBrushSize(brushSize)
                Text.mkP(escaper.getPlayer(), 'gum brush size set')
            }

            return true
        },
    })

    //-copyPasteTerrain(cpt)   --> copy paste a rectangle of terrain on the map
    registerCommand({
        name: 'copyPasteTerrain',
        alias: ['cpt'],
        group,
        argDescription: '',
        description: 'Copy paste a rectangle of terrain on the map',
        cb: ({ noParam }, escaper) => {
            if (noParam) {
                escaper.makeTerrainCopyPaste()
                Text.mkP(escaper.getPlayer(), 'copy/paste terrain on')
            }
            return true
        },
    })

    //-verticalSymmetryTerrain(vst)   --> transform a rectangle of terrain by a vertical symmetry
    registerCommand({
        name: 'verticalSymmetryTerrain',
        alias: ['vst'],
        group,
        argDescription: '',
        description: 'Transform a rectangle of terrain by a vertical symmetry',
        cb: ({ noParam }, escaper) => {
            if (noParam) {
                escaper.makeTerrainVerticalSymmetry()
                Text.mkP(escaper.getPlayer(), 'vertical symmetry terrain on')
            }
            return true
        },
    })

    //-horizontalSymmetryTerrain(hst)   --> transform a rectangle of terrain by an horizontal symmetry
    registerCommand({
        name: 'horizontalSymmetryTerrain',
        alias: ['hst'],
        group,
        argDescription: '',
        description: 'Transform a rectangle of terrain by an horizontal symmetry',
        cb: ({ noParam }, escaper) => {
            if (noParam) {
                escaper.makeTerrainHorizontalSymmetry()
                Text.mkP(escaper.getPlayer(), 'horizontal symmetry terrain on')
            }
            return true
        },
    })

    //-terrainHeight(th) [<terrainRadius> [<height>]]   --> apply a terrain height at chosen places ; default radius 100, default height 100
    registerCommand({
        name: 'terrainHeight',
        alias: ['th'],
        group,
        argDescription: ' [<terrainRadius> [<height>]]',
        description: 'Apply a terrain height at chosen places ; default radius 100, default height 100',
        cb: ({ nbParam, param1, param2 }, escaper) => {
            if (!(nbParam <= 2)) {
                return true
            }

            let x = 0
            let y = 0

            if (nbParam === 2) {
                y = S2R(param2)
                if (y === 0 && param2 !== '0') {
                    Text.erP(escaper.getPlayer(), 'param2 (height) must be a real')
                    return true
                }
                if (y === 0) {
                    Text.erP(escaper.getPlayer(), "param2 (height) can't be 0")
                    return true
                }
            } else {
                y = 100
            }
            if (nbParam >= 1) {
                x = S2R(param1)
                if (x === 0 && param1 !== '0') {
                    Text.erP(escaper.getPlayer(), 'param1 (radius) must be a real')
                    return true
                }
                if (x <= 0) {
                    Text.erP(escaper.getPlayer(), 'param1 (radius) must be higher than 0')
                    return true
                }
            } else {
                x = 100
            }
            escaper.makeTerrainHeight(x, y)
            Text.mkP(escaper.getPlayer(), 'terrain height making')
            return true
        },
    })

    //-displayTerrains(dt) [<terrainLabel>] [page]   --> displays the characteristics of the terrains added by the maker(s)
    registerCommand({
        name: 'displayTerrains',
        alias: ['dt'],
        group,
        argDescription: ' [<terrainLabel>] [page]',
        description: 'Displays the characteristics of the terrains added by the maker(s)',
        cb: ({ cmd }, escaper) => {
            getUdgTerrainTypes().displayPaginatedForPlayer(escaper.getPlayer(), cmd)
            return true
        },
    })
}
