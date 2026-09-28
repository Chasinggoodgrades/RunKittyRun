import { getUdgEscapers, getUdgLevels } from '../../../../globals'
import { MemoryHandler } from '../../../Utils/MemoryHandler'
import { forRange, runInTrigger } from '../../../Utils/mapUtils'
import { arrayPush, IsBoolString, S2B, stringReplaceAll } from '../../01_libraries/Basic_functions'
import { Constants } from '../../01_libraries/Constants'
import { ColorString2Id } from '../../01_libraries/Init_colorCodes'
import { Escaper } from '../../04_STRUCTURES/Escaper/Escaper'
import { TerrainTypeWalk } from '../../04_STRUCTURES/TerrainType/TerrainTypeWalk'
import { HERO_START_ANGLE } from '../../08_GAME/Init_game/Heroes'
import { DeplacementHeroHorsDeathPath } from '../../08_GAME/Mode_coop/deplacement_heros_hors_death_path'
import { Natives } from '../../wc3_natives_unsecured/Natives'

// A command's cb can return this instead of true when the parameters are wrong, instead of building/printing
// its own "wrong parameters"/usage text - ExecuteCommandSingle (Command_execution.ts) then displays a generic
// "Usage: -name argDescription" message using the command's own registered fields, so it can never drift out
// of sync with argDescription and every command gets consistent wording for free.
// Deliberately defined here, not in Command_execution.ts: that file imports every Commands/*.ts module, so a
// command file importing USAGE back from it would be a circular require - this file has no such back-edge.
export const USAGE = 'USAGE' as const

export const rawPlayerNames: string[] = []

const cachedPlayerNames: { [x: string]: number } = {}

export const removeHash = (name: string) => {
    const i = name.indexOf('#')

    if (i === -1) {
        return name
    }

    return name.substring(0, i)
}

export const initCachedPlayerNames = () => {
    forRange(24, i => {
        cachedPlayerNames[
            removeHash(stringReplaceAll(' ', '_', Natives.UGetPlayerName(Natives.UPlayer(i)).toLowerCase()))
        ] = i
        rawPlayerNames.push(Natives.UGetPlayerName(Natives.UPlayer(i)))
    })
}

//gives the name of the entered command  ////the name of the entered command is <command_name>
export const CmdName = (str: string): string => {
    let length = StringLength(str)
    let outputStr = ''
    let car: string
    let i = 0

    if (SubString(str, 0, 1) === '-' && length > 1) {
        car = SubString(str, 1, 2) ?? ''
        i = 1
        while (true) {
            if (i >= length || car === ' ') break
            outputStr = outputStr + car
            i = i + 1
            car = SubString(str, i, i + 1) ?? ''
        }
    }
    if (StringLength(outputStr) >= 1) {
        return outputStr
    }

    return ''
}

export const IsCmd = (str: string): boolean => {
    return CmdName(str) !== ''
}

//gives the parameter number 'paramNumber' of the entered command : <paramX>
export const CmdParam = (str: string, paramNumber: number): string => {
    let length = StringLength(str)
    let nameLength = StringLength(CmdName(str))
    let outputStr: string = ''
    let char: string
    let i = 0
    let currentParamNumber = 1
    let lastSpaceFound_pos = nameLength + 2

    if (!IsCmd(str)) {
        return ''
    }

    i = lastSpaceFound_pos + 1

    if (paramNumber === 0) {
        return SubStringBJ(str, i, length) ?? ''
    }

    while (true) {
        if (currentParamNumber === paramNumber || i > length) break
        char = SubStringBJ(str, i, i) ?? ''
        if (char === ' ' && i - 1 === lastSpaceFound_pos) {
            return ''
        }
        if (char === ' ') {
            lastSpaceFound_pos = i
            currentParamNumber = currentParamNumber + 1
        }
        i = i + 1
    }

    if (currentParamNumber === paramNumber) {
        while (true) {
            if (i > length) break
            char = SubStringBJ(str, i, i) ?? ''
            if (char === ' ') break
            outputStr = outputStr + char
            i = i + 1
        }
        return outputStr
    }
    return ''
}

export const NbParam = (str: string): number => {
    let i = 1
    while (CmdParam(str, i) !== '') {
        i = i + 1
    }
    return i - 1
}

