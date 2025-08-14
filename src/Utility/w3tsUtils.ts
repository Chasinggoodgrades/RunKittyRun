import { Frame, Item, MapPlayer, Unit } from 'w3ts'

// Not sure if these mappings are correct so I didn't replace them everywhere yet.
// They should also be optional but fuck it for now

export const getFilterUnit = () => Unit.fromFilter()!
export const getTriggerUnit = () => Unit.fromHandle(GetTriggerUnit())!

export const getTriggerPlayer = () => MapPlayer.fromHandle(GetTriggerPlayer())!

export const getManipulatedItem = () => Item.fromHandle(GetManipulatedItem())!

export const blzCreateFrameByType = (type: string, name: string, parent: Frame, template: string, id: number) => {
    return Frame.createType(name, parent, id, template, type)!
}

export const blzCreateFrame = (type: string, parent: Frame, template: number, id: number) => {
    return Frame.createType('', parent, id, template as any, type)! // TODO; Most def wrong native call
}

export const blzGetFrameByName = (name: string, id: number) => {
    return Frame.fromName(name, id)!
}
