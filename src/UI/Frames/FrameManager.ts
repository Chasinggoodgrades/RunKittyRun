import { Logger } from 'src/Events/Logger/Logger'
import { Globals } from 'src/Global/Globals'
import { Colors } from 'src/Utility/Colors/Colors'
import { Action } from 'src/Utility/CSUtils'
import { ErrorHandler } from 'src/Utility/ErrorHandler'
import { Utility } from 'src/Utility/Utility'
import { blzCreateFrameByType, blzGetFrameByName, getTriggerPlayer } from 'src/Utility/w3tsUtils'
import { Frame, Timer, Trigger } from 'w3ts'
import { MusicFrame } from './MusicFrame'
import { RewardsFrame } from './RewardsFrame'
import { ShopFrame } from './ShopFrame'

export class FrameManager {
    public static StatsTrigger: Trigger = Trigger.create()!
    public static ShopTrigger: Trigger = Trigger.create()!
    public static RewardsTrigger: Trigger = Trigger.create()!
    public static MusicButton: Frame
    public static ShopButton: Frame
    public static RewardsButton: Frame
    public static Backdrop: Frame

    private static ButtonWidth = 0.053
    private static ButtonHeight = 0.028

    private static GameUI: Frame
    private static ESCTrigger: Trigger = Trigger.create()!
    private static TEXT_COLOR: string = Colors.COLOR_YELLOW
    private static HOTKEY_COLOR: string = Colors.COLOR_YELLOW_ORANGE

    private static _cachedUIPosition: Action
    private static _frames: Frame[] = []

    public static Initialize() {
        try {
            this.GameUI = Frame.fromHandle(BlzGetOriginFrame(ORIGIN_FRAME_GAME_UI, 0))!
            this._cachedUIPosition = FrameManager.RepositionBackdropAction()
            BlzLoadTOCFile('war3mapImported\\templates.toc')
            FrameManager.RemoveUnwantedFrames()
            FrameManager.ButtonsBackdrop()
            FrameManager.CreateRewardsButton()
            FrameManager.CreateMusicButton()
            FrameManager.CreateShopButton()
            Utility.SimpleTimer(1.0, FrameManager.ESCHideFrames)
        } catch (ex: any) {
            Logger.Critical(`Error in FrameManager.Initialize: ${ex}`)
            throw ex
        }
    }

    public static InitalizeButtons() {
        FrameManager.Backdrop.visible = true
        FrameManager.RewardsButton.visible = true
        FrameManager.MusicButton.visible = true
        FrameManager.ShopButton.visible = true
    }

