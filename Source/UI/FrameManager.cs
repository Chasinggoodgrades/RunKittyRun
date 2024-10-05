using WCSharp.Api;
using System;
using static WCSharp.Api.Common;
using System.Collections.Generic;

public static class FrameManager
{
    public static trigger StatsTrigger = CreateTrigger();
    public static trigger ShopTrigger = CreateTrigger();
    public static void Initialize()
    {
        RemoveUnwantedFrames();
        TopCenterBackdrop();
        CreateMusicButton();
        CreateShopButton();
        Utility.SimpleTimer(0.50f, MusicFrame.Initialize);
    }

    private static void RemoveUnwantedFrames()
    {
        BlzFrameSetText(BlzGetFrameByName("ResourceBarSupplyText", 0), "0:00");
        BlzFrameSetVisible(BlzFrameGetChild(BlzFrameGetChild(BlzGetOriginFrame(ORIGIN_FRAME_GAME_UI, 0), 5), 0), false); // Hides time/day display
    }

    private static void CreateMusicButton()
    {
        var musicButton = BlzCreateFrameByType("GLUETEXTBUTTON", "MusicButton", BlzGetOriginFrame(ORIGIN_FRAME_GAME_UI, 0), "DebugButton", 0);
        BlzFrameSetAbsPoint(musicButton, FRAMEPOINT_CENTER, 0.3790f, 0.5823f);
        BlzFrameSetSize(musicButton, 0.043f, 0.022f);
        BlzFrameSetText(musicButton, "Music");
        StatsTrigger.RegisterFrameEvent(musicButton, FRAMEEVENT_CONTROL_CLICK);
        StatsTrigger.AddAction(MusicFrame.MusicFrameActions);
    }

    private static void CreateShopButton()
    {
        var shopButton = BlzCreateFrameByType("GLUETEXTBUTTON", "ShopButton", BlzGetOriginFrame(ORIGIN_FRAME_GAME_UI, 0), "DebugButton", 0);
        BlzFrameSetAbsPoint(shopButton, FRAMEPOINT_CENTER, 0.4210f, 0.5823f);
        BlzFrameSetSize(shopButton, 0.043f, 0.022f);
        BlzFrameSetText(shopButton, "Shop");
        ShopTrigger.RegisterFrameEvent(shopButton, FRAMEEVENT_CONTROL_CLICK);
        ShopTrigger.AddAction(ShopFrame.ShopFrameActions);
    }

    private static void TopCenterBackdrop()
    {
        var backdrop = BlzCreateFrameByType("BACKDROP", "TopCenterBackdrop", BlzGetOriginFrame(ORIGIN_FRAME_GAME_UI, 0), "QuestButtonDisabledBackdropTemplate", 0);
        BlzFrameSetAbsPoint(backdrop, FRAMEPOINT_CENTER, 0.40f, 0.59f);
        BlzFrameSetSize(backdrop, 0.1f, 0.05f);
    }
}

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
    private const float ButtonWidth = 0.13f;
    private const float ButtonHeight = 0.023f;
    private const float ButtonSpacing = 0.025f; // Space between buttons
    private const float ButtonStartX = 0.85f;  // X coordinate for button positions
    private const float ButtonStartY = 0.29f;  // Starting Y coordinate for the first button
    public static void Initialize()
    {
        try
        {
            MusicFramehandle = BlzCreateFrameByType("BACKDROP", "MusicFrame", BlzGetFrameByName("ConsoleUIBackdrop", 0), "QuestButtonDisabledBackdropTemplate", 0);
            BlzFrameSetAbsPoint(MusicFramehandle, FRAMEPOINT_CENTER, 0.85f, 0.24f);
            BlzFrameSetSize(MusicFramehandle, 0.16f, 0.15f);

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
        BlzFrameSetAbsPoint(MusicSlider, FRAMEPOINT_TOPLEFT, 0.92f, 0.3f);
        BlzFrameSetSize(MusicSlider, 0.01f, 0.125f);
        BlzFrameSetMinMaxValue(MusicSlider, 0, numberOfSongs);
        BlzFrameSetStepSize(MusicSlider, 1);

        foreach(var player in Globals.ALL_PLAYERS)
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
            if(BlzGetTriggerFrameValue() > 0) BlzFrameSetValue(MusicSlider, BlzGetTriggerFrameValue() + 1);
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
        int visibleButtons = 5;

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
                    positionY = ButtonStartY - ((visibleButtons - 1) * ButtonSpacing); // Same position as the 4th button
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
            MusicFramehandle.Visible = !MusicFramehandle.Visible;
            PopulateMusicFrame(player);
        }
    }
}

public static class ShopFrame
{

    public static void ShopFrameActions()
    {

    }

}