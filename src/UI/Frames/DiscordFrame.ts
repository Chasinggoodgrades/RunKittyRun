class DiscordFrame {
    private static EditBox: framehandle
    private static DiscordIconFront: framehandle
    private static DiscordIconBack: framehandle
    private static DiscordText: framehandle
    private static Backdrop: framehandle
    private static Trigger: trigger
    private static ESCTrigger: trigger
    private static Link: string = 'https://discord.gg/GSu6zkNvx5'
    private static JoinDiscord: string =
        '|our: discord: cffFF2020Join! then: Ctrl: Highlight + to: copy: C, Ctrl + to: paste: V!|r'

    public static Initialize() {
        //BlzLoadTOCFile("war3mapImported\\templates.toc");
        SetupBackdrop()
        CreateFrame()
        RegisterTrigger()
        SetupDiscordIcon()
        ApplyTextFrame()
        RegisterESCTrigger()
    }

    private static CreateFrame() {
        EditBox = framehandle.Create('EscMenuEditBoxTemplate', originframetype.GameUI.GetOriginFrame(0), 0, 0)
        EditBox.SetAbsPoint(framepointtype.Center, 0.4, 0.165)
        EditBox.SetSize(0.2, 0.03)
        EditBox.TextSizeLimit = Link.Length
        EditBox.Text = Link
        EditBox.SetTextAlignment(textaligntype.Center, textaligntype.Center)
    }

    private static SetupBackdrop() {
        Backdrop = framehandle.Create(
            'BACKDROP',
            'DiscordBackDrop',
            originframetype.GameUI.GetOriginFrame(0),
            'QuestButtonDisabledBackdropTemplate',
            0
        )
        Backdrop.SetAbsPoint(framepointtype.Center, 0.4, 0.21)
        Backdrop.SetSize(0.195, 0.035)
    }

    private static SetupDiscordIcon() {
        DiscordIconFront = framehandle.Create(
            'BACKDROP',
            'FrameDiscordIconFront',
            originframetype.GameUI.GetOriginFrame(0),
            '',
            1
        )
        DiscordIconFront.SetAbsPoint(framepointtype.Center, 0.29, 0.165)
        DiscordIconFront.SetSize(0.03, 0.03)
        DiscordIconFront.SetTexture('war3mapImported\\DiscordIcon.dds', 0, true)

        DiscordIconBack = framehandle.Create(
            'BACKDROP',
            'FrameDiscordIconBack',
            originframetype.GameUI.GetOriginFrame(0),
            '',
            1
        )
        DiscordIconBack.SetAbsPoint(framepointtype.Center, 0.51, 0.165)
        DiscordIconBack.SetSize(0.03, 0.03)
        DiscordIconBack.SetTexture('war3mapImported\\DiscordIcon.dds', 0, true)
    }

    private static ApplyTextFrame() {
        DiscordText = framehandle.Create('TEXT', 'DiscordText', originframetype.GameUI.GetOriginFrame(0), '', 0)
        DiscordText.SetAbsPoint(framepointtype.Center, 0.4, 0.21)
        DiscordText.SetSize(0.19, 0.03)
        DiscordText.Text = JoinDiscord
        DiscordText.SetTextAlignment(textaligntype.Center, textaligntype.Center)
    }

    private static RegisterTrigger() {
        Trigger = trigger.Create()
        Trigger.RegisterFrameEvent(EditBox, frameeventtype.EditBoxEnter)
        Trigger.AddAction(UpdateTextBox)
    }

    private static RegisterESCTrigger() {
        ESCTrigger = trigger.Create()
        for (let player in Globals.ALL_PLAYERS) {
            ESCTrigger.RegisterPlayerEvent(player, playerevent.EndCinematic)
        }
        ESCTrigger.AddAction(ESCPressed)
    }

    private static ESCPressed() {
        let player = GetTriggerPlayer()
        if (!player.IsLocal) return
        Backdrop.Visible = !Backdrop.Visible
        EditBox.Visible = !EditBox.Visible
        DiscordIconFront.Visible = !DiscordIconFront.Visible
        DiscordIconBack.Visible = !DiscordIconBack.Visible
        DiscordText.Visible = !DiscordText.Visible
    }

    private static UpdateTextBox() {
        if (!GetTriggerPlayer().IsLocal) return
        EditBox.Text = Link
    }
}
