import { getUdgEscapers, udg_monsters, udg_spawned_monster_units, udg_spawned_monsters } from '../../../../globals'
import type { MonsterType } from './MonsterType'

/**
 * The immolation is how the engine used to notice that a hero touched a monster: every monster unit
 * carried an immolation ability whose radius is the collision radius of its monster type, and the
 * invisible unit following the hero took the damage (see InvisUnit_is_getting_damage).
 *
 * MEC finds its contacts itself now (ContactCheck), so no monster is given that ability any
 * more: an immolation radius is a number MEC reads to know how big a monster is, not something the
 * engine applies. The e2e tests "immolationOn" / "immolationOff" hand it out again at runtime, to
 * compare the two - they are what the measurements of
 * docs/MEC_CONTACT_CHECK_TO_REPLACE_IMMOLATION.md were taken with.
 */
export const IMMOLATION_SYSTEM_ENABLED = false

let isEnabled = IMMOLATION_SYSTEM_ENABLED

export const isImmolationSystemEnabled = () => isEnabled

const applyImmolationOnUnit = (monsterUnit: unit, mt: MonsterType | null | undefined, enabled: boolean): boolean => {
    const immoSkill = mt?.getImmolationSkill() || 0

    if (immoSkill <= 0 || GetUnitTypeId(monsterUnit) === 0) {
        return false
    }

    if (enabled) {
        UnitAddAbility(monsterUnit, immoSkill)
    } else {
        UnitRemoveAbility(monsterUnit, immoSkill)
    }

    return true
}

/**
 * Adds or removes the immolation ability of every monster unit currently on the map - the monsters
 * of every level and the spawned ones (monster spawns and caster shots), which get their immolation
 * from their monster type at creation time - and decides whether the monsters created from now on
 * get one at all.
 *
 * A temporarily disabled monster is left alone: its immolation is already removed, and giving it
 * back here would make it kill again while it is supposed to be harmless.
 *
 * @returns the number of monster units whose immolation actually changed
 */
export const setImmolationSystemEnabled = (enabled: boolean): number => {
    isEnabled = enabled

    let nbChangedUnits = 0

    for (const [_, monster] of pairs(udg_monsters)) {
        if (monster.u && !monster.isDisabled() && applyImmolationOnUnit(monster.u, monster.getMonsterType(), enabled)) {
            nbChangedUnits++
        }
    }

    for (const [_, monsterUnit] of pairs(udg_spawned_monster_units)) {
        if (
            monsterUnit &&
            applyImmolationOnUnit(monsterUnit, udg_spawned_monsters[GetHandleId(monsterUnit)], enabled)
        ) {
            nbChangedUnits++
        }
    }

    // The invisible unit of a hero is what the immolation burns, and only exists while it does (see
    // Escaper.refreshInvisUnit). Called by a command, hence on every machine at once, as making units is.
    getUdgEscapers().forAll(escaper => escaper.refreshInvisUnit())

    return nbChangedUnits
}
