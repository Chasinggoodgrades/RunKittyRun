import { Globals } from 'src/Global/Globals'
import { Colors } from 'src/Utility/Colors/Colors'
import { blzCreateFrameByType, getTriggerPlayer } from 'src/Utility/w3tsUtils'
import { Frame, Trigger } from 'w3ts'

export const CreateHeaderFrame = (parent: Frame): Frame => {
    let header = blzCreateFrameByType(
        'BACKDROP',
        `${parent.getName()}Header`,
        parent,
        'QuestButtonDisabledBackdropTemplate',
        0
    )
    let width = parent.width
    let height = 0.0225
    header.setPoint(FRAMEPOINT_TOPLEFT, parent, FRAMEPOINT_TOPLEFT, 0, 0.0125)
    header.setSize(width, height)

    let title = blzCreateFrameByType('TEXT', `${parent.getName()}Title`, header, 'ScriptDialogText', 0)
    title.setPoint(FRAMEPOINT_CENTER, header, FRAMEPOINT_CENTER, 0, 0)
    title.setSize(width, height)
    title.text = `${Colors.COLOR_YELLOW}${parent.getName()}${Colors.COLOR_RESET}`
    BlzFrameSetTextAlignment(title.handle, TEXT_JUSTIFY_CENTER, TEXT_JUSTIFY_CENTER)

    let closeButton = blzCreateFrameByType(
        'GLUETEXTBUTTON',
        `${parent.getName()}CloseButton`,
        header,
        'ScriptDialogButton',
        0
    )
    closeButton.setPoint(FRAMEPOINT_TOPRIGHT, header, FRAMEPOINT_TOPRIGHT, -0.0025, -0.0025)
    closeButton.setSize(height - 0.005, height - 0.005)
    closeButton.text = 'X'

    // Close Actions
    let closeTrigger = Trigger.create()!
    closeTrigger.triggerRegisterFrameEvent(closeButton, FRAMEEVENT_CONTROL_CLICK)
    closeTrigger.addAction(() => {
        if (!getTriggerPlayer().isLocal()) return
        parent.visible = false
    })

    return header
}

export const HideOtherFrames = (currentFrame: Frame) => {
    for (let i = 0; i < Globals.AllFrames.length; i++) {
        if (Globals.AllFrames[i] !== currentFrame) Globals.AllFrames[i].visible = false
    }
}
