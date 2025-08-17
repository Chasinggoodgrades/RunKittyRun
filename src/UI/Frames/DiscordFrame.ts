import { Globals } from 'src/Global/Globals'
import { blzCreateFrame, blzCreateFrameByType, getTriggerPlayer } from 'src/Utility/w3tsUtils'
import { Frame, Trigger } from 'w3ts'

export class DiscordFrame {
    private static EditBox: Frame
    private static DiscordIconFront: Frame
    private static DiscordIconBack: Frame
    private static DiscordText: Frame
    private static Backdrop: Frame
    private static triggerHandle: Trigger
    private static ESCTrigger: Trigger
    private static Link: string = 'https://discord.gg/GSu6zkNvx5'
    private static JoinDiscord: string =
        '|cffFF2020Join our discord! Highlight then Ctrl + C to copy, Ctrl + V to paste!|r'

    public static Initialize() {
        //BlzLoadTOCFile("war3mapImported\\templates.toc");
        DiscordFrame.SetupBackdrop()
        DiscordFrame.CreateFrame()
        DiscordFrame.RegisterTrigger()
        DiscordFrame.SetupDiscordIcon()
        DiscordFrame.ApplyTextFrame()
        DiscordFrame.RegisterESCTrigger()
    }

    private static CreateFrame() {
        DiscordFrame.EditBox = blzCreateFrame(
            'EscMenuEditBoxTemplate',
            Frame.fromHandle(BlzGetOriginFrame(ORIGIN_FRAME_GAME_UI, 0))!,
            0,
            0
        )
        DiscordFrame.EditBox.setAbsPoint(FRAMEPOINT_CENTER, 0.4, 0.165)
        DiscordFrame.EditBox.setSize(0.2, 0.03)
        DiscordFrame.EditBox.textSizeLimit = DiscordFrame.Link.length
        DiscordFrame.EditBox.text = DiscordFrame.Link
        BlzFrameSetTextAlignment(DiscordFrame.EditBox.handle, TEXT_JUSTIFY_CENTER, TEXT_JUSTIFY_CENTER)
    }

    private static SetupBackdrop() {
        DiscordFrame.Backdrop = blzCreateFrameByType(
            'BACKDROP',
            'DiscordBackDrop',
            Frame.fromHandle(BlzGetOriginFrame(ORIGIN_FRAME_GAME_UI, 0))!,
            'QuestButtonDisabledBackdropTemplate',
            0
        )
        DiscordFrame.Backdrop.setAbsPoint(FRAMEPOINT_CENTER, 0.4, 0.21)
        DiscordFrame.Backdrop.setSize(0.195, 0.035)
    }

    private static SetupDiscordIcon() {
        DiscordFrame.DiscordIconFront = blzCreateFrameByType(
            'BACKDROP',
            'FrameDiscordIconFront',
            Frame.fromHandle(BlzGetOriginFrame(ORIGIN_FRAME_GAME_UI, 0))!,
            '',
            1
        )
        DiscordFrame.DiscordIconFront.setAbsPoint(FRAMEPOINT_CENTER, 0.29, 0.165)
        DiscordFrame.DiscordIconFront.setSize(0.03, 0.03)
        DiscordFrame.DiscordIconFront.setTexture('war3mapImported\\DiscordIcon.dds', 0, true)

        DiscordFrame.DiscordIconBack = blzCreateFrameByType(
            'BACKDROP',
            'FrameDiscordIconBack',
            Frame.fromHandle(BlzGetOriginFrame(ORIGIN_FRAME_GAME_UI, 0))!,
            '',
            1
        )
        DiscordFrame.DiscordIconBack.setAbsPoint(FRAMEPOINT_CENTER, 0.51, 0.165)
        DiscordFrame.DiscordIconBack.setSize(0.03, 0.03)
        DiscordFrame.DiscordIconBack.setTexture('war3mapImported\\DiscordIcon.dds', 0, true)
    }

    private static ApplyTextFrame() {
        DiscordFrame.DiscordText = blzCreateFrameByType(
            'TEXT',
            'DiscordText',
            Frame.fromHandle(BlzGetOriginFrame(ORIGIN_FRAME_GAME_UI, 0))!,
            '',
            0
        )
        DiscordFrame.DiscordText.setAbsPoint(FRAMEPOINT_CENTER, 0.4, 0.21)
        DiscordFrame.DiscordText.setSize(0.19, 0.03)
        DiscordFrame.DiscordText.text = DiscordFrame.JoinDiscord
        BlzFrameSetTextAlignment(DiscordFrame.DiscordText.handle, TEXT_JUSTIFY_CENTER, TEXT_JUSTIFY_CENTER)
    }

    private static RegisterTrigger() {
        DiscordFrame.triggerHandle = Trigger.create()!
        DiscordFrame.triggerHandle.triggerRegisterFrameEvent(DiscordFrame.EditBox, FRAMEEVENT_EDITBOX_ENTER)
        DiscordFrame.triggerHandle.addAction(() => DiscordFrame.UpdateTextBox())
    }

    private static RegisterESCTrigger() {
        DiscordFrame.ESCTrigger = Trigger.create()!
        for (const player of Globals.ALL_PLAYERS) {
            DiscordFrame.ESCTrigger.registerPlayerEvent(player, EVENT_PLAYER_END_CINEMATIC)
        }
        DiscordFrame.ESCTrigger.addAction(() => DiscordFrame.ESCPressed())
    }

    private static ESCPressed() {
        const player = getTriggerPlayer()
        if (!player.isLocal()) return
        DiscordFrame.Backdrop.visible = !DiscordFrame.Backdrop.visible
        DiscordFrame.EditBox.visible = !DiscordFrame.EditBox.visible
        DiscordFrame.DiscordIconFront.visible = !DiscordFrame.DiscordIconFront.visible
        DiscordFrame.DiscordIconBack.visible = !DiscordFrame.DiscordIconBack.visible
        DiscordFrame.DiscordText.visible = !DiscordFrame.DiscordText.visible
    }

    private static UpdateTextBox() {
        if (!getTriggerPlayer().isLocal()) return
        DiscordFrame.EditBox.text = DiscordFrame.Link
    }
}
