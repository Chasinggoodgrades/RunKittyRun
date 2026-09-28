import { Text } from 'core/01_libraries/Text'
import { Level } from '../../04_STRUCTURES/Level/Level'
import { MakeAction } from './MakeAction'

type ISetCb<A, T> = (targetObject: A, propertyValue: T) => void

export class MakePropertyChangeAction<A, T> extends MakeAction {
    private targetObject: A

    private propertyName: string
    private propertyValue: T

    private setCb: ISetCb<A, T>

    private oldPropertyValue: T

    constructor(
        level: Level,
        targetObject: A,
        propertyName: string,
        propertyValue: T,
        setCb: ISetCb<A, T>,
        oldPropertyValue: T
    ) {
        super(level)
        this.targetObject = targetObject

        this.propertyName = propertyName
        this.propertyValue = propertyValue

        this.setCb = setCb

        this.oldPropertyValue = oldPropertyValue
    }

    destroy = () => {}

    cancel = () => {
        if (!this.isActionMadeB) {
            return false
        }

        this.isActionMadeB = false

        this.setCb(this.targetObject, this.oldPropertyValue)
        this.owner && Text.P(this.owner.getPlayer(), `Undo '${this.propertyName}' to '${this.oldPropertyValue}'`)
        return true
    }

    redo = () => {
        if (this.isActionMadeB) {
            return false
        }

        this.isActionMadeB = true

        this.setCb(this.targetObject, this.propertyValue)
        this.owner && Text.P(this.owner.getPlayer(), `Redo '${this.propertyName}' to '${this.propertyValue}'`)
        return true
    }
}