export const NoParam = (str: string): boolean => {
    return CmdParam(str, 0) === ''
}

export const IsColorString = (colorString: string): boolean => {
    return ColorString2Id(colorString) >= 0
}

export const IsPlayerColorString = (colorString: string): boolean => {
    return ColorString2Id(colorString) >= 0 && ColorString2Id(colorString) <= Constants.NB_PLAYERS_MAX
}

export const isPlayerId = (arg: string) => {
    try {
        return !!resolvePlayerId(arg)
    } catch {
        return false
    }
}

const blzColors2ids = new Map<playercolor, number>()

for (let i = 0; i < Constants.NB_PLAYERS_MAX_REFORGED; i++) {
    blzColors2ids.set(Natives.UConvertPlayerColor(i), i)
}

export const BlzColor2Id = (color: playercolor) => {
    return blzColors2ids.get(color)
}

export function colorId2playerId(colorId: number) {
    for (let i = 0; i < Constants.NB_PLAYERS_MAX; i++) {
        if (BlzColor2Id(GetPlayerColor(Natives.UPlayer(i))) == colorId) {
            return i
        }
    }

    return -1
}

export function playerId2colorId(playerId: number) {
    return BlzColor2Id(GetPlayerColor(Natives.UPlayer(playerId))) || -1
}

export const resolvePlayerId = (arg: string) => {
    const larg = arg.toLowerCase()
    let targetPlayer = -1

    if (larg === 's' || larg === 'sel' || larg === 'select' || larg === 'selected') {
        const a = (getUdgEscapers().get(GetPlayerId(Natives.UGetTriggerPlayer()))?.getSelectedPlayerId() || 0) + 1

        if (a > 0 && a <= Constants.NB_ESCAPERS) {
            targetPlayer = a - 1
        }
    } else if (IsPlayerColorString(larg)) {
        targetPlayer = colorId2playerId(ColorString2Id(larg))
    } else if (S2I(larg) !== 0) {
        const a = S2I(larg)

        if (a > 0 && a <= Constants.NB_ESCAPERS) {
            targetPlayer = colorId2playerId(a - 1)
        }
    } else if (cachedPlayerNames[removeHash(larg)]) {
        return cachedPlayerNames[removeHash(larg)]
    } else if (removeHash(larg).length > 3) {
        const m = MemoryHandler.getEmptyArray<number>()

        for (const [playerName, playerId] of pairs(cachedPlayerNames)) {
            if (playerName.toString().includes(removeHash(larg))) {
                m.push(playerId)
            }
        }

        if (m.length === 1) {
            const playerId = m[0]
            MemoryHandler.destroyArray(m)
            return playerId
        }

        MemoryHandler.destroyArray(m)
    }

    if (targetPlayer === -1) {
        throw `Invalid player: '${arg}'`
    }

    return targetPlayer
}

export const resolvePlayerIdsArray = (arg: string) => {
    const larg = arg.toLowerCase()
    const escapers = MemoryHandler.getEmptyArray<Escaper>()

    if (larg === 'a' || larg === 'all') {
        for (let i = 0; i < Constants.NB_ESCAPERS; i++) {
            const escaper = getUdgEscapers().get(i)

            if (escaper) {
                arrayPush(escapers, escaper)
            }
        }
    } else if (larg === 'ai' || larg === 'computer' || larg === 'computers') {
        for (let i = 0; i < Constants.NB_ESCAPERS; i++) {
            const escaper = getUdgEscapers().get(i)

            if (
                escaper &&
                GetPlayerSlotState(Natives.UPlayer(i)) === PLAYER_SLOT_STATE_PLAYING &&
                GetPlayerController(Natives.UPlayer(i)) === MAP_CONTROL_COMPUTER
            ) {
                arrayPush(escapers, escaper)
            }
        }
    } else if (larg === 'gamer' || larg === 'gamers' || larg === 'player' || larg === 'players') {
        for (let i = 0; i < Constants.NB_ESCAPERS; i++) {
            const escaper = getUdgEscapers().get(i)

            if (
                escaper &&
                GetPlayerSlotState(Natives.UPlayer(i)) === PLAYER_SLOT_STATE_PLAYING &&
                GetPlayerController(Natives.UPlayer(i)) === MAP_CONTROL_USER
            ) {
                arrayPush(escapers, escaper)
            }
        }
    } else if (isPlayerId(arg)) {
        const escaper = getUdgEscapers().get(resolvePlayerId(arg))

        if (escaper) {
            arrayPush(escapers, escaper)
        }
    } else {
        throw `Invalid player: '${arg}'`
    }

    return escapers
}