    public static CreateHeaderFrame(parent: Frame): Frame {
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

    private static RemoveUnwantedFrames() {
        let resourceBarText = blzGetFrameByName('ResourceBarSupplyText', 0)
        BlzFrameGetChild(BlzFrameGetChild(FrameManager.GameUI.handle, 5)!, 0)
        resourceBarText.text = '0:00'
        //timeDayDisplay.visible = false;
    }

    public static InitFramesList() {
        FrameManager._frames.push(ShopFrame.shopFrame)
        FrameManager._frames.push(RewardsFrame.RewardFrame)
        FrameManager._frames.push(MusicFrame.MusicFramehandle)
    }

    private static CreateRewardsButton() {
        FrameManager.RewardsButton = blzCreateFrameByType(
            'GLUETEXTBUTTON',
            'RewardsButton',
            FrameManager.Backdrop,
            'ScriptDialogButton',
            0
        )
        FrameManager.RewardsButton.setPoint(FRAMEPOINT_CENTER, FrameManager.Backdrop, FRAMEPOINT_CENTER, 0, 0)
        FrameManager.RewardsButton.setSize(this.ButtonWidth, this.ButtonHeight)
        let shopText = blzCreateFrameByType('TEXT', 'RewardsText', FrameManager.RewardsButton, '', 0)
        shopText.text = `${Colors.COLOR_YELLOW}Rewards${Colors.COLOR_LAVENDER}(-)|r`
        shopText.setPoint(FRAMEPOINT_CENTER, FrameManager.RewardsButton, FRAMEPOINT_CENTER, 0, 0)
        shopText.setScale(0.9)
        shopText.enabled = false
        FrameManager.RewardsTrigger.triggerRegisterFrameEvent(FrameManager.RewardsButton, FRAMEEVENT_CONTROL_CLICK)
        FrameManager.RewardsTrigger.addAction(ErrorHandler.Wrap(() => RewardsFrame.RewardsFrameActions()))
        FrameManager.RewardsButton.visible = false
    }

    private static CreateMusicButton() {
        FrameManager.MusicButton = blzCreateFrameByType(
            'GLUETEXTBUTTON',
            'MusicButton',
            FrameManager.Backdrop,
            'ScriptDialogButton',
            0
        )
        FrameManager.MusicButton.setPoint(FRAMEPOINT_TOPRIGHT, FrameManager.RewardsButton, FRAMEPOINT_TOPLEFT, 0, 0)
        FrameManager.MusicButton.setSize(this.ButtonWidth, this.ButtonHeight)
        let shopText = blzCreateFrameByType('TEXT', 'MusicText', FrameManager.MusicButton, '', 0)
        shopText.text = `${Colors.COLOR_YELLOW}Music${Colors.COLOR_LAVENDER}(0)`
        shopText.setPoint(FRAMEPOINT_CENTER, FrameManager.MusicButton, FRAMEPOINT_CENTER, 0, 0)
        shopText.setScale(0.98)
        shopText.enabled = false
        FrameManager.StatsTrigger.triggerRegisterFrameEvent(FrameManager.MusicButton, FRAMEEVENT_CONTROL_CLICK)
        FrameManager.StatsTrigger.addAction(ErrorHandler.Wrap(() => MusicFrame.MusicFrameActions()))
        FrameManager.MusicButton.visible = false
    }

    private static CreateShopButton() {
        FrameManager.ShopButton = blzCreateFrameByType(
            'GLUETEXTBUTTON',
            'ShopButton',
            FrameManager.Backdrop,
            'ScriptDialogButton',
            0
        )
        FrameManager.ShopButton.setPoint(FRAMEPOINT_TOPLEFT, FrameManager.RewardsButton, FRAMEPOINT_TOPRIGHT, 0, 0)
        FrameManager.ShopButton.setSize(this.ButtonWidth, this.ButtonHeight)
        let shopText = blzCreateFrameByType('TEXT', 'ShopText', FrameManager.ShopButton, '', 0)
        shopText.text = `${Colors.COLOR_YELLOW}Shop${Colors.COLOR_LAVENDER}(=)`
        shopText.setPoint(FRAMEPOINT_CENTER, FrameManager.ShopButton, FRAMEPOINT_CENTER, 0, 0)
        shopText.setScale(1.0)
        shopText.enabled = false
        FrameManager.ShopTrigger.triggerRegisterFrameEvent(FrameManager.ShopButton, FRAMEEVENT_CONTROL_CLICK)
        FrameManager.ShopTrigger.addAction(ErrorHandler.Wrap(() => ShopFrame.ShopFrameActions()))
        FrameManager.ShopButton.visible = false
    }

    private static ButtonsBackdrop() {
        FrameManager.Backdrop = blzCreateFrameByType(
            'BACKDROP',
            'ButtonsBackdrop',
            FrameManager.GameUI,
            'QuestButtonDisabledBackdropTemplate',
            0
        )
        blzGetFrameByName('ResourceBarGoldText', 0)
        FrameManager.Backdrop.setPoint(FRAMEPOINT_TOP, FrameManager.GameUI, FRAMEPOINT_TOP, 0, 0)
        FrameManager.Backdrop.setSize(0.16, 0.035)
        FrameManager.Backdrop.setScale(1.0)
        FrameManager.Backdrop.visible = false
        FrameManager.RepositionBackdrop()
    }

    private static RepositionBackdrop() {
        let t = Timer.create()
        let nameFrame = blzGetFrameByName('ConsoleUIBackdrop', 0)

        t.start(1.0, true, FrameManager._cachedUIPosition)
    }

    private static RepositionBackdropAction(): Action {
        return () => {
            try {
                let nameFrame = blzGetFrameByName('ConsoleUIBackdrop', 0)
                let x = nameFrame.width / 4
                let h = nameFrame.height / 8
                let yOffSet = nameFrame.height / 8
                FrameManager.Backdrop.setPoint(FRAMEPOINT_TOP, nameFrame, FRAMEPOINT_TOP, 0, yOffSet)
                FrameManager.Backdrop.setSize(x, h)
            } catch (e: any) {
                Logger.Critical(`Error in RepositionBackdropAction: ${e}`)
            }
        }
    }

    private static ESCHideFrames() {
        for (let i = 0; i < Globals.ALL_PLAYERS.length; i++) {
            let player = Globals.ALL_PLAYERS[i]
            FrameManager.ESCTrigger.registerPlayerEvent(player, EVENT_PLAYER_END_CINEMATIC)
        }
        FrameManager.ESCTrigger.addAction(() => FrameManager.ESCActions())
    }

    public static RefreshFrame(frame: Frame) {
        frame.visible = !frame.visible
        frame.visible = !frame.visible
    }

    private static ESCActions() {
        let player = getTriggerPlayer()
        if (!player.isLocal()) return
        RewardsFrame.RewardFrame.visible = false
        ShopFrame.shopFrame.visible = false
        MusicFrame.MusicFramehandle.visible = false
    }

    public static HideOtherFrames(currentFrame: Frame) {
        for (let i = 0; i < FrameManager._frames.length; i++) {
            if (FrameManager._frames[i] !== currentFrame) FrameManager._frames[i].visible = false
        }
    }
}
