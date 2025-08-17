import { Logger } from 'src/Events/Logger/Logger'
import { Globals } from 'src/Global/Globals'
import { Colors } from 'src/Utility/Colors/Colors'
import { Action } from 'src/Utility/CSUtils'
import { Utility } from 'src/Utility/Utility'
import { getTriggerPlayer } from 'src/Utility/w3tsUtils'
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

    public static Initialize = () => {
        try {
            FrameManager.GameUI = Frame.fromHandle(BlzGetOriginFrame(ORIGIN_FRAME_GAME_UI, 0))!
            FrameManager._cachedUIPosition = FrameManager.RepositionBackdropAction()
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

    public static InitalizeButtons = () => {
        FrameManager.Backdrop.visible = true
        FrameManager.RewardsButton.visible = true
        FrameManager.MusicButton.visible = true
        FrameManager.ShopButton.visible = true
    }

    private static RemoveUnwantedFrames = () => {
        const resourceBarText = Frame.fromHandle(BlzGetFrameByName('ResourceBarSupplyText', 0))!
        BlzFrameGetChild(BlzFrameGetChild(FrameManager.GameUI.handle, 5)!, 0)
        resourceBarText.text = '0:00'
        //timeDayDisplay.visible = false;
    }

    public static InitFramesList = () => {
        Globals.AllFrames.push(ShopFrame.shopFrame)
        Globals.AllFrames.push(RewardsFrame.RewardFrame)
        Globals.AllFrames.push(MusicFrame.MusicFramehandle)
    }

    private static CreateRewardsButton = () => {
        FrameManager.RewardsButton = Frame.fromHandle(
            BlzCreateFrameByType(
                'GLUETEXTBUTTON',
                'RewardsButton',
                FrameManager.Backdrop.handle,
                'ScriptDialogButton',
                0
            )
        )!
        FrameManager.RewardsButton.setPoint(FRAMEPOINT_CENTER, FrameManager.Backdrop, FRAMEPOINT_CENTER, 0, 0)
        FrameManager.RewardsButton.setSize(FrameManager.ButtonWidth, FrameManager.ButtonHeight)
        const shopText = Frame.fromHandle(
            BlzCreateFrameByType('TEXT', 'RewardsText', FrameManager.RewardsButton.handle, '', 0)
        )!
        shopText.text = `${Colors.COLOR_YELLOW}Rewards${Colors.COLOR_LAVENDER}(-)|r`
        shopText.setPoint(FRAMEPOINT_CENTER, FrameManager.RewardsButton, FRAMEPOINT_CENTER, 0, 0)
        shopText.setScale(0.9)
        shopText.enabled = false
        FrameManager.RewardsTrigger.triggerRegisterFrameEvent(FrameManager.RewardsButton, FRAMEEVENT_CONTROL_CLICK)
        FrameManager.RewardsTrigger.addAction(RewardsFrame.RewardsFrameActions)
        FrameManager.RewardsButton.visible = false
    }

    private static CreateMusicButton = () => {
        FrameManager.MusicButton = Frame.fromHandle(
            BlzCreateFrameByType('GLUETEXTBUTTON', 'MusicButton', FrameManager.Backdrop.handle, 'ScriptDialogButton', 0)
        )!
        FrameManager.MusicButton.setPoint(FRAMEPOINT_TOPRIGHT, FrameManager.RewardsButton, FRAMEPOINT_TOPLEFT, 0, 0)
        FrameManager.MusicButton.setSize(FrameManager.ButtonWidth, FrameManager.ButtonHeight)
        const shopText = Frame.fromHandle(
            BlzCreateFrameByType('TEXT', 'MusicText', FrameManager.MusicButton.handle, '', 0)
        )!
        shopText.text = `${Colors.COLOR_YELLOW}Music${Colors.COLOR_LAVENDER}(0)`
        shopText.setPoint(FRAMEPOINT_CENTER, FrameManager.MusicButton, FRAMEPOINT_CENTER, 0, 0)
        shopText.setScale(0.98)
        shopText.enabled = false
        FrameManager.StatsTrigger.triggerRegisterFrameEvent(FrameManager.MusicButton, FRAMEEVENT_CONTROL_CLICK)
        FrameManager.StatsTrigger.addAction(MusicFrame.MusicFrameActions)
        FrameManager.MusicButton.visible = false
    }

    private static CreateShopButton = () => {
        FrameManager.ShopButton = Frame.fromHandle(
            BlzCreateFrameByType('GLUETEXTBUTTON', 'ShopButton', FrameManager.Backdrop.handle, 'ScriptDialogButton', 0)
        )!
        FrameManager.ShopButton.setPoint(FRAMEPOINT_TOPLEFT, FrameManager.RewardsButton, FRAMEPOINT_TOPRIGHT, 0, 0)
        FrameManager.ShopButton.setSize(FrameManager.ButtonWidth, FrameManager.ButtonHeight)
        const shopText = Frame.fromHandle(
            BlzCreateFrameByType('TEXT', 'ShopText', FrameManager.ShopButton.handle, '', 0)
        )!
        shopText.text = `${Colors.COLOR_YELLOW}Shop${Colors.COLOR_LAVENDER}(=)`
        shopText.setPoint(FRAMEPOINT_CENTER, FrameManager.ShopButton, FRAMEPOINT_CENTER, 0, 0)
        shopText.setScale(1.0)
        shopText.enabled = false
        FrameManager.ShopTrigger.triggerRegisterFrameEvent(FrameManager.ShopButton, FRAMEEVENT_CONTROL_CLICK)
        FrameManager.ShopTrigger.addAction(ShopFrame.ShopFrameActions)
        FrameManager.ShopButton.visible = false
    }

    private static ButtonsBackdrop = () => {
        FrameManager.Backdrop = Frame.fromHandle(
            BlzCreateFrameByType(
                'BACKDROP',
                'ButtonsBackdrop',
                FrameManager.GameUI.handle,
                'QuestButtonDisabledBackdropTemplate',
                0
            )
        )!
        FrameManager.Backdrop.setPoint(FRAMEPOINT_TOP, FrameManager.GameUI, FRAMEPOINT_TOP, 0, 0)
        FrameManager.Backdrop.setSize(0.16, 0.035)
        FrameManager.Backdrop.setScale(1.0)
        FrameManager.Backdrop.visible = false
        FrameManager.RepositionBackdrop()
    }

    private static RepositionBackdrop = () => {
        const t = Timer.create()
        const nameFrame = Frame.fromHandle(BlzGetFrameByName('ConsoleUIBackdrop', 0))!

        t.start(1.0, true, FrameManager._cachedUIPosition)
    }

    private static RepositionBackdropAction(): Action {
        return () => {
            try {
                const nameFrame = Frame.fromHandle(BlzGetFrameByName('ConsoleUIBackdrop', 0))!
                const x = nameFrame.width / 4
                const h = nameFrame.height / 8
                const yOffSet = nameFrame.height / 8
                FrameManager.Backdrop.setPoint(FRAMEPOINT_TOP, nameFrame, FRAMEPOINT_TOP, 0, yOffSet)
                FrameManager.Backdrop.setSize(x, h)
            } catch (e: any) {
                Logger.Critical(`Error in RepositionBackdropAction: ${e}`)
            }
        }
    }

    private static ESCHideFrames = () => {
        for (let i = 0; i < Globals.ALL_PLAYERS.length; i++) {
            const player = Globals.ALL_PLAYERS[i]
            FrameManager.ESCTrigger.registerPlayerEvent(player, EVENT_PLAYER_END_CINEMATIC)
        }
        FrameManager.ESCTrigger.addAction(FrameManager.ESCActions)
    }

    public static RefreshFrame(frame: Frame) {
        frame.visible = !frame.visible
        frame.visible = !frame.visible
    }

    private static ESCActions = () => {
        const player = getTriggerPlayer()
        if (!player.isLocal()) return
        RewardsFrame.RewardFrame.visible = false
        ShopFrame.shopFrame.visible = false
        MusicFrame.MusicFramehandle.visible = false
    }
}
