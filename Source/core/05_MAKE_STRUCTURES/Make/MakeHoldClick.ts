import { getUdgEscapers } from '../../../../globals'
import { createEvent } from '../../../Utils/mapUtils'
import { Escaper } from '../../04_STRUCTURES/Escaper/Escaper'
import { Make } from './Make'
import { Natives } from '../../wc3_natives_unsecured/Natives'

export const MIN_TIME_BETWEEN_ACTIONS = null

const onPressActions = () => {
    const escaper = getUdgEscapers().get(GetPlayerId(Natives.UGetTriggerPlayer()))
    const make = escaper?.getMake()

    if (make instanceof MakeHoldClick) {
        make.doPressActions()
    }
}

const onUnpressActions = () => {
    const escaper = getUdgEscapers().get(GetPlayerId(Natives.UGetTriggerPlayer()))
    const make = escaper?.getMake()

    if (make instanceof MakeHoldClick) {
        make.doUnpressActions()
    }
}

const onMouseMoveActions = () => {
    const escaper = getUdgEscapers().get(GetPlayerId(Natives.UGetTriggerPlayer()))
    const make = escaper?.getMake()

    if (make instanceof MakeHoldClick) {
        make.doMouseMoveActions()
    }
}

/**
 * Class MakeHoldClick
 */
export abstract class MakeHoldClick extends Make {
    protected activeBtn: mousebuttontype | null = null
    private activeBtnStr = ''
    private isPressed = false

    private tPress: trigger | null = null
    private tUnpress: trigger | null = null
    private tMouseMove: trigger | null = null

    private tTimeSinceLastMouseMove?: timer
    private timeSinceLastMouseMove: number = 1000 //high time

    protected mouseX: number = 0
    protected mouseY: number = 0

    protected currentClickMinX = 0
    protected currentClickMinY = 0
    protected currentClickMaxX = 0
    protected currentClickMaxY = 0

    constructor(escaper: Escaper, kind: string, forSpecificLevel: boolean) {
        super(escaper.getHero(), kind, forSpecificLevel, escaper)
        this.enableTriggersMouse()
    }

    updateCurrentClickMinMaxLocations = () => {
        if (this.currentClickMinX == 0 || this.escaper.mouseX < this.currentClickMinX) {
            this.currentClickMinX = this.escaper.mouseX
        }
        if (this.currentClickMinY == 0 || this.escaper.mouseY < this.currentClickMinY) {
            this.currentClickMinY = this.escaper.mouseY
        }
        if (this.currentClickMaxX == 0 || this.escaper.mouseX > this.currentClickMaxX) {
            this.currentClickMaxX = this.escaper.mouseX
        }
        if (this.currentClickMaxY == 0 || this.escaper.mouseY > this.currentClickMaxY) {
            this.currentClickMaxY = this.escaper.mouseY
        }
    }

    resetCurrentClickMinMaxLocations = () => {
        this.currentClickMinX = 0
        this.currentClickMinY = 0
        this.currentClickMaxX = 0
        this.currentClickMaxY = 0
    }

    enableTriggersMouse = () => {
        this.tPress && DestroyTrigger(this.tPress)
        this.tUnpress && DestroyTrigger(this.tUnpress)
        this.tMouseMove && DestroyTrigger(this.tMouseMove)

        this.tPress = createEvent({
            events: [t => TriggerRegisterPlayerEvent(t, this.makerOwner, EVENT_PLAYER_MOUSE_DOWN)],
            actions: [onPressActions],
        })

        this.tUnpress = createEvent({
            events: [t => TriggerRegisterPlayerEvent(t, this.makerOwner, EVENT_PLAYER_MOUSE_UP)],
            actions: [onUnpressActions],
        })

        this.tMouseMove = createEvent({
            events: [t => TriggerRegisterPlayerEvent(t, this.makerOwner, EVENT_PLAYER_MOUSE_MOVE)],
            actions: [onMouseMoveActions],
        })
    }

    doActions = () => {
        super.doBaseActions() //stop the hero if he's controlled, the actions aren't actually done here
    }

    doPressActions() {
        this.activeBtn = Natives.UBlzGetTriggerPlayerMouseButton()
        this.activeBtnStr = this.activeBtn == MOUSE_BUTTON_TYPE_LEFT ? 'left' : 'right'
        this.isPressed = true

        this.resetCurrentClickMinMaxLocations()

        this.doMouseMoveActions()
    }

    doUnpressActions() {
        this.isPressed = false
    }

    doMouseMoveActions() {
        if (this.isPressed) {
            this.escaper.mouseX = BlzGetTriggerPlayerMouseX()
            this.escaper.mouseY = BlzGetTriggerPlayerMouseY()
            this.updateCurrentClickMinMaxLocations()

            if (this.tTimeSinceLastMouseMove) {
                this.timeSinceLastMouseMove = TimerGetElapsed(this.tTimeSinceLastMouseMove)
            }
            this.tTimeSinceLastMouseMove && DestroyTimer(this.tTimeSinceLastMouseMove)
            this.tTimeSinceLastMouseMove = CreateTimer()
            TimerStart(this.tTimeSinceLastMouseMove, 10, false, DoNothing)

            return MIN_TIME_BETWEEN_ACTIONS === null || this.timeSinceLastMouseMove >= MIN_TIME_BETWEEN_ACTIONS
        }

        return false
    }

    //abstract doMouseMoveActions: () => boolean

    destroy() {
        super.destroy()

        this.tPress && DestroyTrigger(this.tPress)
        this.tUnpress && DestroyTrigger(this.tUnpress)
        this.tMouseMove && DestroyTrigger(this.tMouseMove)
    }
}
