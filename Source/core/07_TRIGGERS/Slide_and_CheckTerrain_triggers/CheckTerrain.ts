import { EffectUtils } from 'Utils/EffectUtils'
import { createEvent } from 'Utils/mapUtils'
import { Constants } from 'core/01_libraries/Constants'
import { Escaper } from 'core/04_STRUCTURES/Escaper/Escaper'
import { GetMirrorEscaper } from 'core/04_STRUCTURES/Escaper/Escaper_functions'
import { MeteorFunctions } from 'core/04_STRUCTURES/Meteor/Meteor_functions'
import { TerrainType } from 'core/04_STRUCTURES/TerrainType/TerrainType'
import { TerrainTypeDeath } from 'core/04_STRUCTURES/TerrainType/TerrainTypeDeath'
import { TerrainTypeSlide } from 'core/04_STRUCTURES/TerrainType/TerrainTypeSlide'
import { TerrainTypeWalk } from 'core/04_STRUCTURES/TerrainType/TerrainTypeWalk'
import { ASYNC_HERO_EVENT } from 'core/08_GAME/Contact/AsyncHeroSync'
import { hooks } from 'core/API/GeneralHooks'
import { getUdgEscapers, getUdgTerrainTypes } from '../../../../globals'
import { AutoContinueAfterSliding } from './Auto_continue_after_sliding'
import { TurnOnSlide } from './To_turn_on_slide'

const TOLERANCE_ANGLE_DIFF = 5
const TOLERANCE_RAYON_DIFF = 20
const INIT_RAYON_TOLERANCE = 20

