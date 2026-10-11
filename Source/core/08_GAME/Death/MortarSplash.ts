import { ServiceManager } from 'Services'
import { createEvent } from 'Utils/mapUtils'
import { getUdgEscapers, getUdgTerrainSaves, udg_monsters } from '../../../../globals'
import { Constants } from '../../01_libraries/Constants'
import type { Escaper } from '../../04_STRUCTURES/Escaper/Escaper'
import type { Monster } from '../../04_STRUCTURES/Monster/Monster'
import {
    awaitKillingContact,
    CONTACT_KIND,
    sendAsyncMortarHit,
    setAsyncMortarHitHandler,
} from '../Contact/AsyncHeroSync'
import { previewKillingEffect } from './AsyncKillingEffects'

/**
 * How a mortar (a monster attacking the ground, see Monster.setAttackGroundPos) hurts the heroes: with the
 * damage of its attack as set in the object editor, before any armor, times the factor of the area the
 * hero stands in - full, medium or small damage, as the weapon of the mortar sets them.
 *
 * The engine knows when the shell lands and what damage it rolled, but only tells it to a unit it hurts.
 * So each mortar gets a sensor at the point it attacks: an invisible unit of the heroes of 2.1c, which
 * nothing but that splash hurts. Its damage is read before armor, then taken back, and every hero is
 * judged from where it stands. The areas are measured the way the engine measures them (measured in the
 * game with sensors of two collision sizes around an impact): from the point of impact to the edge of the
 * collision circle of the unit, so a hero gets an area when its distance to that point, minus its
 * collision size, is within the radius.
 *
 * The damage events of the sensor happen on every machine at once. A hero every machine sees is judged
 * there, by all of them. A hero sliding as an effect is only seen right by its own machine: that machine
 * judges it and tells every machine the damage (MEC_AHM), which they all apply when it arrives. A shell
 * that kills it for sure stops its effect there at once, as a killing contact does, so that it dies where
 * the shell hit it rather than a latency further.
 */

/** The invisible unit of the heroes with a collision size of 5: small, as the sensor stands for the point of impact */
const SENSOR_TYPE_ID = FourCC('Ei01')
const SENSOR_LIFE = 1000000

/** The sensor of each mortar, by monster id: made and removed with its unit, on every machine alike */
const sensors: { [monsterId: number]: unit | undefined } = {}

const damagingTrigger = { trigger: undefined as trigger | undefined }

type SplashAreas = { full: number; medium: number; small: number; factorMedium: number; factorSmall: number }

/** The areas of the weapon of that unit: the first weapon that has any */
const getSplashAreas = (mortarUnit: unit): SplashAreas | undefined => {
    for (const index of [0, 1]) {
        const small = BlzGetUnitWeaponRealField(mortarUnit, UNIT_WEAPON_RF_ATTACK_AREA_OF_EFFECT_SMALL_DAMAGE, index)
        const medium = BlzGetUnitWeaponRealField(mortarUnit, UNIT_WEAPON_RF_ATTACK_AREA_OF_EFFECT_MEDIUM_DAMAGE, index)
        const full = BlzGetUnitWeaponRealField(mortarUnit, UNIT_WEAPON_RF_ATTACK_AREA_OF_EFFECT_FULL_DAMAGE, index)

        if (small > 0 || medium > 0 || full > 0) {
            return {
                full,
                medium,
                small,
                factorMedium: BlzGetUnitWeaponRealField(mortarUnit, UNIT_WEAPON_RF_ATTACK_DAMAGE_FACTOR_MEDIUM, index),
                factorSmall: BlzGetUnitWeaponRealField(mortarUnit, UNIT_WEAPON_RF_ATTACK_DAMAGE_FACTOR_SMALL, index),
            }
        }
    }

    return undefined
}

/** The share of the damage a hero at that place takes, 0 out of every area */
const getDamageFactor = (
    areas: SplashAreas,
    impactX: number,
    impactY: number,
    x: number,
    y: number,
    collision: number
) => {
    const dx = x - impactX
    const dy = y - impactY
    const distance = SquareRoot(dx * dx + dy * dy) - collision

    if (distance <= areas.full) {
        return 1
    }

    if (distance <= areas.medium) {
        return areas.factorMedium
    }

    if (distance <= areas.small) {
        return areas.factorSmall
    }

    return 0
}

/**
 * Whether that damage kills the hero for sure, asked by the machine of a hero sliding as an effect before
 * it tells the others: the very questions touchMonster asks every machine once the damage reaches them.
 * Anything the mortar does rather than hurting, and whatever keeps the hero alive, answers no.
 */
const doesMortarHitKill = (escaper: Escaper, monster: Monster, hero: unit, damage: number) => {
    if (escaper.isGodModeOn() || escaper.isCoopInvul()) {
        return false
    }

    if (
        monster.getClearMob() ||
        monster.getPortalMob() ||
        monster.getCircleMob() ||
        monster.getJumpPad() !== undefined ||
        monster.getMonsterType()?.getLifeBonus() ||
        getUdgTerrainSaves().findMonsterTouchEventsByMonsterId(monster.getId()).length > 0
    ) {
        return false
    }

    return GetWidgetLife(hero) - damage <= 0.405
}

