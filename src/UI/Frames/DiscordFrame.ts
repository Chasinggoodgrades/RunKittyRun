import { Globals } from 'src/Global/Globals'
import { blzCreateFrameByType, getTriggerPlayer } from 'src/Utility/w3tsUtils'
import { Frame, Trigger } from 'w3ts'

export class DiscordFrame {
    private static EditBox: Frame
    private static DiscordIconFront: Frame
    private static DiscordIconBack: Frame
    private static DiscordText: Frame
    private static Backdrop: Frame
    private static Trigger: Trigger
    private static ESCTrigger: Trigger
    private static Link: string = 'https://discord.gg/GSu6zkNvx5'
    private static JoinDiscord: string =
        '|our: discord: cffFF2020Join! then: Ctrl: Highlight + to: copy: C, Ctrl + to: paste: V!|r'

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
        DiscordFrame.EditBox = blzCreateFrameByType(
            'EscMenuEditBoxTemplate',
            Frame.fromHandle(BlzGetOriginFrame(ORIGIN_FRAME_GAME_UI, 0))!,
            0,
            0
        )
        DiscordFrame.EditBox.setAbsPoint(FRAMEPOINT_CENTER, 0.4, 0.165)
        DiscordFrame.EditBox.setSize(0.2, 0.03)
        DiscordFrame.EditBox.TextSizeLimit = DiscordFrame.Link.length
        DiscordFrame.EditBox.text = DiscordFrame.Link
        DiscordFrame.EditBox.SetTextAlignment(textaligntype.Center, textaligntype.Center)
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
        DiscordFrame.DiscordText.SetTextAlignment(textaligntype.Center, textaligntype.Center)
    }

    private static RegisterTrigger() {
        DiscordFrame.Trigger = DiscordFrame.Trigger.create()!
        DiscordFrame.Trigger.triggerRegisterFrameEvent(DiscordFrame.EditBox, frameeventtype.EditBoxEnter)
        DiscordFrame.Trigger.addAction(DiscordFrame.UpdateTextBox)
    }

    private static RegisterESCTrigger() {
        DiscordFrame.ESCTrigger = DiscordFrame.Trigger.create()!
        for (let player of Globals.ALL_PLAYERS) {
            DiscordFrame.ESCTrigger.registerPlayerEvent(player, EVENT_PLAYER_END_CINEMATIC)
        }
        DiscordFrame.ESCTrigger.addAction(DiscordFrame.ESCPressed)
    }

    private static ESCPressed() {
        let player = getTriggerPlayer()
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
