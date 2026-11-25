using System;
using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class MusicFrame
{
    public static framehandle MusicFramehandle;
    private static framehandle MusicSlider;
    private static framehandle GameUI = originframetype.GameUI.GetOriginFrame(0);
    private static Dictionary<player, int> MusicSliderValues = new Dictionary<player, int>();
    private static Dictionary<int, framehandle> MusicButtons = new Dictionary<int, framehandle>();
    private static string[] Headers;
    private static float MusicFrameX = 0.40f;
    private static float MusicFrameY = 0.368f;
    private const int VisibleButtons = 9;
    private const float ButtonWidth = 0.19f;
    private const float ButtonHeight = 0.023f;
    private const float ButtonSpacing = 0.025f; // Space between buttons
    private const float ButtonStartX = 0.387f;  // X coordinate for button positions
    private const float ButtonStartY = 0.465f;  // Starting Y coordinate for the first button

    public static void Initialize()
    {
        try
        {
            MusicFramehandle = BlzCreateFrame("ShopWindowTallBackdrop", GameUI, 0, 0);
            MusicFramehandle.SetAbsPoint(framepointtype.Center, MusicFrameX, MusicFrameY);
            CreateMusicFrames();
            SetMusicFrameHotkeyEvent();
        }
        catch (Exception ex)
        {
            Logger.Critical($"Error in MusicFrame: {ex.Message}");
            throw;
        }
    }

    private static void CreateMusicFrames()
    {
        // sized for the nine visible buttons, not for the whole list (the slider scrolls it)
        MusicFramehandle.SetSize(0.25f, 0.257f);

        FrameManager.CreateHeaderFrame(MusicFramehandle, "Music");

        // an inset panel behind the list and the slider
        var listPanel = BlzCreateFrame("ShopPanelBackdrop", MusicFramehandle, 0, 0);
        listPanel.SetPoint(framepointtype.TopLeft, 0.01f, -0.012f, MusicFramehandle, framepointtype.TopLeft);
        listPanel.SetPoint(framepointtype.BottomRight, -0.01f, 0.01f, MusicFramehandle, framepointtype.BottomRight);

        // Slider
        RegisterMusicSlider();

        InitializeMusicButtons();
        MusicFramehandle.Visible = false;
    }

    private static void RegisterMusicSlider()
    {
        MusicSlider = BlzCreateFrameByType("SLIDER", "SliderFrame", MusicFramehandle, "QuestMainListScrollBar", 0);
        MusicSlider.ClearPoints();
        MusicSlider.SetAbsPoint(framepointtype.TopLeft, 0.492f, 0.4765f);
        MusicSlider.SetSize(0.011f, 0.223f);

        // A vertical slider has its minimum at the BOTTOM, the list starts at the top: the slider value counts
        // up from the bottom, so the list offset is (MaxOffset - value). The thumb starts at the top = first songs.
        var maxOffset = MaxScrollOffset;
        MusicSlider.SetMinMaxValue(0, maxOffset);
        MusicSlider.SetStepSize(1);
        MusicSlider.Value = maxOffset;
        MusicSlider.Visible = maxOffset > 0; // nothing to scroll when everything fits

        foreach (var player in Globals.ALL_PLAYERS)
            if (!MusicSliderValues.ContainsKey(player))
                MusicSliderValues.Add(player, maxOffset);

        var Trigger = trigger.Create();
        var mousewheel = trigger.Create();
        Trigger.RegisterFrameEvent(MusicSlider, frameeventtype.SliderValueChanged);
        mousewheel.RegisterFrameEvent(MusicSlider, frameeventtype.MouseWheel);
        Trigger.AddAction(() =>
        {
            var frame = @event.Frame;
            var player = @event.Player;
            MusicSliderValues[player] = (int)@event.FrameValue;
            if (player.IsLocal) PopulateMusicFrame(player);
        });
        mousewheel.AddAction(() =>
        {
            var frame = @event.Frame;
            var player = @event.Player;
            if (!player.IsLocal) return;

            // wheel up = towards the first songs = a higher slider value (the change event does the rest)
            var next = MusicSlider.Value + (@event.FrameValue > 0 ? 1.0f : -1.0f);
            if (next < 0) next = 0;
            if (next > MaxScrollOffset) next = MaxScrollOffset;
            MusicSlider.Value = next;
        });
    }

    private static void InitializeMusicButtons()
    {
        int musicCount = MusicManager.MusicList.Count;

        // Create buttons for each music item
        for (var i = 0; i < musicCount; i++)
        {
            if (MusicButtons.ContainsKey(i)) continue; // Skip if already exists
            var name = MusicManager.MusicList[i].Name;
            MusicButtons[i] = BlzCreateFrameByType("GLUETEXTBUTTON", name, MusicFramehandle, "DebugButton", 0);
            MusicButtons[i].SetSize(ButtonWidth, ButtonHeight);
            MusicButtons[i].Text = MusicManager.MusicList[i].Name;

            MusicButtons[i].SetAbsPoint(FRAMEPOINT_CENTER, ButtonStartX, ButtonStartY - (i * ButtonSpacing));

            var trigger = CreateTrigger();
            trigger.RegisterFrameEvent(BlzGetFrameByName(name, 0), frameeventtype.Click);
            trigger.AddAction(ErrorHandler.Wrap(() =>
            {
                var frame = @event.Frame;
                var player = @event.Player;

                if (!player.IsLocal) return;

                //MusicManager.StopAllMusic();

                var music = MusicManager.MusicList.Find(m => m.Name == frame.Text);
                music?.Play();
                MusicFramehandle.Visible = !MusicFramehandle.Visible;
            }));
        }
    }

    /// <summary>
    /// Applies columns of data to the music frame, use only once for initialization.
    /// </summary>
    public static void PopulateMusicFrame(player player)
    {
        // Ensure this code runs only for the local player
        if (!player.IsLocal) return;

        int maxSongs = MusicManager.MusicList.Count;
        var maxOffset = MaxScrollOffset;

        // slider value -> how many songs are scrolled past the top
        int offset = maxOffset - MusicSliderValues[player];
        if (offset < 0) offset = 0;
        if (offset > maxOffset) offset = maxOffset;

        for (int i = 0; i < maxSongs; i++)
        {
            if (i >= offset && i < offset + VisibleButtons)
            {
                MusicButtons[i].SetAbsPoint(framepointtype.Center, ButtonStartX, ButtonStartY - ((i - offset) * ButtonSpacing));
                MusicButtons[i].Visible = true;
            }
            else
            {
                MusicButtons[i].Visible = false;
            }
        }
    }

    private static int MaxScrollOffset
    {
        get
        {
            var extra = MusicManager.MusicList.Count - VisibleButtons;
            return extra > 0 ? extra : 0;
        }
    }

    private static void SetMusicFrameHotkeyEvent()
    {
        var musicHotkeyTrigger = trigger.Create();
        foreach (var player in Globals.ALL_PLAYERS)
        {
            musicHotkeyTrigger.RegisterPlayerKeyEvent(player, OSKEY_0, 0, true);
        }
        musicHotkeyTrigger.AddAction(ErrorHandler.Wrap(MusicFrameActions));
    }

    /// <summary>
    /// Whenever the player presses the music button, this function shows the frame for that player using local player.
    /// </summary>
    public static void MusicFrameActions()
    {
        var player = @event.Player;
        if (!player.IsLocal) return;
        // if (ShopUtil.IsPlayerInWolfLane(player)) return;
        FrameManager.MusicButton.Visible = false;
        FrameManager.MusicButton.Visible = true;
        FrameManager.HideOtherFrames(MusicFramehandle);
        MusicFramehandle.Visible = !MusicFramehandle.Visible;
        if (MusicFramehandle.Visible) MultiboardUtil.MinMultiboards(player, true);
        PopulateMusicFrame(player);
    }
}
