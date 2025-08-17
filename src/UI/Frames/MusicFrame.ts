import { Logger } from 'src/Events/Logger/Logger'
import { Globals } from 'src/Global/Globals'
import { MusicManager } from 'src/Sounds/MusicManager'
import { blzCreateFrameByType, blzGetFrameByName, getTriggerPlayer } from 'src/Utility/w3tsUtils'
import { Frame, MapPlayer, Trigger } from 'w3ts'
import { MultiboardUtil } from '../Multiboard/MultiboardUtil'
import { FrameManager } from './FrameManager'
import { CreateHeaderFrame, HideOtherFrames } from './FrameUtil'

export class MusicFrame {
    public static MusicFramehandle: Frame
    private static MusicSlider: Frame
    private static GameUI: Frame
    private static MusicSliderValues: Map<MapPlayer, number> = new Map()
    private static MusicButtons: Map<number, Frame> = new Map()
    private static Headers: string[]
    private static MusicFrameX = 0.4
    private static MusicFrameY = 0.36
    private static ButtonWidth = 0.17
    private static ButtonHeight = 0.023
    private static ButtonSpacing = 0.025 // Space between buttons
    private static ButtonStartX = 0.4 // X coordinate for button positions
    private static ButtonStartY = 0.465 // Starting Y coordinate for the first button

    public static Initialize = () => {
        try {
            MusicFrame.GameUI = Frame.fromHandle(BlzGetOriginFrame(ORIGIN_FRAME_GAME_UI, 0))!
            MusicFrame.MusicFramehandle = blzCreateFrameByType(
                'BACKDROP',
                'Music Frame:',
                MusicFrame.GameUI,
                'QuestButtonPushedBackdropTemplate',
                0
            )
            MusicFrame.MusicFramehandle.setAbsPoint(FRAMEPOINT_CENTER, MusicFrame.MusicFrameX, MusicFrame.MusicFrameY)
            MusicFrame.CreateMusicFrames()
            MusicFrame.SetMusicFrameHotkeyEvent()
        } catch (ex: any) {
            Logger.Critical(`Error in MusicFrame: ${ex}`)
            throw ex
        }
    }

    private static CreateMusicFrames = () => {
        const ySize = MusicManager.MusicList.length * 0.03
        MusicFrame.MusicFramehandle.setSize(0.2, ySize)

        CreateHeaderFrame(MusicFrame.MusicFramehandle)

        // Slider
        MusicFrame.RegisterMusicSlider()

        MusicFrame.InitializeMusicButtons()
        MusicFrame.MusicFramehandle.visible = false
    }

    private static RegisterMusicSlider = () => {
        MusicFrame.MusicSlider = blzCreateFrameByType(
            'SLIDER',
            'SliderFrame',
            MusicFrame.MusicFramehandle,
            'QuestMainListScrollBar',
            0
        )
        const numberOfSongs = MusicManager.MusicList.length
        MusicFrame.MusicSlider.clearPoints()
        MusicFrame.MusicSlider.setAbsPoint(FRAMEPOINT_TOPLEFT, 0.485, 0.455)
        MusicFrame.MusicSlider.setSize(0.01, 0.125)
        MusicFrame.MusicSlider.setMinMaxValue(0, numberOfSongs)
        MusicFrame.MusicSlider.setStepSize(1)

        for (const player of Globals.ALL_PLAYERS)
            if (!MusicFrame.MusicSliderValues.has(player)) MusicFrame.MusicSliderValues.set(player, 0)

        const triggerHandle = Trigger.create()!
        const mousewheel = Trigger.create()!
        triggerHandle.triggerRegisterFrameEvent(MusicFrame.MusicSlider, FRAMEEVENT_SLIDER_VALUE_CHANGED)
        mousewheel.triggerRegisterFrameEvent(MusicFrame.MusicSlider, FRAMEEVENT_MOUSE_WHEEL)
        triggerHandle.addAction(() => {
            const frame = BlzGetTriggerFrame()
            const player = getTriggerPlayer()
            MusicFrame.MusicSliderValues.set(player, BlzGetTriggerFrameValue())
            if (player.isLocal()) MusicFrame.PopulateMusicFrame(player)
        })
        mousewheel.addAction(() => {
            const frame = BlzGetTriggerFrame()
            const player = getTriggerPlayer()
            const frameValue = BlzGetTriggerFrameValue()
            if (!player.isLocal()) return
            MusicFrame.MusicSlider.value = frameValue > 0 ? frameValue + 1.0 : frameValue - 1.0
            const value = MusicFrame.MusicSliderValues.get(player)
            if (player.isLocal()) MusicFrame.PopulateMusicFrame(player)
        })
    }

