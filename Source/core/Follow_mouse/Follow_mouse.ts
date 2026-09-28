import { getUdgEscapers } from '../../../globals'
import { createEvent } from '../../Utils/mapUtils'
import { Escaper } from '../04_STRUCTURES/Escaper/Escaper'
import { AutoContinueAfterSliding } from '../07_TRIGGERS/Slide_and_CheckTerrain_triggers/Auto_continue_after_sliding'
import { TurnOnSlide } from '../07_TRIGGERS/Slide_and_CheckTerrain_triggers/To_turn_on_slide'
import { Natives } from '../wc3_natives_unsecured/Natives'

export const PRESS_TIME_TO_ENABLE_FOLLOW_MOUSE = 0.2
const FOLLOW_MOUSE_PERIOD = 0.1

const onPressActions = () => {
    const escaper = getUdgEscapers().get(GetPlayerId(Natives.UGetTriggerPlayer()))
    const followMouse = escaper?.getFollowMouse()
    followMouse && followMouse.doPressActions()
}

const onUnpressActions = () => {
    const escaper = getUdgEscapers().get(GetPlayerId(Natives.UGetTriggerPlayer()))
    const followMouse = escaper?.getFollowMouse()
    followMouse && followMouse.doUnpressActions()
}

const onMouseMoveActions = () => {
    const escaper = getUdgEscapers().get(GetPlayerId(Natives.UGetTriggerPlayer()))
    const followMouse = escaper?.getFollowMouse()
    followMouse && followMouse.doMouseMoveActions()
}

const followMouseActions = () => {
    const escaper = FollowMouse.anyTimer2escaper.get(Natives.UGetExpiredTimer())
    const slider = escaper?.getHero()

    if (escaper && slider) {
        const followMouse = escaper.getFollowMouse()

        if (followMouse) {
            if (escaper.isSliding()) {
                //let's face mouse
                followMouse.angle && TurnOnSlide.turnSliderToDirection(escaper, followMouse.angle)
            } else {
                followMouse.onStopSliding()
            }
        }
    }
}

/**
 * Class FollowMouse
 */
export class FollowMouse {
    private escaper: Escaper

    private tPress: trigger
    private tUnpress: trigger
    private tMouseMove?: trigger

    private tClickingTime?: timer
    private tFollowMouse?: timer

    static anyTimer2escaper = new Map<timer, Escaper>()

    public angle?: number
    private neverDisable: boolean

    constructor(escaper: Escaper, neverDisable: boolean) {
        this.escaper = escaper
        this.neverDisable = neverDisable

        const player = escaper.getPlayer()

        this.tPress = createEvent({
            events: [t => TriggerRegisterPlayerEvent(t, player, EVENT_PLAYER_MOUSE_DOWN)],
            actions: [onPressActions],
        })

        this.tUnpress = createEvent({
            events: [t => TriggerRegisterPlayerEvent(t, player, EVENT_PLAYER_MOUSE_UP)],
            actions: [onUnpressActions],
        })
    }

    doPressActions = () => {
        const activeBtn = Natives.UBlzGetTriggerPlayerMouseButton()
        if (activeBtn == MOUSE_BUTTON_TYPE_RIGHT) {
            this.tClickingTime = CreateTimer()
            TimerStart(this.tClickingTime, 60, false, DoNothing)

            !this.neverDisable && this.stopFollowingMouse()
        }
    }

    doUnpressActions = () => {
        const activeBtn = Natives.UBlzGetTriggerPlayerMouseButton()
        if (activeBtn == MOUSE_BUTTON_TYPE_RIGHT && this.tClickingTime) {
            const elapsedTime = TimerGetElapsed(this.tClickingTime)
            DestroyTimer(this.tClickingTime)

            if (elapsedTime >= PRESS_TIME_TO_ENABLE_FOLLOW_MOUSE) {
                //enabling
                this.startFollowingMouse()
            }
        }
    }

    doMouseMoveActions() {
        if (BlzGetTriggerPlayerMouseX() == 0 && BlzGetTriggerPlayerMouseY() == 0) {
            return
        }

        this.escaper.mouseX = BlzGetTriggerPlayerMouseX()
        this.escaper.mouseY = BlzGetTriggerPlayerMouseY()

        const slider = this.escaper.getHero()
        if (slider) {
            const sliderX = this.escaper.getHeroX()
            const sliderY = this.escaper.getHeroY()
            const orderX = this.escaper.mouseX
            const orderY = this.escaper.mouseY
            this.angle = Atan2(orderY - sliderY, orderX - sliderX) * bj_RADTODEG

            if (this.tFollowMouse) {
                AutoContinueAfterSliding.lastClickedX[this.escaper.getId()] = orderX
                AutoContinueAfterSliding.lastClickedY[this.escaper.getId()] = orderY
                AutoContinueAfterSliding.isLastTargetALocation[this.escaper.getId()] = true
            }
        }
    }

    startFollowingMouse = () => {
        this.tFollowMouse = CreateTimer()
        TimerStart(this.tFollowMouse, FOLLOW_MOUSE_PERIOD, true, followMouseActions)
        FollowMouse.anyTimer2escaper.set(this.tFollowMouse, this.escaper)

        this.tMouseMove && DestroyTrigger(this.tMouseMove)

        this.tMouseMove = createEvent({
            events: [t => TriggerRegisterPlayerEvent(t, this.escaper.getPlayer(), EVENT_PLAYER_MOUSE_MOVE)],
            actions: [onMouseMoveActions],
        })
    }

    stopFollowingMouse = () => {
        if (this.tFollowMouse) {
            FollowMouse.anyTimer2escaper.delete(this.tFollowMouse)
            DestroyTimer(this.tFollowMouse)
            delete this.tFollowMouse

            this.tMouseMove && DestroyTrigger(this.tMouseMove)
            delete this.angle
        }
    }

    onStopSliding = () => {
        this.stopFollowingMouse()
    }

    destroy = () => {
        this.stopFollowingMouse()
        this.tPress && DestroyTrigger(this.tPress)
        this.tUnpress && DestroyTrigger(this.tUnpress)
        this.tClickingTime && DestroyTimer(this.tClickingTime)
    }
}