/** What the damage does to the hero: the same as touching the mortar with that damage */
const applyMortarDamage = (escaper: Escaper, mortarUnit: unit, damage: number) => {
    ServiceManager.getService('InvisUnit_is_getting_damage').onEscaperTouchingMonster(escaper, mortarUnit, damage)
}

/**
 * The machine of a hero sliding as an effect, the one that sees where it is: the damage it takes, told to
 * every machine. A shell that kills it for sure stops the effect first and shows the killing effect, as a
 * killing contact does (see ContactCheck.anticipateKillingContact); that stop is let go when the damage
 * comes back from the network.
 */
const judgeLocalAsyncHero = (
    escaper: Escaper,
    monster: Monster,
    areas: SplashAreas,
    impactX: number,
    impactY: number,
    damage: number
) => {
    const hero = escaper.getHero()
    const factor = getDamageFactor(
        areas,
        impactX,
        impactY,
        escaper.getHeroX(),
        escaper.getHeroY(),
        escaper.getHeroCollisionSize()
    )

    if (!hero || factor <= 0) {
        return
    }

    const hitDamage = damage * factor

    if (
        !escaper.isAsyncDeathPending() &&
        !escaper.isAsyncHandBackPending() &&
        doesMortarHitKill(escaper, monster, hero, hitDamage)
    ) {
        awaitKillingContact(escaper.getId(), CONTACT_KIND.mortar, monster.getId())

        const model = monster.getMonsterType()?.getKillingEffectStr()

        model &&
            previewKillingEffect(escaper.getId(), model, escaper.getHeroX(), escaper.getHeroY(), escaper.getHeroZ())
    }

    sendAsyncMortarHit(escaper.getId(), monster.getId(), hitDamage)
}

const onSensorDamaging = () => {
    const sensor = BlzGetEventDamageTarget()
    const monster = sensor && (udg_monsters[GetUnitUserData(sensor)] as Monster | undefined)
    const mortarUnit = monster?.u

    // what else might hurt the sensor is none of its business, and it takes nothing
    const damage = GetEventDamage()
    BlzSetEventDamage(0)

    if (!monster || !mortarUnit || GetEventDamageSource() !== mortarUnit || sensors[monster.getId()] !== sensor) {
        return
    }

    const impactX = monster.getAttackGroundX()
    const impactY = monster.getAttackGroundY()
    const areas = getSplashAreas(mortarUnit)

    if (impactX === undefined || impactY === undefined || !areas || damage <= 0) {
        return
    }

    getUdgEscapers().forAll(escaper => {
        if (!escaper.getHero() || !escaper.isAlive()) {
            return
        }

        // judged by its own machine alone, from where that machine sees it
        if (escaper.isHeroAsEffect()) {
            if (escaper.isAsyncControlledHere()) {
                judgeLocalAsyncHero(escaper, monster, areas, impactX, impactY, damage)
            }

            return
        }

        const factor = getDamageFactor(
            areas,
            impactX,
            impactY,
            escaper.getHeroX(),
            escaper.getHeroY(),
            escaper.getHeroCollisionSize()
        )

        factor > 0 && applyMortarDamage(escaper, mortarUnit, damage * factor)
    })
}

export const removeMortarSensor = (monster: Monster) => {
    const sensor = sensors[monster.getId()]

    if (sensor) {
        RemoveUnit(sensor)
        delete sensors[monster.getId()]
    }
}

/** Gives the unit of that monster its sensor if it attacks the ground, and takes it away otherwise */
export const refreshMortarSensor = (monster: Monster) => {
    removeMortarSensor(monster)

    const impactX = monster.getAttackGroundX()
    const impactY = monster.getAttackGroundY()

    if (!monster.u || impactX === undefined || impactY === undefined) {
        return
    }

    const sensor = CreateUnit(Constants.PLAYER_INVIS_UNIT, SENSOR_TYPE_ID, impactX, impactY, 0)

    if (!sensor) {
        return
    }

    SetUnitPathing(sensor, false)
    SetUnitX(sensor, impactX)
    SetUnitY(sensor, impactY)
    BlzSetUnitMaxHP(sensor, SENSOR_LIFE)
    SetWidgetLife(sensor, SENSOR_LIFE)
    SetUnitUserData(sensor, monster.getId())

    if (!damagingTrigger.trigger) {
        damagingTrigger.trigger = createEvent({ events: [], actions: [onSensorDamaging] })
    }

    TriggerRegisterUnitEvent(damagingTrigger.trigger, sensor, EVENT_UNIT_DAMAGING)

    sensors[monster.getId()] = sensor
}

/** The damage the machine of a hero sliding as an effect judged it took, applied by every machine */
export const initMortarSplash = () => {
    setAsyncMortarHitHandler((escaperId, monsterId, damage) => {
        const escaper = getUdgEscapers().get(escaperId)
        const mortarUnit = udg_monsters[monsterId]?.u

        escaper && mortarUnit && damage > 0 && applyMortarDamage(escaper, mortarUnit, damage)
    })
}
