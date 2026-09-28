import { AutoContinueAfterSliding } from 'core/07_TRIGGERS/Slide_and_CheckTerrain_triggers/Auto_continue_after_sliding'
import { getUdgEscapers } from '../../../globals'
import { createEvent } from '../../Utils/mapUtils'
import { Escaper } from '../04_STRUCTURES/Escaper/Escaper'
import { TurnOnSlide } from '../07_TRIGGERS/Slide_and_CheckTerrain_triggers/To_turn_on_slide'
import { Natives } from '../wc3_natives_unsecured/Natives'

const FOLLOW_MOUSE_PERIOD = 0.2

/**
 * Class SimpleFollowMouse - Active while holding right mouse button
 */
export class SimpleFollowMouse {
    private escaper: Escaper

    private tPress: trigger
    private tUnpress: trigger
    private tMouseMove: trigger | undefined

    private tFollowMouse: timer
    private tMouseMoveThrottle: timer | undefined

    public angle?: number
    public isActive = false

    constructor(escaper: Escaper) {
        this.escaper = escaper

        const player = escaper.getPlayer()

        this.tPress = createEvent({
            events: [t => TriggerRegisterPlayerEvent(t, player, EVENT_PLAYER_MOUSE_DOWN)],
            actions: [
                () => {
                    const escaper = getUdgEscapers().get(GetPlayerId(Natives.UGetTriggerPlayer()))
                    const followMouse = escaper?.getSimpleFollowMouse()

                    if (followMouse) {
                        const activeBtn = Natives.UBlzGetTriggerPlayerMouseButton()

                        if (activeBtn == MOUSE_BUTTON_TYPE_RIGHT) {
                            this.isActive = true
                        }
                    }
                },
            ],
        })

        this.tUnpress = createEvent({
            events: [t => TriggerRegisterPlayerEvent(t, player, EVENT_PLAYER_MOUSE_UP)],
            actions: [
                () => {
                    const escaper = getUdgEscapers().get(GetPlayerId(Natives.UGetTriggerPlayer()))
                    const followMouse = escaper?.getSimpleFollowMouse()

                    if (followMouse) {
                        const activeBtn = Natives.UBlzGetTriggerPlayerMouseButton()

                        if (activeBtn == MOUSE_BUTTON_TYPE_RIGHT) {
                            this.isActive = false
                        }
                    }
                },
            ],
        })

        this.createMouseMoveTrigger(player)

        // Create throttle timer to recreate mouse move trigger (5 times per second)
        this.tMouseMoveThrottle = CreateTimer()
        TimerStart(this.tMouseMoveThrottle, FOLLOW_MOUSE_PERIOD, true, () => {
            if (!this.tMouseMove) {
                this.createMouseMoveTrigger(player)
            }
        })

        // Create the timer and start it immediately
        this.tFollowMouse = CreateTimer()
        TimerStart(this.tFollowMouse, FOLLOW_MOUSE_PERIOD, true, () => {
            const slider = escaper?.getHero()

            if (escaper && slider) {
                const followMouse = escaper.getSimpleFollowMouse()

                if (followMouse && followMouse.isActive) {
                    if (escaper.isSliding()) {
                        //let's face mouse
                        followMouse.angle && TurnOnSlide.turnSliderToDirection(escaper, followMouse.angle)
                    }
                }
            }
        })
    }

    private onMouseMoveAction(this: void) {
        const escaper = getUdgEscapers().get(GetPlayerId(Natives.UGetTriggerPlayer()))
        const dis = escaper?.getSimpleFollowMouse()

        if (!dis) {
            return
        }

        const followMouse = escaper?.getSimpleFollowMouse()

        if (followMouse) {
            if (BlzGetTriggerPlayerMouseX() == 0 && BlzGetTriggerPlayerMouseY() == 0) {
                return
            }

            dis.escaper.mouseX = BlzGetTriggerPlayerMouseX()
            dis.escaper.mouseY = BlzGetTriggerPlayerMouseY()

            const slider = dis.escaper.getHero()

            if (slider) {
                const sliderX = dis.escaper.getHeroX()
                const sliderY = dis.escaper.getHeroY()
                const orderX = dis.escaper.mouseX
                const orderY = dis.escaper.mouseY
                dis.angle = Atan2(orderY - sliderY, orderX - sliderX) * bj_RADTODEG

                if (dis.isActive) {
                    AutoContinueAfterSliding.lastClickedX[dis.escaper.getId()] = orderX
                    AutoContinueAfterSliding.lastClickedY[dis.escaper.getId()] = orderY
                    AutoContinueAfterSliding.isLastTargetALocation[dis.escaper.getId()] = true
                }
            }
        }

        // Destroy the trigger after processing
        if (dis.tMouseMove) {
            DestroyTrigger(dis.tMouseMove)
            dis.tMouseMove = undefined
        }
    }

    private createMouseMoveTrigger(player: player) {
        this.tMouseMove = CreateTrigger()
        TriggerRegisterPlayerEvent(this.tMouseMove, player, EVENT_PLAYER_MOUSE_MOVE)
        TriggerAddAction(this.tMouseMove, this.onMouseMoveAction)
    }

    destroy = () => {
        this.isActive = false
        DestroyTimer(this.tFollowMouse)
        this.tMouseMoveThrottle && DestroyTimer(this.tMouseMoveThrottle)
        this.tPress && DestroyTrigger(this.tPress)
        this.tUnpress && DestroyTrigger(this.tUnpress)
        this.tMouseMove && DestroyTrigger(this.tMouseMove)
    }
}
