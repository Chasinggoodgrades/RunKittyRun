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
        try
        {
            MusicFramehandle = BlzCreateFrameByType("BACKDROP", "MusicFrame", BlzGetFrameByName("ConsoleUIBackdrop", 0), "QuestButtonDisabledBackdropTemplate", 0);
            BlzFrameSetAbsPoint(MusicFramehandle, FRAMEPOINT_CENTER, 0.40f, 0.42f);
            var ySize = MusicManager.MusicList.Count * 0.03f;
            BlzFrameSetSize(MusicFramehandle, 0.20f, ySize);

            // Slider
            RegisterMusicSlider();

            InitializeMusicButtons();
            //PopulateMusicFrame();
            MusicFramehandle.Visible = false;
        }
        catch (Exception e)
        {
            Console.WriteLine(e.Message);
        }
    }

    private static void RegisterMusicSlider()
    {
        MusicSlider = BlzCreateFrameByType("SLIDER", "SliderFrame", MusicFramehandle, "QuestMainListScrollBar", 0);
        var numberOfSongs = MusicManager.MusicList.Count;
        BlzFrameClearAllPoints(MusicSlider);
        BlzFrameSetAbsPoint(MusicSlider, FRAMEPOINT_TOPLEFT, 0.485f, 0.475f);
        BlzFrameSetSize(MusicSlider, 0.01f, 0.125f);
        BlzFrameSetMinMaxValue(MusicSlider, 0, numberOfSongs);
        BlzFrameSetStepSize(MusicSlider, 1);

        foreach (var player in Globals.ALL_PLAYERS)
            MusicSliderValues.Add(player, 0);

        var trigger = CreateTrigger();
        var mousewheel = CreateTrigger();
        BlzTriggerRegisterFrameEvent(trigger, MusicSlider, FRAMEEVENT_SLIDER_VALUE_CHANGED);
        BlzTriggerRegisterFrameEvent(mousewheel, MusicSlider, FRAMEEVENT_MOUSE_WHEEL);
        TriggerAddAction(trigger, () =>
        {
            var frame = BlzGetTriggerFrame();
            MusicSliderValues[GetTriggerPlayer()] = (int)BlzGetTriggerFrameValue();
            if (GetTriggerPlayer() == GetLocalPlayer()) PopulateMusicFrame(GetTriggerPlayer()); // possible desync... Evaluate if issues arise from this.
        });
        TriggerAddAction(mousewheel, () =>
        {
            var frame = BlzGetTriggerFrame();
            var player = GetTriggerPlayer();
            if (!player.IsLocal) return;
            if (BlzGetTriggerFrameValue() > 0) BlzFrameSetValue(MusicSlider, BlzGetTriggerFrameValue() + 1);
            else BlzFrameSetValue(MusicSlider, BlzGetTriggerFrameValue() - 1);
            var value = MusicSliderValues[player];
            if (GetTriggerPlayer() == GetLocalPlayer()) PopulateMusicFrame(GetTriggerPlayer());
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
            BlzFrameSetSize(MusicButtons[i], ButtonWidth, ButtonHeight);
            MusicButtons[i].Text = MusicManager.MusicList[i].Name;

            // Set the position of the button, using a formula based on index
            BlzFrameSetAbsPoint(MusicButtons[i], FRAMEPOINT_CENTER, ButtonStartX, ButtonStartY - (i * ButtonSpacing));

            var trigger = CreateTrigger();
            trigger.RegisterFrameEvent(BlzGetFrameByName(name, 0), FRAMEEVENT_CONTROL_CLICK);

            TriggerAddAction(trigger, () =>
            {
                var frame = BlzGetTriggerFrame();
                var player = GetTriggerPlayer();

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
        if (GetLocalPlayer() != player) return;

        // Retrieve the scroll value for the player
        var value = MusicSliderValues[player];
        int maxSongs = MusicManager.MusicList.Count;
        int visibleButtons = 8;

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

                BlzFrameSetAbsPoint(MusicButtons[i], FRAMEPOINT_CENTER, ButtonStartX, positionY);
                BlzFrameSetVisible(MusicButtons[i], true);
            }
            else
            {
                BlzFrameSetVisible(MusicButtons[i], false);
            }
        }
    }

    /// <summary>
    /// Whenever the player presses the stats button, this function shows the frame for that player using local player. 
    /// </summary>
    public static void MusicFrameActions()
    {
        var player = GetTriggerPlayer();
        if (player.IsLocal)
        {
            FrameManager.MusicButton.Visible = false;
            FrameManager.MusicButton.Visible = true;
            MusicFramehandle.Visible = !MusicFramehandle.Visible;
            PopulateMusicFrame(player);
        }
    }
}