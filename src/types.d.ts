import 'w3ts'
import { Effect } from 'w3ts'

declare module 'w3ts' {
    interface MapPlayer {
        DisplayTimedTextTo(duration: number, message: string): void
        DisplayTextTo(message: string): void
        getGold(): number
        setGold(amount: number): void
        addGold(amount: number): void
        getLumber(): number
        setLumber(amount: number): void
        addLumber(amount: number): void
    }

    interface Rectangle {
        includes(x: number, y: number): boolean
        region(): region
    }

    interface Multiboard {
        GetItem(row: number, column: number): MultiboardItem
        SetChildVisibility(visible: boolean, fade: boolean): void
    }

    interface MultiboardItem {
        setText(text: string): void
        setVisible(visible: boolean, fade: boolean): void
    }

    interface Unit {
        issueImmediateOrderById(orderId: number): void
        addSpecialEffectTarget(model: string, attachmentPoint: string): Effect
    }

    interface Frame {
        getName(): string
    }

    interface Trigger {
        addCondition(condition: boolexpr | (() => boolean)): triggercondition | undefined
    }
}

export {}
