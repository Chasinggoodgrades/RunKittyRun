import { GetCurrentMonsterPlayer } from 'core/01_libraries/Basic_functions'
import { Constants } from 'core/01_libraries/Constants'
import { getUdgEscapers } from '../../../../globals'
import { Natives } from '../../wc3_natives_unsecured/Natives'
import { isImmolationSystemEnabled } from './Immolation_system'
import { Monster } from './Monster'
import { MonsterType } from './MonsterType'

let monster: unit
const ATTACK_SKILL = FourCC('Aatk')
const ABILITY_1_LIFE = FourCC('ABV1')
const ABILITY_10_LIFE = FourCC('ABV2')
const ABILITY_100_LIFE = FourCC('ABV3')
const ABILITY_1000_LIFE = FourCC('ABV4')
const ABILITY_10000_LIFE = FourCC('ABV5')
const ABILITY_FORME_CORBEAU = FourCC('Amrf')

export const UnitAddRemoveLifeAbility = (u: unit, lifeAbility: number) => {
    UnitAddAbility(u, lifeAbility)
    SetUnitAbilityLevel(u, lifeAbility, 2)
    UnitRemoveAbility(u, lifeAbility)
}

export const UnitAddMaxLife = (u: unit, lifeToAdd: number) => {
    while (true) {
        if (lifeToAdd <= 0) break
        if (lifeToAdd >= 10000) {
            UnitAddRemoveLifeAbility(u, ABILITY_10000_LIFE)
            lifeToAdd = lifeToAdd - 10000
        } else {
            if (lifeToAdd >= 1000) {
                UnitAddRemoveLifeAbility(u, ABILITY_1000_LIFE)
                lifeToAdd = lifeToAdd - 1000
            } else {
                if (lifeToAdd >= 100) {
                    UnitAddRemoveLifeAbility(u, ABILITY_100_LIFE)
                    lifeToAdd = lifeToAdd - 100
                } else {
                    if (lifeToAdd >= 10) {
                        UnitAddRemoveLifeAbility(u, ABILITY_10_LIFE)
                        lifeToAdd = lifeToAdd - 10
                    } else {
                        UnitAddRemoveLifeAbility(u, ABILITY_1_LIFE)
                        lifeToAdd = lifeToAdd - 1
                    }
                }
            }
        }
    }
}

export const SetUnitMaxLife = (u: unit, newMaxLife: number): boolean => {
    let maxLife = R2I(GetUnitState(u, UNIT_STATE_MAX_LIFE))
    if (newMaxLife <= maxLife) {
        return false
    }
    UnitAddMaxLife(u, newMaxLife - maxLife)
    return true
}

export const NewImmobileMonsterForPlayer = (
    mt: MonsterType,
    p: player,
    x: number,
    y: number,
    angle: number,
    disableAttack = true
): unit => {
    let unitTypeId = mt.getUnitTypeId()

    if (Monster.forceUnitTypeIdForNextMonster > 0) {
        unitTypeId = Monster.forceUnitTypeIdForNextMonster
        Monster.forceUnitTypeIdForNextMonster = 0
    }

    if (Monster.forceXforNextMonster != 0) {
        x = Monster.forceXforNextMonster
        Monster.forceXforNextMonster = 0
    }

    if (Monster.forceYforNextMonster != 0) {
        y = Monster.forceYforNextMonster
        Monster.forceYforNextMonster = 0
    }

    let scale: number
    if (angle === -1) {
        monster = Natives.UCreateUnit(p, unitTypeId, x, y, GetRandomDirectionDeg())
    } else {
        monster = Natives.UCreateUnit(p, unitTypeId, x, y, angle)
    }

    SetUnitUseFood(monster, false)

    BlzSetUnitRealField(monster, UNIT_RF_SIGHT_RADIUS, -999999999999999) // with a negative sight the sight is reduced faster to null

    if (mt.isClickable()) {
        SetUnitMaxLife(monster, mt.getMaxLife())
    } else {
        UnitAddAbility(monster, FourCC('Aloc'))
    }

    SetUnitPathing(monster, false)

    const immoSkill = mt.getImmolationSkill() || 0

    immoSkill > 0 && isImmolationSystemEnabled() && UnitAddAbility(monster, immoSkill)

    scale = mt.getScale()
    if (scale !== -1) {
        SetUnitScale(monster, scale, scale, scale)
    }
    SetUnitMoveSpeed(monster, mt.getUnitMoveSpeed())
    if (!Constants.MOBS_VARIOUS_COLORS) {
        SetUnitColor(monster, Natives.UConvertPlayerColor(24))
    }

    if (disableAttack) {
        UnitRemoveAbility(monster, ATTACK_SKILL)
    }

    UnitRemoveType(monster, UNIT_TYPE_PEON)
    if (mt.getHeight() != -1) {
        UnitAddAbility(monster, ABILITY_FORME_CORBEAU)
        SetUnitFlyHeight(monster, mt.getHeight(), 0)
    }

    const shadow = getUdgEscapers().get(GetPlayerId(GetLocalPlayer()))?.getMonsterShadow()

    if (shadow === false) {
        // Force toggle it to update the shadow
        const skinId = BlzGetUnitSkin(monster)
        BlzSetUnitSkin(monster, skinId === FourCC('hpea') ? FourCC('hfoo') : FourCC('hpea'))
        BlzSetUnitSkin(monster, skinId)
    } else {
        // Unfortunately we can't disable the skin, you'll have to recreate the unit
    }

    return monster
}

export const NewImmobileMonster = (
    mt: MonsterType,
    x: number,
    y: number,
    angle: number,
    disableAttack = true
): unit => {
    let p: player
    if (mt.isClickable()) {
        p = Constants.ENNEMY_PLAYER
    } else {
        p = GetCurrentMonsterPlayer()
    }
    return NewImmobileMonsterForPlayer(mt, p, x, y, angle, disableAttack)
}

export const NewPatrolMonster = (mt: MonsterType, x1: number, y1: number, x2: number, y2: number): unit => {
    x1 = Monster.forceX1forNextMonster != 0 ? Monster.forceX1forNextMonster : x1
    x2 = Monster.forceX2forNextMonster != 0 ? Monster.forceX2forNextMonster : x2
    y1 = Monster.forceY1forNextMonster != 0 ? Monster.forceY1forNextMonster : y1
    y2 = Monster.forceY2forNextMonster != 0 ? Monster.forceY2forNextMonster : y2

    Monster.forceX1forNextMonster = 0
    Monster.forceX2forNextMonster = 0
    Monster.forceY1forNextMonster = 0
    Monster.forceY2forNextMonster = 0

    let angle = bj_RADTODEG * Atan2(y1 - y2, x1 - x2)
    monster = NewImmobileMonster(mt, x1, y1, angle)
    IssuePointOrder(monster, 'patrol', x2, y2)
    return monster
}
