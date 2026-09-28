import { Text } from 'core/01_libraries/Text'
import { Make } from 'core/05_MAKE_STRUCTURES/Make/Make'
import { MakePropertyChangeAction } from '../MakeLastActions/MakePropertyChangeAction'

type IValidCb<A> = (x: number, y: number) => NonNullable<A> | null | undefined
type IGetCb<A, T> = (targetObject: NonNullable<A>) => T
type ISetCb<A, T> = (targetObject: NonNullable<A>, propertyValue: T) => void

export class MakePropertyChange<A, T> extends Make {
    private propertyName: string
    private propertyValue: T

    private validCb: IValidCb<A>
    private getCb: IGetCb<A, T>
    private setCb: ISetCb<A, T>

    constructor(
        maker: unit,
        propertyName: string,
        propertyValue: T,
        validCb: IValidCb<A>,
        getCb: IGetCb<A, T>,
        setCb: ISetCb<A, T>
    ) {
        super(maker, 'makePropertyChange')

        this.propertyName = propertyName
        this.propertyValue = propertyValue

        this.validCb = validCb
        this.getCb = getCb
        this.setCb = setCb
    }

    doActions = () => {
        if (super.doBaseActions()) {
            const targetObject = this.validCb(this.orderX, this.orderY)

            if (!targetObject) {
                Text.erP(this.makerOwner, 'invalid object clicked for your making level')
                return
            }

            const oldPropertyValue = this.getCb(targetObject)
            this.setCb(targetObject, this.propertyValue)
            Text.P(this.makerOwner, `Changed '${this.propertyName}' to '${this.propertyValue}'`)
            this.escaper.destroyMake()

            this.escaper.newAction(
                new MakePropertyChangeAction(
                    this.escaper.getMakingLevel(),
                    targetObject,
                    this.propertyName,
                    this.propertyValue,
                    this.setCb,
                    oldPropertyValue
                )
            )
        }
    }
}