export const resolvePlayerIds = (arg: string, cb: (targetPlayer: Escaper) => void) => {
    const escapers = resolvePlayerIdsArray(arg)

    for (const escaper of escapers) {
        cb(escaper)
    }

    escapers.__destroy()
}

export const reviveCb = (escaper: Escaper) => escaper.reviveAtStart()

export const revivePositionCb = (escaper: Escaper) => {
    const hero = escaper.getHero()

    if (!hero) {
        return
    }

    if (!escaper.isAlive()) {
        DeplacementHeroHorsDeathPath.DeplacementHeroHorsDeathPath(hero)
        runInTrigger(escaper.coopReviveHero)
    }
}

export const skinCb = (escaper: Escaper, skin: string) => {
    const hero = escaper.getHero()

    if (!hero) {
        return
    }

    const oldSkin = escaper.getSkin()

    if (IsBoolString(skin) && !S2B(skin)) {
        escaper.setSkin(undefined)
    } else {
        escaper.setSkin(FourCC(skin))
    }

    if (oldSkin !== escaper.getSkin()) {
        const x =
            escaper.getLastTerrainType() instanceof TerrainTypeWalk
                ? escaper.getHeroX()
                : getUdgLevels().getCurrentLevel(this).getStartRandomX()

        const y =
            escaper.getLastTerrainType() instanceof TerrainTypeWalk
                ? escaper.getHeroY()
                : getUdgLevels().getCurrentLevel(this).getStartRandomY()

        const a = escaper.getLastTerrainType() instanceof TerrainTypeWalk ? escaper.getHeroFacing() : HERO_START_ANGLE

        escaper.removeHero()
        escaper.createHero(x, y, a)
    }
}

export const abilityCb = (escaper: Escaper, abilityId: string) => {
    const hero = escaper.getHero()

    if (!hero) {
        return
    }

    if (GetUnitAbilityLevel(hero, FourCC(abilityId)) > 0) {
        UnitRemoveAbility(hero, FourCC(abilityId))
    } else {
        UnitAddAbility(hero, FourCC(abilityId))
    }
}

export const scaleCb = (escaper: Escaper, scale: string) => {
    const hero = escaper.getHero()

    if (!hero) {
        return
    }

    const oldScale = escaper.getScale()

    if (IsBoolString(scale) && !S2R(scale)) {
        escaper.setScale(undefined)
    } else {
        escaper.setScale(S2R(scale))
    }

    if (oldScale !== escaper.getScale()) {
        const x =
            escaper.getLastTerrainType() instanceof TerrainTypeWalk
                ? escaper.getHeroX()
                : getUdgLevels().getCurrentLevel(this).getStartRandomX()

        const y =
            escaper.getLastTerrainType() instanceof TerrainTypeWalk
                ? escaper.getHeroY()
                : getUdgLevels().getCurrentLevel(this).getStartRandomY()

        const a = escaper.getLastTerrainType() instanceof TerrainTypeWalk ? escaper.getHeroFacing() : HERO_START_ANGLE

        escaper.removeHero()
        escaper.createHero(x, y, a)
    }
}

export const glowCb = (escaper: Escaper, glow: boolean) => {
    const hero = escaper.getHero()

    if (!hero) {
        return
    }

    escaper.setGlow(glow)
}

// For example for -createTerrainSaveEvent/-editTerrainSaveEvent's "delay=<seconds>"/"periodic=<seconds>" optional params.
export const parseKeyValueParam = (param: string): { key: string; value: string } | null => {
    const eqIndex = param.indexOf('=')
    if (eqIndex <= 0) {
        return null
    }

    return { key: param.substring(0, eqIndex), value: param.substring(eqIndex + 1) }
}
