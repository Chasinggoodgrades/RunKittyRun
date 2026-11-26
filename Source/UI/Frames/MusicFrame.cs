using System;
using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class MusicFrame
{
    public static framehandle MusicFramehandle;
    private static framehandle scrollUpButton;
    private static framehandle scrollDownButton;
    private static framehandle GameUI = originframetype.GameUI.GetOriginFrame(0);
    private static Dictionary<player, int> MusicOffsets = new Dictionary<player, int>(); // songs scrolled past the top, per player
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
        // sized for the nine visible buttons, not for the whole list (the arrow buttons and the wheel scroll it)
        MusicFramehandle.SetSize(0.25f, 0.257f);

        FrameManager.CreateHeaderFrame(MusicFramehandle, "Music");

        // an inset panel behind the list and the arrows
        var listPanel = BlzCreateFrame("ShopPanelBackdrop", MusicFramehandle, 0, 0);
        listPanel.SetPoint(framepointtype.TopLeft, 0.01f, -0.012f, MusicFramehandle, framepointtype.TopLeft);
        listPanel.SetPoint(framepointtype.BottomRight, -0.01f, 0.01f, MusicFramehandle, framepointtype.BottomRight);

        InitializeMusicButtons();
        CreateScrollControls();
        MusicFramehandle.Visible = false;
    }

    /// <summary>
    /// Up / down buttons and the mouse wheel scroll the list. The offset is kept per player and changed from synced
    /// click events, so it is the same on every machine; only the local player redraws.
    /// </summary>
    private static void CreateScrollControls()
    {
        foreach (var player in Globals.ALL_PLAYERS)
            if (!MusicOffsets.ContainsKey(player))
                MusicOffsets.Add(player, 0);

        scrollUpButton = BlzCreateFrame("ScriptDialogButton", MusicFramehandle, 0, 0);
        scrollUpButton.SetSize(0.02f, 0.03f);
        scrollUpButton.SetAbsPoint(framepointtype.TopLeft, 0.4845f, 0.4765f);
        scrollUpButton.Text = "^";

        scrollDownButton = BlzCreateFrame("ScriptDialogButton", MusicFramehandle, 0, 0);
        scrollDownButton.SetSize(0.02f, 0.03f);
        scrollDownButton.SetAbsPoint(framepointtype.BottomLeft, 0.4845f, 0.2535f);
        scrollDownButton.Text = "v";

        scrollUpButton.Visible = MaxScrollOffset > 0; // nothing to scroll when everything fits
        scrollDownButton.Visible = MaxScrollOffset > 0;

        var upTrigger = trigger.Create();
        upTrigger.RegisterFrameEvent(scrollUpButton, frameeventtype.Click);
        upTrigger.AddAction(ErrorHandler.Wrap(() => ScrollBy(@event.Player, -1)));

        var downTrigger = trigger.Create();
        downTrigger.RegisterFrameEvent(scrollDownButton, frameeventtype.Click);
        downTrigger.AddAction(ErrorHandler.Wrap(() => ScrollBy(@event.Player, 1)));

        // wheel over any song button
        var wheelTrigger = trigger.Create();
        for (int i = 0; i < MusicButtons.Count; i++)
            wheelTrigger.RegisterFrameEvent(MusicButtons[i], frameeventtype.MouseWheel);
        wheelTrigger.AddAction(ErrorHandler.Wrap(() => ScrollBy(@event.Player, @event.FrameValue > 0 ? -1 : 1)));
    }

    private static void ScrollBy(player player, int songs)
    {
        if (!MusicOffsets.ContainsKey(player)) return;

        var offset = MusicOffsets[player] + songs;
        if (offset < 0) offset = 0;
        if (offset > MaxScrollOffset) offset = MaxScrollOffset;
        MusicOffsets[player] = offset;

        if (!player.IsLocal) return;
        PopulateMusicFrame(player);
        FrameManager.RefreshFrame(scrollUpButton);   // drop the button's focus so hotkeys keep working
        FrameManager.RefreshFrame(scrollDownButton);
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

        int offset = MusicOffsets[player];
        if (offset < 0) offset = 0;
        if (offset > maxOffset) offset = maxOffset;

        // greyed at either end of the list
        scrollUpButton.Alpha = offset > 0 ? 255 : 110;
        scrollDownButton.Alpha = offset < maxOffset ? 255 : 110;

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
