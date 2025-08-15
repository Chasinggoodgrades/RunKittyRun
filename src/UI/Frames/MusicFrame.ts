import { Logger } from 'src/Events/Logger/Logger'
import { Globals } from 'src/Global/Globals'
import { MusicManager } from 'src/Sounds/MusicManager'
import { ErrorHandler } from 'src/Utility/ErrorHandler'
import { blzCreateFrameByType, blzGetFrameByName, getTriggerPlayer } from 'src/Utility/w3tsUtils'
import { Frame, MapPlayer, Trigger } from 'w3ts'
import { MultiboardUtil } from '../Multiboard/MultiboardUtil'
import { FrameManager } from './FrameManager'

export class MusicFrame {
    public static MusicFramehandle: Frame
    private static MusicSlider: Frame
    private static GameUI: Frame = Frame.fromHandle(BlzGetOriginFrame(ORIGIN_FRAME_GAME_UI, 0))!
    private static MusicSliderValues: Map<MapPlayer, number> = new Map()
    private static MusicButtons: Map<number, Frame> = new Map()
    private static Headers: string[]
    private static MusicFrameX: number = 0.4
    private static MusicFrameY: number = 0.36
    private static ButtonWidth: number = 0.17
    private static ButtonHeight: number = 0.023
    private static ButtonSpacing: number = 0.025 // Space between buttons
    private static ButtonStartX: number = 0.4 // X coordinate for button positions
    private static ButtonStartY: number = 0.465 // Starting Y coordinate for the first button

    public static Initialize() {
        try {
            this.MusicFramehandle = blzCreateFrameByType(
                'BACKDROP',
                'Frame: Music',
                this.GameUI,
                'QuestButtonPushedBackdropTemplate',
                0
            )
            this.MusicFramehandle.setAbsPoint(FRAMEPOINT_CENTER, this.MusicFrameX, this.MusicFrameY)
            this.CreateMusicFrames()
            this.SetMusicFrameHotkeyEvent()
        } catch (ex: any) {
            Logger.Critical('Error in MusicFrame: {ex.Message}')
            throw ex
        }
    }

    private static CreateMusicFrames() {
        let ySize = MusicManager.MusicList.length * 0.03
        this.MusicFramehandle.setSize(0.2, ySize)

        FrameManager.CreateHeaderFrame(this.MusicFramehandle)

        // Slider
        this.RegisterMusicSlider()

        this.InitializeMusicButtons()
        this.MusicFramehandle.visible = false
    }

    private static RegisterMusicSlider() {
        this.MusicSlider = blzCreateFrameByType(
            'SLIDER',
            'SliderFrame',
            this.MusicFramehandle,
            'QuestMainListScrollBar',
            0
        )
        let numberOfSongs = MusicManager.MusicList.length
        this.MusicSlider.clearPoints()
        this.MusicSlider.setAbsPoint(FRAMEPOINT_TOPLEFT, 0.485, 0.455)
        this.MusicSlider.setSize(0.01, 0.125)
        this.MusicSlider.setMinMaxValue(0, numberOfSongs)
        this.MusicSlider.setStepSize(1)

        for (let player of Globals.ALL_PLAYERS)
            if (!this.MusicSliderValues.has(player)) this.MusicSliderValues.set(player, 0)

        let triggerHandle = Trigger.create()!
        let mousewheel = Trigger.create()!
        triggerHandle.triggerRegisterFrameEvent(this.MusicSlider, FRAMEEVENT_SLIDER_VALUE_CHANGED)
        mousewheel.triggerRegisterFrameEvent(this.MusicSlider, FRAMEEVENT_MOUSE_WHEEL)
        triggerHandle.addAction(() => {
            let frame = BlzGetTriggerFrame()
            let player = getTriggerPlayer()
            this.MusicSliderValues.set(player, BlzGetTriggerFrameValue())
            if (player.isLocal()) this.PopulateMusicFrame(player)
        })
        mousewheel.addAction(() => {
            let frame = BlzGetTriggerFrame()
            let player = getTriggerPlayer()
            let frameValue = BlzGetTriggerFrameValue()
            if (!player.isLocal()) return
            this.MusicSlider.value = frameValue > 0 ? frameValue + 1.0 : frameValue - 1.0
            let value = this.MusicSliderValues.get(player)
            if (player.isLocal()) this.PopulateMusicFrame(player)
        })
    }

