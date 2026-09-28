import { MemoryHandler } from 'Utils/MemoryHandler'
import { createEvent, runInTrigger } from 'Utils/mapUtils'
import { arrayPush } from 'core/01_libraries/Basic_functions'
import { Constants } from 'core/01_libraries/Constants'
import { IsHero } from 'core/04_STRUCTURES/Escaper/Escaper_functions'
import { sameLevelProgression } from 'core/04_STRUCTURES/Level/LevelProgression'
import { getUdgEscapers, getUdgTerrainTypes, globals } from '../../../../globals'
import { Natives } from '../../wc3_natives_unsecured/Natives'
import { AfkMode } from '../Afk_mode/Afk_mode'
import { DeplacementHeroHorsDeathPath } from '../Mode_coop/deplacement_heros_hors_death_path'
import { loseALifeAndRes } from './Lose_a_life_and_res'

const initReviveTrigManager = () => {
    const groups: number[][] = []

    return {
        createGroup: () => {
            const group = MemoryHandler.getEmptyArray<number>()
            arrayPush(groups, group)
            return group
        },
        clearGroup: (group: number[]) => {
            MemoryHandler.destroyArray(group)

            const index = groups.findIndex(item => item === group)
            groups.splice(index, 1)
        },
        removeEscaper: (escaperId: number) => {
            for (const group of groups) {
                const index = group.indexOf(escaperId)

                if (index !== -1) {
                    group.splice(index, 1)
                }
            }
        },
    }
}

export const reviveTrigManager = initReviveTrigManager()

export const InitTrig_A_hero_dies_check_if_all_dead_and_sounds = () => {
    createEvent({
        events: [t => TriggerRegisterAnyUnitEventBJ(t, EVENT_PLAYER_UNIT_DEATH)],
        conditions: [() => IsHero(Natives.UGetTriggerUnit())],
        actions: [
            () => {
                const hero = Natives.UGetTriggerUnit()
                const n = GetUnitUserData(hero)
                let nbAlive = 0
                let nbAliveWithoutAr = 0
                let last = false

                const escaperIds = reviveTrigManager.createGroup()

                for (let i = 0; i < Constants.NB_ESCAPERS; i++) {
                    if (
                        getUdgEscapers().get(i)?.isAlive() &&
                        !getUdgEscapers().get(i)?.hasAutorevive() &&
                        !(
                            getUdgEscapers().get(n) &&
                            !sameLevelProgression(getUdgEscapers().get(n)!, getUdgEscapers().get(i)!)
                        )
                    ) {
                        nbAlive = nbAlive + 1
                    }

                    if (
                        !getUdgEscapers().get(i)?.isAlive() &&
                        !getUdgEscapers().get(i)?.hasAutorevive() &&
                        getUdgEscapers().get(i) &&
                        getUdgEscapers().get(n) &&
                        sameLevelProgression(getUdgEscapers().get(n)!, getUdgEscapers().get(i)!)
                    ) {
                        arrayPush(escaperIds, i)
                    }

                    if (
                        !getUdgEscapers().get(i)?.hasAutorevive() &&
                        GetPlayerController(Natives.UPlayer(i)) === MAP_CONTROL_USER &&
                        GetPlayerSlotState(Natives.UPlayer(i)) === PLAYER_SLOT_STATE_PLAYING
                    ) {
                        nbAliveWithoutAr++
                    }
                }

                // No need to continue when everyone has autorevive
                if (nbAliveWithoutAr === 0) {
                    reviveTrigManager.clearGroup(escaperIds)
                    return
                }

                if (nbAlive === 0) {
                    runInTrigger(() => {
                        loseALifeAndRes(escaperIds)
                        reviveTrigManager.clearGroup(escaperIds)
                        TriggerSleepAction(2)
                        StartSound(gg_snd_questFailed)
                        last = true
                    })
                } else {
                    reviveTrigManager.clearGroup(escaperIds)

                    if (nbAlive === 1) {
                        StartSound(gg_snd_warning)
                    }
                }

                if (AfkMode.isAfk[n]) {
                    DestroyTextTag(AfkMode.afkModeTextTags[n])
                } else {
                    PauseTimer(AfkMode.afkModeTimers[n])
                }

                if (AfkMode.AreAllAliveHeroesAfk()) {
                    AfkMode.KillAllHeroesAfkInFourSeconds()
                }

                if (last) {
                    TriggerSleepAction(3)
                } else {
                    //coop
                    if (globals.coopModeActive) {
                        TriggerSleepAction(1.3)

                        const hero2 = getUdgEscapers().get(n)?.getHero()

                        if (!hero2 || GetHandleId(hero) !== GetHandleId(hero2)) {
                            return
                        }

                        //si héros déjà vivant, inutile de le ressuciter
                        if (IsUnitAliveBJ(hero2)) {
                            TriggerSleepAction(3.7)
                            return
                        }

                        //déplacement du héros si mort sur le death path
                        if (
                            getUdgTerrainTypes()
                                .getTerrainType(
                                    getUdgEscapers().get(n)?.getHeroX() ?? 0,
                                    getUdgEscapers().get(n)?.getHeroY() ?? 0
                                )
                                ?.getKind() === 'death'
                        ) {
                            DeplacementHeroHorsDeathPath.DeplacementHeroHorsDeathPath(hero2)
                        }

                        if (globals.coopCircles) {
                            //revive si autre héros (vivant) au même endroit
                            for (let i = 0; i < Constants.NB_ESCAPERS; i++) {
                                // A hero sliding as an effect is left to the revive circle: each
                                // machine holds it at a place of its own, and measuring from there
                                // would revive the dead hero on some machines only. Its own machine
                                // finds the circle, and tells every machine on the same turn.
                                if (
                                    i !== n &&
                                    getUdgEscapers().get(i)?.isAlive() &&
                                    !getUdgEscapers().get(i)?.isHeroAsEffect()
                                ) {
                                    const h1 = getUdgEscapers().get(i)?.getHero()

                                    if (!h1) {
                                        continue
                                    }

                                    const diffX =
                                        (getUdgEscapers().get(i)?.getHeroX() ?? 0) -
                                        (getUdgEscapers().get(n)?.getHeroX() ?? 0)
                                    const diffY =
                                        (getUdgEscapers().get(i)?.getHeroY() ?? 0) -
                                        (getUdgEscapers().get(n)?.getHeroY() ?? 0)

                                    if (SquareRoot(diffX * diffX + diffY * diffY) < Constants.COOP_REVIVE_DIST) {
                                        getUdgEscapers().get(n)?.coopReviveHero()
                                        TriggerSleepAction(3.7)
                                        return
                                    }
                                }
                            }

                            getUdgEscapers().get(n)?.enableTrigCoopRevive()
                        }

                        TriggerSleepAction(3.7)
                    } else {
                        TriggerSleepAction(5)
                    }
                }

                SetUnitAnimation(hero, 'stand')
            },
        ],
    })
}
