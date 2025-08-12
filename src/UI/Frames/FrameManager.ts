export class FrameManager {
    public static StatsTrigger: trigger = CreateTrigger()
    public static ShopTrigger: trigger = CreateTrigger()
    public static RewardsTrigger: trigger = CreateTrigger()
    public static MusicButton: framehandle
    public static ShopButton: framehandle
    public static RewardsButton: framehandle
    public static Backdrop: framehandle

    private ButtonWidth: number = 0.053
    private ButtonHeight: number = 0.028

    private static GameUI: framehandle = originframetype.GameUI.GetOriginFrame(0)
    private static ESCTrigger: trigger = CreateTrigger()
    private static TEXT_COLOR: string = Colors.COLOR_YELLOW
    private static HOTKEY_COLOR: string = Colors.COLOR_YELLOW_ORANGE

    private static readonly _cachedUIPosition: Action = RepositionBackdropAction()
    private static _frames: framehandle[] = []

    public static Initialize() {
        try {
            BlzLoadTOCFile('war3mapImported\\templates.toc')
            RemoveUnwantedFrames()
            ButtonsBackdrop()
            CreateRewardsButton()
            CreateMusicButton()
            CreateShopButton()
            MusicFrame.Initialize()
            Utility.SimpleTimer(1.0, ESCHideFrames)
        } catch (ex) {
            Logger.Critical('Error in FrameManager.Initialize: {ex.Message}')
            throw ex
        }
    }

    public static InitAllFrames() {
        ShopFrame.Initialize()
        RewardsFrame.Initialize()
        InitalizeButtons()
        InitFramesList()
    }

    public static InitalizeButtons() {
        Backdrop.Visible = true
        RewardsButton.Visible = true
        MusicButton.Visible = true
        ShopButton.Visible = true
    }

    public static CreateHeaderFrame(parent: framehandle): framehandle {
        let header = BlzCreateFrameByType(
            'BACKDROP',
            '{parent.Name}Header',
            parent,
            'QuestButtonDisabledBackdropTemplate',
            0
        )
        let width = parent.Width
        let height = 0.0225
        header.SetPoint(framepointtype.TopLeft, 0, 0.0125, parent, framepointtype.TopLeft)
        header.SetSize(width, height)

        let title = BlzCreateFrameByType('TEXT', '{parent.Name}Title', header, 'ScriptDialogText', 0)
        title.SetPoint(framepointtype.Center, 0, 0, header, framepointtype.Center)
        title.SetSize(width, height)
        title.Text = '{Colors.COLOR_YELLOW}{parent.Name}{Colors.COLOR_RESET}'
        title.SetTextAlignment(textaligntype.Center, textaligntype.Center)

        let closeButton = BlzCreateFrameByType(
            'GLUETEXTBUTTON',
            '{parent.Name}CloseButton',
            header,
            'ScriptDialogButton',
            0
        )
        closeButton.SetPoint(framepointtype.TopRight, -0.0025, -0.0025, header, framepointtype.TopRight)
        closeButton.SetSize(height - 0.005, height - 0.005)
        closeButton.Text = 'X'

        // Close Actions
        let closeTrigger = CreateTrigger()
        closeTrigger.RegisterFrameEvent(closeButton, frameeventtype.Click)
        closeTrigger.AddAction(() => {
            if (GetLocalPlayer() != GetTriggerPlayer()) return
            parent.Visible = false
        })

        return header
    }

    private static RemoveUnwantedFrames() {
        let resourceBarText = BlzGetFrameByName('ResourceBarSupplyText', 0)
        BlzFrameGetChild(BlzFrameGetChild(GameUI, 5), 0)
        resourceBarText.Text = '0:00'
        //timeDayDisplay.Visible = false;
    }

    private static InitFramesList() {
        _frames.push(ShopFrame.shopFrame)
        _frames.push(RewardsFrame.RewardFrame)
        _frames.push(MusicFrame.MusicFramehandle)
    }

    private static CreateRewardsButton() {
        RewardsButton = BlzCreateFrameByType('GLUETEXTBUTTON', 'RewardsButton', Backdrop, 'ScriptDialogButton', 0)
        RewardsButton.SetPoint(framepointtype.Center, 0, 0, Backdrop, framepointtype.Center)
        RewardsButton.SetSize(ButtonWidth, ButtonHeight)
        let shopText = BlzCreateFrameByType('TEXT', 'RewardsText', RewardsButton, '', 0)
        shopText.Text = '{TEXT_COLOR}Rewards{HOTKEY_COLOR}(-)|r'
        shopText.SetPoint(framepointtype.Center, 0, 0, RewardsButton, framepointtype.Center)
        shopText.SetScale(0.9)
        shopText.Enabled = false
        RewardsTrigger.RegisterFrameEvent(RewardsButton, frameeventtype.Click)
        RewardsTrigger.AddAction(ErrorHandler.Wrap(RewardsFrame.RewardsFrameActions))
        RewardsButton.Visible = false
    }

    private static CreateMusicButton() {
        MusicButton = BlzCreateFrameByType('GLUETEXTBUTTON', 'MusicButton', Backdrop, 'ScriptDialogButton', 0)
        MusicButton.SetPoint(framepointtype.TopRight, 0, 0, RewardsButton, framepointtype.TopLeft)
        MusicButton.SetSize(ButtonWidth, ButtonHeight)
        let shopText = BlzCreateFrameByType('TEXT', 'MusicText', MusicButton, '', 0)
        shopText.Text = '{TEXT_COLOR}Music{HOTKEY_COLOR}(0)'
        shopText.SetPoint(framepointtype.Center, 0, 0, MusicButton, framepointtype.Center)
        shopText.SetScale(0.98)
        shopText.Enabled = false
        StatsTrigger.RegisterFrameEvent(MusicButton, frameeventtype.Click)
        StatsTrigger.AddAction(ErrorHandler.Wrap(MusicFrame.MusicFrameActions))
        MusicButton.Visible = false
    }

    private static CreateShopButton() {
        ShopButton = BlzCreateFrameByType('GLUETEXTBUTTON', 'ShopButton', Backdrop, 'ScriptDialogButton', 0)
        ShopButton.SetPoint(framepointtype.TopLeft, 0, 0, RewardsButton, framepointtype.TopRight)
        ShopButton.SetSize(ButtonWidth, ButtonHeight)
        let shopText = BlzCreateFrameByType('TEXT', 'ShopText', ShopButton, '', 0)
        shopText.Text = '{TEXT_COLOR}Shop{HOTKEY_COLOR}(=)'
        shopText.SetPoint(framepointtype.Center, 0, 0, ShopButton, framepointtype.Center)
        shopText.SetScale(1.0)
        shopText.Enabled = false
        ShopTrigger.RegisterFrameEvent(ShopButton, frameeventtype.Click)
        ShopTrigger.AddAction(ErrorHandler.Wrap(ShopFrame.ShopFrameActions))
        ShopButton.Visible = false
    }

    private static ButtonsBackdrop() {
        Backdrop = BlzCreateFrameByType('BACKDROP', 'ButtonsBackdrop', GameUI, 'QuestButtonDisabledBackdropTemplate', 0)
        BlzGetFrameByName('ResourceBarGoldText', 0)
        Backdrop.SetPoint(framepointtype.Top, 0, 0, GameUI, framepointtype.Top)
        Backdrop.SetSize(0.16, 0.035)
        Backdrop.SetScale(1.0)
        Backdrop.Visible = false
        RepositionBackdrop()
    }

    private static RepositionBackdrop() {
        let t = timer.Create()
        let nameFrame = BlzGetFrameByName('ConsoleUIBackdrop', 0)

        t.start(1.0, true, _cachedUIPosition)
    }

    private static RepositionBackdropAction(): Action {
        return () => {
            try {
                let nameFrame = BlzGetFrameByName('ConsoleUIBackdrop', 0)
                let x = nameFrame.Width / 4
                let h = nameFrame.Height / 8
                let yOffSet = nameFrame.Height / 8
                Backdrop.SetPoint(framepointtype.Top, 0, yOffSet, nameFrame, framepointtype.Top)
                Backdrop.SetSize(x, h)
            } catch (e) {
                Logger.Critical('Error in RepositionBackdropAction: {e.Message}')
            }
        }
    }

    private static ESCHideFrames() {
        for (let i: number = 0; i < Globals.ALL_PLAYERS.length; i++) {
            let player = Globals.ALL_PLAYERS[i]
            TriggerRegisterPlayerEvent(ESCTrigger, player, EVENT_PLAYER_END_CINEMATIC)
        }
        ESCTrigger.AddAction(ESCActions)
    }

    public static RefreshFrame(frame: framehandle) {
        frame.Visible = !frame.Visible
        frame.Visible = !frame.Visible
    }

    private static ESCActions() {
        let player = GetTriggerPlayer()
        if (!player.isLocal()) return
        RewardsFrame.RewardFrame.Visible = false
        ShopFrame.shopFrame.Visible = false
        MusicFrame.MusicFramehandle.Visible = false
    }

    public static HideOtherFrames(currentFrame: framehandle) {
        for (let i: number = 0; i < _frames.length; i++) {
            if (_frames[i] != currentFrame) _frames[i].Visible = false
        }
    }
}