    private static InitializeMusicButtons() {
        let musicCount: number = MusicManager.MusicList.length

        // Create buttons for each music item
        for (let i = 0; i < musicCount; i++) {
            if (this.MusicButtons.has(i)) continue // Skip if already exists
            let name = MusicManager.MusicList[i].name
            this.MusicButtons.set(
                i,
                blzCreateFrameByType('GLUETEXTBUTTON', name, this.MusicFramehandle, 'DebugButton', 0)
            )
            this.MusicButtons.get(i)?.setSize(this.ButtonWidth, this.ButtonHeight)
            const button = this.MusicButtons.get(i)
            if (button) {
                button.text = MusicManager.MusicList[i].name
            }

            this.MusicButtons.get(i)?.setAbsPoint(
                FRAMEPOINT_CENTER,
                this.ButtonStartX,
                this.ButtonStartY - i * this.ButtonSpacing
            )

            let trigger = Trigger.create()!
            trigger.triggerRegisterFrameEvent(blzGetFrameByName(name, 0), FRAMEEVENT_CONTROL_CLICK)
            trigger.addAction(
                ErrorHandler.Wrap(() => {
                    let frame = BlzGetTriggerFrame()
                    let player = getTriggerPlayer()

                    if (!frame) return
                    if (!player.isLocal()) return

                    //MusicManager.StopAllMusic();

                    let music = MusicManager.MusicList.find(m => m.name === BlzGetTriggerFrameText())
                    music?.Play()
                    this.MusicFramehandle.visible = !this.MusicFramehandle.visible
                })
            )
        }
    }

    /// <summary>
    /// Applies columns of data to the music frame, use only once for initialization.
    /// </summary>
    public static PopulateMusicFrame(player: MapPlayer) {
        // Ensure this code runs only for the local player
        if (!player.isLocal()) return

        // Retrieve the scroll value for the player
        let value = this.MusicSliderValues.get(player)
        if (value === undefined) return

        let maxSongs: number = MusicManager.MusicList.length
        let visibleButtons: number = 9

        // Ensure the value stays within valid bounds
        if (value < 0) value = 0
        if (value > maxSongs - 1) value = maxSongs - 1

        // Calculates the start and end indexes for the visible buttons
        let start: number = value - visibleButtons / 2
        if (start < 0) start = 0
        let end: number = Math.min(start + visibleButtons, maxSongs)

        // Adjust start in case end is too small
        if (end - start < visibleButtons) start = Math.max(0, end - visibleButtons)

        // Display the buttons in the visible range and hide others
        for (let i: number = 0; i < maxSongs; i++) {
            if (i >= start && i < end) {
                let positionY: number =
                    i === end - 1
                        ? this.ButtonStartY - (visibleButtons - 1) * this.ButtonSpacing
                        : this.ButtonStartY - (i - start) * this.ButtonSpacing
                let button = this.MusicButtons.get(i)
                if (!button) continue // Skip if button does not exist
                button.setAbsPoint(FRAMEPOINT_CENTER, this.ButtonStartX, positionY)
                button.visible = true
            } else {
                const button = this.MusicButtons.get(i)
                if (button) button.visible = false
            }
        }
    }

    private static SetMusicFrameHotkeyEvent() {
        let musicHotkeyTrigger = Trigger.create()!
        for (let player of Globals.ALL_PLAYERS) {
            musicHotkeyTrigger.registerPlayerKeyEvent(player, OSKEY_0, 0, true)
        }
        musicHotkeyTrigger.addAction(ErrorHandler.Wrap(this.MusicFrameActions))
    }

    /// <summary>
    /// Whenever the player presses the music button, this function shows the frame for that player using local player.
    /// </summary>
    public static MusicFrameActions() {
        let player = getTriggerPlayer()
        if (!player.isLocal()) return
        // if (ShopUtil.IsPlayerInWolfLane(player)) return;
        FrameManager.MusicButton.visible = false
        FrameManager.MusicButton.visible = true
        FrameManager.HideOtherFrames(this.MusicFramehandle)
        this.MusicFramehandle.visible = !this.MusicFramehandle.visible
        if (this.MusicFramehandle.visible) MultiboardUtil.MinMultiboards(player, true)
        this.PopulateMusicFrame(player)
    }
}