    private static InitializeMusicButtons = () => {
        const musicCount: number = MusicManager.MusicList.length

        // Create buttons for each music item
        for (let i = 0; i < musicCount; i++) {
            if (MusicFrame.MusicButtons.has(i)) continue // Skip if already exists
            const name = MusicManager.MusicList[i].name
            MusicFrame.MusicButtons.set(
                i,
                blzCreateFrameByType('GLUETEXTBUTTON', name, MusicFrame.MusicFramehandle, 'DebugButton', 0)
            )
            MusicFrame.MusicButtons.get(i)?.setSize(MusicFrame.ButtonWidth, MusicFrame.ButtonHeight)
            const button = MusicFrame.MusicButtons.get(i)
            if (button) {
                button.text = MusicManager.MusicList[i].name
            }

            MusicFrame.MusicButtons.get(i)?.setAbsPoint(
                FRAMEPOINT_CENTER,
                MusicFrame.ButtonStartX,
                MusicFrame.ButtonStartY - i * MusicFrame.ButtonSpacing
            )

            const trigger = Trigger.create()!
            trigger.triggerRegisterFrameEvent(blzGetFrameByName(name, 0), FRAMEEVENT_CONTROL_CLICK)
            trigger.addAction(() => {
                const frame = BlzGetTriggerFrame()
                const player = getTriggerPlayer()

                if (!frame) return
                if (!player.isLocal()) return

                //MusicManager.StopAllMusic();

                const music = MusicManager.MusicList.find(m => m.name === BlzGetTriggerFrameText())
                music?.Play()
                MusicFrame.MusicFramehandle.visible = !MusicFrame.MusicFramehandle.visible
            })
        }
    }

    /// <summary>
    /// Applies columns of data to the music frame, use only once for initialization.
    /// </summary>
    public static PopulateMusicFrame(player: MapPlayer) {
        // Ensure MusicFrame code runs only for the local player
        if (!player.isLocal()) return

        // Retrieve the scroll value for the player
        let value = MusicFrame.MusicSliderValues.get(player)
        if (value === undefined) return

        const maxSongs: number = MusicManager.MusicList.length
        const visibleButtons = 9

        // Ensure the value stays within valid bounds
        if (value < 0) value = 0
        if (value > maxSongs - 1) value = maxSongs - 1

        // Calculates the start and end indexes for the visible buttons
        let start: number = value - visibleButtons / 2
        if (start < 0) start = 0
        const end: number = Math.min(start + visibleButtons, maxSongs)

        // Adjust start in case end is too small
        if (end - start < visibleButtons) start = Math.max(0, end - visibleButtons)

        // Display the buttons in the visible range and hide others
        for (let i = 0; i < maxSongs; i++) {
            if (i >= start && i < end) {
                const positionY: number =
                    i === end - 1
                        ? MusicFrame.ButtonStartY - (visibleButtons - 1) * MusicFrame.ButtonSpacing
                        : MusicFrame.ButtonStartY - (i - start) * MusicFrame.ButtonSpacing
                const button = MusicFrame.MusicButtons.get(i)
                if (!button) continue // Skip if button does not exist
                button.setAbsPoint(FRAMEPOINT_CENTER, MusicFrame.ButtonStartX, positionY)
                button.visible = true
            } else {
                const button = MusicFrame.MusicButtons.get(i)
                if (button) button.visible = false
            }
        }
    }

    private static SetMusicFrameHotkeyEvent = () => {
        const musicHotkeyTrigger = Trigger.create()!
        for (const player of Globals.ALL_PLAYERS) {
            musicHotkeyTrigger.registerPlayerKeyEvent(player, OSKEY_0, 0, true)
        }
        musicHotkeyTrigger.addAction(MusicFrame.MusicFrameActions)
    }

    /// <summary>
    /// Whenever the player presses the music button, MusicFrame function shows the frame for that player using local player.
    /// </summary>
    public static MusicFrameActions = () => {
        const player = getTriggerPlayer()
        if (!player.isLocal()) return
        // if (ShopUtil.IsPlayerInWolfLane(player)) return;
        FrameManager.MusicButton.visible = false
        FrameManager.MusicButton.visible = true
        HideOtherFrames(MusicFrame.MusicFramehandle)
        MusicFrame.MusicFramehandle.visible = !MusicFrame.MusicFramehandle.visible
        if (MusicFrame.MusicFramehandle.visible) MultiboardUtil.MinMultiboards(player, true)
        MusicFrame.PopulateMusicFrame(player)
    }
}
