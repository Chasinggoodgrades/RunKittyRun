using System.Collections.Generic;
using System;
using WCSharp.Api;
using static WCSharp.Api.Common;
public static class MusicFrame
{
    private static framehandle MusicFramehandle;
    private static framehandle MusicFrameTitle;
    private static framehandle MusicSlider;
    private static Dictionary<player, int> MusicSliderValues = new Dictionary<player, int>();
    private static Dictionary<int, framehandle> MusicButtons = new Dictionary<int, framehandle>();
    private static string[] Headers;
    private static float MusicHeaderX = 0.175f;
    private static float MusicHeaderY = 0.48f;
    private const float ButtonWidth = 0.17f;
    private const float ButtonHeight = 0.023f;
    private const float ButtonSpacing = 0.025f; // Space between buttons
    private const float ButtonStartX = 0.40f;  // X coordinate for button positions
    private const float ButtonStartY = 0.505f;  // Starting Y coordinate for the first button
    public static void Initialize()
    {
        MusicFramehandle = BlzCreateFrameByType("BACKDROP", "MusicFrame", BlzGetFrameByName("ConsoleUIBackdrop", 0), "QuestButtonPushedBackdropTemplate", 0);
        MusicFramehandle.SetAbsPoint(FRAMEPOINT_CENTER, 0.40f, 0.42f);
        Utility.SimpleTimer(5.0f, CreateMusicFrames);
    }

    private static void CreateMusicFrames()
    {
        var ySize = MusicManager.MusicList.Count * 0.03f;
        MusicFramehandle.SetSize(0.20f, ySize);

        // Slider
        RegisterMusicSlider();

        InitializeMusicButtons();
        MusicFramehandle.Visible = false;
    }

    private static void RegisterMusicSlider()
    {
        MusicSlider = BlzCreateFrameByType("SLIDER", "SliderFrame", MusicFramehandle, "QuestMainListScrollBar", 0);
        var numberOfSongs = MusicManager.MusicList.Count;
        MusicSlider.ClearPoints();
        MusicSlider.SetAbsPoint(FRAMEPOINT_TOPLEFT, 0.485f, 0.475f);
        MusicSlider.SetSize(0.01f, 0.125f);
        MusicSlider.SetMinMaxValue(0, numberOfSongs);
        MusicSlider.SetStepSize(1);

        foreach (var player in Globals.ALL_PLAYERS)
            MusicSliderValues.Add(player, 0);

        var trigger = CreateTrigger();
        var mousewheel = CreateTrigger();
        trigger.RegisterFrameEvent(MusicSlider, FRAMEEVENT_SLIDER_VALUE_CHANGED);
        mousewheel.RegisterFrameEvent(MusicSlider, FRAMEEVENT_MOUSE_WHEEL);
        trigger.AddAction(() =>
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
            var frameValue = @event.FrameValue;
            if (!player.IsLocal) return;
            if (frameValue > 0) MusicSlider.Value = frameValue + 1.0f;
            else MusicSlider.Value = frameValue - 1.0f;
            var value = MusicSliderValues[player];
            if (player.IsLocal) PopulateMusicFrame(player);
        });
    }

    private static void InitializeMusicButtons()
    {
        int musicCount = MusicManager.MusicList.Count;

        // Create buttons for each music item
        for (var i = 0; i < musicCount; i++)
        {
            var name = MusicManager.MusicList[i].Name;
            MusicButtons[i] = BlzCreateFrameByType("GLUETEXTBUTTON", name, MusicFramehandle, "DebugButton", 0);
            MusicButtons[i].SetSize(ButtonWidth, ButtonHeight);
            MusicButtons[i].Text = MusicManager.MusicList[i].Name;

            // Set the position of the button, using a formula based on index
            MusicButtons[i].SetAbsPoint(FRAMEPOINT_CENTER, ButtonStartX, ButtonStartY - (i * ButtonSpacing));

            var trigger = CreateTrigger();
            trigger.RegisterFrameEvent(BlzGetFrameByName(name, 0), FRAMEEVENT_CONTROL_CLICK);
            trigger.AddAction(() =>
            {
                var frame = @event.Frame;
                var player = @event.Player;

                if (!player.IsLocal) return;

                // Stop All Current Music
                MusicManager.StopAllMusic();
                // Play the music
                var music = MusicManager.MusicList.Find(m => m.Name == frame.Text);
                if (music != null) music.Play();
                MusicFramehandle.Visible = !MusicFramehandle.Visible;
            });
        }
    }

    /// <summary>
    /// Applies columns of data to the music frame, use only once for initialization.
    /// </summary>
    public static void PopulateMusicFrame(player player)
    {
        // Ensure this code runs only for the local player
        if (!player.IsLocal) return;

        // Retrieve the scroll value for the player
        var value = MusicSliderValues[player];
        int maxSongs = MusicManager.MusicList.Count;
        int visibleButtons = 9;

        // Ensure the value stays within valid bounds
        if (value < 0) value = 0;
        if (value > maxSongs - 1) value = maxSongs - 1;

        // Calculate the start and end indices for the visible buttons
        int start = value - (visibleButtons / 2);
        if (start < 0) start = 0;
        int end = Math.Min(start + visibleButtons, maxSongs);

        // Adjust start in case end is too small
        if (end - start < visibleButtons) start = Math.Max(0, end - visibleButtons);

        // Display the buttons in the visible range and hide others
        for (int i = 0; i < maxSongs; i++)
        {
            if (i >= start && i < end)
            {
                float positionY;
                if (i == end - 1)
                    positionY = ButtonStartY - ((visibleButtons - 1) * ButtonSpacing);
                else
                    positionY = ButtonStartY - ((i - start) * ButtonSpacing);

                MusicButtons[i].SetAbsPoint(FRAMEPOINT_CENTER, ButtonStartX, positionY);
                MusicButtons[i].Visible = true;
            }
            else
            {
                MusicButtons[i].Visible = false;
            }
        }
    }

    /// <summary>
    /// Whenever the player presses the stats button, this function shows the frame for that player using local player. 
    /// </summary>
    public static void MusicFrameActions()
    {
        var player = @event.Player;
        if (player.IsLocal)
        {
            FrameManager.MusicButton.Visible = false;
            FrameManager.MusicButton.Visible = true;
            MusicFramehandle.Visible = !MusicFramehandle.Visible;
            PopulateMusicFrame(player);
        }
    }
}