const initCheckTerrainTrigger = () => {
    const SlideTerrainCheck = (
        terrainType: TerrainTypeSlide,
        escaper: Escaper,
        hero: unit,
        playerId: number,
        wasSliding: boolean,
        wasReversed: boolean
    ) => {
        escaper.enableSlide(true)

        if (!wasSliding) {
            MeteorFunctions.HeroComingToSlide_CheckItem(hero)
            AutoContinueAfterSliding.ClearLastClickSave(playerId)
        }

        if (!escaper.isAbsoluteSlideSpeed()) {
            escaper.setSlideSpeed((escaper.getSlideMirror() ? -1 : 1) * terrainType.getSlideSpeed())
        }

        if (!escaper.isAbsoluteRotationSpeed()) {
            escaper.setRotationSpeed(terrainType.getRotationSpeed())
        }

        // the slide turning the hero half a turn: from a normal slide to a reverse one or back, or
        // straight into a reverse one from walkable ground
        let hasTurnedHeroHalfATurn = false

        if (escaper.getSlideSpeed() < 0) {
            if (wasSliding && !wasReversed && !escaper.getSlideMirror()) {
                escaper.reverse()
                hasTurnedHeroHalfATurn = true
            }

            if (!wasSliding) {
                escaper.reverse()
                hasTurnedHeroHalfATurn = true
            }

            if (wasSliding && wasReversed && escaper.getSlideMirror()) {
                escaper.reverse()
                hasTurnedHeroHalfATurn = true
            }
        } else {
            if (wasSliding && wasReversed && !escaper.getSlideMirror()) {
                escaper.reverse()
                hasTurnedHeroHalfATurn = true
            }

            if (wasSliding && !wasReversed && escaper.getSlideMirror()) {
                escaper.reverse()
                hasTurnedHeroHalfATurn = true
            }
        }

        // after the half turn: the orders right behind it must not undo it
        if (hasTurnedHeroHalfATurn) {
            TurnOnSlide.markSlideDirectionSwitch(escaper)
        }
    }

    const WalkTerrainCheck = (
        lastTerrainType: TerrainType | undefined,
        currentTerrainType: TerrainType,
        escaper: Escaper,
        hero: unit,
        playerId: number,
        wasReversed: boolean
    ) => {
        escaper.enableSlide(false)

        if (lastTerrainType?.getKind() === 'slide') {
            MeteorFunctions.HeroComingOutFromSlide_CheckItem(hero)

            if ((escaper.getSlideMirror() || wasReversed) && !(escaper.getSlideMirror() && wasReversed)) {
                escaper.reverse()
            }

            if (AutoContinueAfterSliding.udg_autoContinueAfterSliding[playerId] && !wasReversed) {
                AutoContinueAfterSliding.AutoContinueAfterSliding(playerId)
            }
        }

        if (currentTerrainType instanceof TerrainTypeWalk) {
            if (!escaper.isAbsoluteWalkSpeed()) {
                escaper.setWalkSpeed(currentTerrainType.getWalkSpeed())
            }
        }
    }

    /** What the last measure of a death terrain found, kept here to spare a table at every pass */
    const deathTouch = { isTouched: true, toleranceTerrainType: undefined as TerrainType | undefined }

    /**
     * Whether the death terrain under the hero kills it, or its tolerance forgives it: rings of
     * samples around the hero, growing up to the tolerance distance, stop at the first one that is
     * not deadly - and that terrain is the one the hero is considered on.
     */
    const measureDeathTerrainTouch = (x: number, y: number, terrainType: TerrainTypeDeath) => {
        deathTouch.isTouched = true
        deathTouch.toleranceTerrainType = undefined

        const toleranceDist = terrainType.getToleranceDist()

        if (toleranceDist === 0) {
            return
        }

        let tempRayonTolerance = INIT_RAYON_TOLERANCE

        while (deathTouch.isTouched && tempRayonTolerance <= toleranceDist) {
            let angle = 0

            while (deathTouch.isTouched && angle < 360) {
                const xTolerance = x + tempRayonTolerance * CosBJ(angle)
                const yTolerance = y + tempRayonTolerance * SinBJ(angle)
                const terrainTypeTolerance = getUdgTerrainTypes().getTerrainType(xTolerance, yTolerance) ?? undefined

                deathTouch.toleranceTerrainType = terrainTypeTolerance

                if (terrainTypeTolerance?.getKind() !== 'death') {
                    deathTouch.isTouched = false
                }

                angle = angle + TOLERANCE_ANGLE_DIFF
            }

            tempRayonTolerance = tempRayonTolerance + TOLERANCE_RAYON_DIFF
        }
    }

    /**
     * The terrain check of a hero sliding as an effect, run by the machine of its player alone.
     *
     * What only changes how the hero slides is applied here and now: a slide terrain, a death
     * terrain its tolerance forgives towards a slide, the god mode shrugging a death terrain off.
     * What belongs to the game is handed to every machine instead - walkable ground, a death
     * terrain that kills - and the hero waits for them where that happens.
     *
     * Nobody else runs this, so nothing in it may create or destroy a handle: the camera spin keeps
     * the timer it has, and the hooks and the god mode effect go through every machine.
     */
    const CheckTerrainOfAsyncHero = (escaper: Escaper, playerId: number) => {
        if (escaper.isAsyncHandBackPending() || escaper.isAsyncDeathPending() || escaper.isStaticSliding()) {
            return
        }

        const hero = escaper.getHero()

        if (!hero || !escaper.isHeroOnGround()) {
            return
        }

        const x = escaper.getHeroX()
        const y = escaper.getHeroY()
        const lastTerrainType = escaper.getLastTerrainType()
        const currentTerrainType = getUdgTerrainTypes().getTerrainType(x, y)

        if (
            !currentTerrainType ||
            (lastTerrainType === currentTerrainType && currentTerrainType.getKind() !== 'death')
        ) {
            return
        }

        // the slide goes on over this one: the terrain itself, or the one a tolerance forgives towards
        let slideTerrainType: TerrainTypeSlide | undefined
        let isShruggedOffByGodMode = false

        if (currentTerrainType instanceof TerrainTypeSlide) {
            slideTerrainType = currentTerrainType
        } else if (currentTerrainType instanceof TerrainTypeDeath) {
            measureDeathTerrainTouch(x, y, currentTerrainType)

            const toleranceTerrainType = deathTouch.toleranceTerrainType

            if (deathTouch.isTouched) {
                isShruggedOffByGodMode = escaper.isGodModeOn()
            } else if (toleranceTerrainType instanceof TerrainTypeSlide) {
                slideTerrainType = toleranceTerrainType
            }
        }

        // before anything changes: the packet carries the state every machine starts its check from
        if (!slideTerrainType && !isShruggedOffByGodMode) {
            escaper.announceAsyncHandBack()

            return
        }

        const oldSlideSpeed = escaper.getSlideSpeed()
        const wasReversed = escaper.getSlideMirror() ? oldSlideSpeed >= 0 : oldSlideSpeed < 0

        escaper.setLastTerrainType(currentTerrainType)

        // only when it really changed, a death terrain being read again at every pass
        if (currentTerrainType !== lastTerrainType && hooks.hooks_onHeroTerrainChange.getHooks().length > 0) {
            escaper.announceAsyncHeroEvent(ASYNC_HERO_EVENT.terrainChanged, x, y, currentTerrainType, lastTerrainType)
        }

        if (slideTerrainType) {
            // already sliding, so nothing is started: the speeds and the direction only
            SlideTerrainCheck(slideTerrainType, escaper, hero, playerId, true, wasReversed)
        } else {
            escaper.announceAsyncHeroEvent(ASYNC_HERO_EVENT.godModeTouchedDeathTerrain, x, y)
        }
    }

    const CheckTerrainActions = (playerId: number) => {
        const escaper = getUdgEscapers().get(playerId)

        if (!escaper) {
            return
        }

        // While a hero slides as an effect, only the machine of its player knows where it really
        // is, and that machine alone reads the terrain under it: the slide never waits for the
        // network. The others replay this very check only where that machine hands the hero back,
        // from the state it had - reading the terrain under a position that only approximates the
        // truth is what tore the game apart.
        if (escaper.shouldSkipTerrainCheck()) {
            escaper.isAsyncControlledHere() && CheckTerrainOfAsyncHero(escaper, playerId)

            return
        }

        const hero = escaper.getHero()

        if (!hero) {
            return
        }

        const x = escaper.getHeroX()
        const y = escaper.getHeroY()
        const lastTerrainType = escaper.getLastTerrainType()
        const currentTerrainType = getUdgTerrainTypes().getTerrainType(x, y)

        const wasSliding = escaper.isSliding()
        const oldSlideSpeed = escaper.getSlideSpeed()
        const wasReversed = escaper.getSlideMirror() ? oldSlideSpeed >= 0 : oldSlideSpeed < 0

        escaper.moveInvisUnit(x, y)

        if (escaper.isStaticSliding()) {
            return
        }

        if (escaper.isHeroOnGround()) {
            if (
                !currentTerrainType ||
                (lastTerrainType === currentTerrainType && currentTerrainType.getKind() !== 'death')
            ) {
                return
            }

            escaper.setLastTerrainType(currentTerrainType)

            if (currentTerrainType instanceof TerrainTypeSlide) {
                escaper.startSpinCam()
            } else {
                escaper.stopSpinCam()
            }

            for (const hook of hooks.hooks_onHeroTerrainChange.getHooks()) {
                hook.execute3(escaper, currentTerrainType, lastTerrainType)
            }

            if (currentTerrainType instanceof TerrainTypeSlide) {
                SlideTerrainCheck(currentTerrainType, escaper, hero, playerId, wasSliding, wasReversed)
            } else if (currentTerrainType instanceof TerrainTypeDeath) {
                measureDeathTerrainTouch(x, y, currentTerrainType)

                const toleranceTerrainType = deathTouch.toleranceTerrainType

                if (deathTouch.isTouched) {
                    if (escaper.isGodModeOn()) {
                        EffectUtils.destroyEffect(
                            EffectUtils.addSpecialEffect(Constants.GM_TOUCH_DEATH_TERRAIN_EFFECT_STR, x, y)
                        )
                    } else {
                        currentTerrainType.killEscaper(escaper)
                        escaper.enableSlide(false)

                        const mirrorEscaper = GetMirrorEscaper(escaper)

                        if (mirrorEscaper) {
                            currentTerrainType.killEscaper(mirrorEscaper)
                            mirrorEscaper.enableSlide(false)
                        }
                    }
                } else if (toleranceTerrainType instanceof TerrainTypeSlide) {
                    SlideTerrainCheck(toleranceTerrainType, escaper, hero, playerId, wasSliding, wasReversed)
                } else {
                    WalkTerrainCheck(lastTerrainType, currentTerrainType, escaper, hero, playerId, wasReversed)
                }
            } else {
                WalkTerrainCheck(lastTerrainType, currentTerrainType, escaper, hero, playerId, wasReversed)
            }
        }
    }

    const CreateCheckTerrainTrigger = (playerId: number) => {
        const checkTerrainTrigger = createEvent({
            events: [t => TriggerRegisterTimerEventPeriodic(t, Constants.CHECK_TERRAIN_PERIOD)],
            actions: [() => CheckTerrainActions(playerId)],
        })

        DisableTrigger(checkTerrainTrigger)
        return checkTerrainTrigger
    }

    return { CreateCheckTerrainTrigger, CheckTerrainActions }
}

export const CheckTerrainTrigger = initCheckTerrainTrigger()
