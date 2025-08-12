export class MusicFrame {
    public static MusicFramehandle: framehandle
    private static MusicSlider: framehandle
    private static GameUI: framehandle = originframetype.GameUI.GetOriginFrame(0)
    private static MusicSliderValues: Map<player, number> = new Map()
    private static MusicButtons: Map<number, framehandle> = new Map()
    private static Headers: string[]
    private static MusicFrameX: number = 0.4
    private static MusicFrameY: number = 0.36
    private ButtonWidth: number = 0.17
    private ButtonHeight: number = 0.023
    private ButtonSpacing: number = 0.025 // Space between buttons
    private ButtonStartX: number = 0.4 // X coordinate for button positions
    private ButtonStartY: number = 0.465 // Starting Y coordinate for the first button

    public static Initialize() {
        try {
            MusicFramehandle = BlzCreateFrameByType(
                'BACKDROP',
                'Frame: Music',
                GameUI,
                'QuestButtonPushedBackdropTemplate',
                0
            )
            MusicFramehandle.SetAbsPoint(framepointtype.Center, MusicFrameX, MusicFrameY)
            CreateMusicFrames()
            SetMusicFrameHotkeyEvent()
        } catch (ex) {
            Logger.Critical('Error in MusicFrame: {ex.Message}')
            throw ex
        }
    }

    private static CreateMusicFrames() {
        let ySize = MusicManager.MusicList.length * 0.03
        MusicFramehandle.SetSize(0.2, ySize)

        FrameManager.CreateHeaderFrame(MusicFramehandle)

        // Slider
        RegisterMusicSlider()

        InitializeMusicButtons()
        MusicFramehandle.Visible = false
    }

    private static RegisterMusicSlider() {
        MusicSlider = BlzCreateFrameByType('SLIDER', 'SliderFrame', MusicFramehandle, 'QuestMainListScrollBar', 0)
        let numberOfSongs = MusicManager.MusicList.length
        MusicSlider.ClearPoints()
        MusicSlider.SetAbsPoint(framepointtype.TopLeft, 0.485, 0.455)
        MusicSlider.SetSize(0.01, 0.125)
        MusicSlider.SetMinMaxValue(0, numberOfSongs)
        MusicSlider.SetStepSize(1)

        for (let player in Globals.ALL_PLAYERS) if (!MusicSliderValues.has(player)) MusicSliderValues.push(player, 0)

        let Trigger = CreateTrigger()
        let mousewheel = CreateTrigger()
        Trigger.RegisterFrameEvent(MusicSlider, frameeventtype.SliderValueChanged)
        mousewheel.RegisterFrameEvent(MusicSlider, frameeventtype.MouseWheel)
        Trigger.AddAction(() => {
            let frame = BlzGetTriggerFrame()
            let player = GetTriggerPlayer()
            MusicSliderValues[player] = BlzGetTriggerFrameValue()
            if (player.isLocal()) PopulateMusicFrame(player)
        })
        mousewheel.AddAction(() => {
            let frame = BlzGetTriggerFrame()
            let player = GetTriggerPlayer()
            let frameValue = BlzGetTriggerFrameValue()
            if (!player.isLocal()) return
            MusicSlider.Value = frameValue > 0 ? frameValue + 1.0 : frameValue - 1.0
            let value = MusicSliderValues[player]
            if (player.isLocal()) PopulateMusicFrame(player)
        })
    }

    private static InitializeMusicButtons() {
        let musicCount: number = MusicManager.MusicList.length

        // Create buttons for each music item
        for (let i = 0; i < musicCount; i++) {
            if (MusicButtons.has(i)) continue // Skip if already exists
            let name = MusicManager.MusicList[i].Name
            MusicButtons[i] = BlzCreateFrameByType('GLUETEXTBUTTON', name, MusicFramehandle, 'DebugButton', 0)
            MusicButtons[i].SetSize(ButtonWidth, ButtonHeight)
            MusicButtons[i].Text = MusicManager.MusicList[i].Name

            MusicButtons[i].SetAbsPoint(FRAMEPOINT_CENTER, ButtonStartX, ButtonStartY - i * ButtonSpacing)

            let trigger = CreateTrigger()
            trigger.RegisterFrameEvent(BlzGetFrameByName(name, 0), frameeventtype.Click)
            trigger.AddAction(
                ErrorHandler.Wrap(() => {
                    let frame = BlzGetTriggerFrame()
                    let player = GetTriggerPlayer()

                    if (!player.isLocal()) return

                    //MusicManager.StopAllMusic();

                    let music = MusicManager.MusicList.Find(m => m.Name == frame.Text)
                    music?.Play()
                    MusicFramehandle.Visible = !MusicFramehandle.Visible
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
        let value = MusicSliderValues[player]
        let maxSongs: number = MusicManager.MusicList.length
        let visibleButtons: number = 9

        // Ensure the value stays within valid bounds
        if (value < 0) value = 0
        if (value > maxSongs - 1) value = maxSongs - 1

        // Calculates the start and end indexes for the visible buttons
        let start: number = value - visibleButtons / 2
        if (start < 0) start = 0
        let end: number = Math.Min(start + visibleButtons, maxSongs)

        // Adjust start in case end is too small
        if (end - start < visibleButtons) start = Math.Max(0, end - visibleButtons)

        // Display the buttons in the visible range and hide others
        for (let i: number = 0; i < maxSongs; i++) {
            if (i >= start && i < end) {
                let positionY: number =
                    i == end - 1
                        ? ButtonStartY - (visibleButtons - 1) * ButtonSpacing
                        : ButtonStartY - (i - start) * ButtonSpacing
                MusicButtons[i].SetAbsPoint(framepointtype.Center, ButtonStartX, positionY)
                MusicButtons[i].Visible = true
            } else {
                MusicButtons[i].Visible = false
            }
        }
    }

    private static SetMusicFrameHotkeyEvent() {
        let musicHotkeyTrigger = CreateTrigger()
        for (let player in Globals.ALL_PLAYERS) {
            musicHotkeyTrigger.RegisterPlayerKeyEvent(player, OSKEY_0, 0, true)
        }
        musicHotkeyTrigger.AddAction(ErrorHandler.Wrap(MusicFrameActions))
    }

    /// <summary>
    /// Whenever the player presses the music button, this function shows the frame for that player using local player.
    /// </summary>
    public static MusicFrameActions() {
        let player = GetTriggerPlayer()
        if (!player.isLocal()) return
        // if (ShopUtil.IsPlayerInWolfLane(player)) return;
        FrameManager.MusicButton.Visible = false
        FrameManager.MusicButton.Visible = true
        FrameManager.HideOtherFrames(MusicFramehandle)
        MusicFramehandle.Visible = !MusicFramehandle.Visible
        if (MusicFramehandle.Visible) MultiboardUtil.MinMultiboards(player, true)
        PopulateMusicFrame(player)
    }
}
