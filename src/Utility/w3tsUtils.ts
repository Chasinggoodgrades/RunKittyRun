import { Frame, Item, MapPlayer, Unit } from 'w3ts'

// Not sure if these mappings are correct so I didn't replace them everywhere yet.
// They should also be optional but fuck it for now

export const getFilterUnit = () => Unit.fromFilter()!
export const getTriggerUnit = () => Unit.fromHandle(GetTriggerUnit())!

export const getTriggerPlayer = () => MapPlayer.fromHandle(GetTriggerPlayer())!

export const getManipulatedItem = () => Item.fromHandle(GetManipulatedItem())!

export const getKillingUnit = () => Unit.fromHandle(GetKillingUnit())!

export const blzCreateFrameByType = (type: string, name: string, parent: Frame, template: string, id: number) => {
    return Frame.fromHandle(BlzCreateFrameByType(type, name, parent.handle, template, id))! // idk what was happening but the other 1 just didn't create anything
}

export const blzCreateFrame = (name: string, parent: Frame, priority: number, createContext: number) => {
    return Frame.create(name, parent, priority, createContext)! // TODO
}

export const blzGetFrameByName = (name: string, id: number) => {
    return Frame.fromName(name, id)!
}
