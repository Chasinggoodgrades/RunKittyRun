import { IsIssuedOrder, StopUnit } from 'core/01_libraries/Basic_functions'
import { Hero2Escaper } from 'core/04_STRUCTURES/Escaper/Escaper_functions'
import { createEvent } from '../../../Utils/mapUtils'
import { Escaper } from '../../04_STRUCTURES/Escaper/Escaper'
import { Natives } from '../../wc3_natives_unsecured/Natives'

const TriggerActions = () => {
    Hero2Escaper(Natives.UGetTriggerUnit())?.getMake()?.doActions()
}

export abstract class Make {
    makerOwner: player
    kind: string //monsterMaking, monsterDeleting...
    t: trigger | null
    maker: unit | undefined
    escaper: Escaper
    orderX: number = 0
    orderY: number = 0
    forSpecificLevel: boolean

    constructor(maker: unit | undefined, kind: string, forSpecificLevel = true, escaper: Escaper | null = null) {
        this.maker = maker
        this.kind = kind

        if (maker) {
            escaper = Hero2Escaper(maker)
            this.makerOwner = GetOwningPlayer(maker)
        }

        if (!escaper) {
            throw 'Make : escaper not found'
        }

        this.escaper = escaper
        this.makerOwner = escaper.getPlayer()

        this.t = null
        this.enableTrigger()

        this.forSpecificLevel = forSpecificLevel
    }

    destroy() {
        if (this.t) {
            DestroyTrigger(this.t)
        }
    }

    doBaseActions() {
        const targetWidget = GetOrderTarget()
        if (!!targetWidget) {
            this.orderX = GetWidgetX(targetWidget)
            this.orderY = GetWidgetX(targetWidget)
        } else {
            if (!IsIssuedOrder('smart')) {
                return false
            }

            this.orderX = GetOrderPointX()
            this.orderY = GetOrderPointY()
        }

        if (this.escaper.roundToGrid) {
            this.orderX = Math.round(this.orderX / this.escaper.roundToGrid) * this.escaper.roundToGrid
            this.orderY = Math.round(this.orderY / this.escaper.roundToGrid) * this.escaper.roundToGrid
        }

        this.maker && StopUnit(this.maker)
        return true
    }

    abstract doActions(this: void): void

    enableTrigger = () => {
        if (this.t) DestroyTrigger(this.t)

        if (this.maker) {
            this.t = createEvent({
                events: [
                    t => this.maker && TriggerRegisterUnitEvent(t, this.maker, EVENT_UNIT_ISSUED_POINT_ORDER),
                    t => this.maker && TriggerRegisterUnitEvent(t, this.maker, EVENT_UNIT_ISSUED_TARGET_ORDER),
                ],
                actions: [TriggerActions],
            })
        }
    }

    cancelLastAction = () => {
        return false
    }

    redoLastAction = () => {
        return false
    }
}
