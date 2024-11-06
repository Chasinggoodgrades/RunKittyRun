using WCSharp.Api;
using System;
using static WCSharp.Api.Common;
using System.Collections.Generic;

public static class FrameManager
{
    public static trigger StatsTrigger = trigger.Create();
    public static trigger ShopTrigger = trigger.Create();
    public static trigger RewardsTrigger = trigger.Create();
    public static framehandle MusicButton;
    public static framehandle ShopButton;
    public static framehandle RewardsButton;
    private static framehandle GameUI = originframetype.GameUI.GetOriginFrame(0);
    private static trigger ESCTrigger = trigger.Create();
    public static void Initialize()
    {
        RemoveUnwantedFrames();
        TopCenterBackdrop();
        CreateMusicButton();
        CreateShopButton();
        CreateRewardsButton();
        MusicFrame.Initialize();
        ShopFrame.Initialize();
        Utility.SimpleTimer(1.0f, ESCHideFrames);
    }

    public static framehandle CreateHeaderFrame(framehandle parent)
    {
        // Header Bar
        var header = framehandle.Create("BACKDROP", $"{parent.Name}Header", parent, "QuestButtonDisabledBackdropTemplate", 0);
        var width = parent.Width;
        var height = 0.0225f;
        header.SetPoint(framepointtype.TopLeft, 0, 0.0125f, parent, framepointtype.TopLeft);
        header.SetSize(width, height);

        // Title
        var title = framehandle.Create("TEXT", $"{parent.Name}Title", header, "ScriptDialogText", 0);
        title.SetPoint(framepointtype.Center, 0, 0, header, framepointtype.Center);
        title.SetSize(width, height);
        title.Text = $"{Colors.COLOR_YELLOW}{parent.Name}{Colors.COLOR_RESET}";
        title.SetTextAlignment(textaligntype.Center, textaligntype.Center);

        // Close Button
        var closeButton = framehandle.Create("GLUETEXTBUTTON", $"{parent.Name}CloseButton", header, "ScriptDialogButton", 0);
        closeButton.SetPoint(framepointtype.TopRight, -0.0025f, -0.0025f, header, framepointtype.TopRight);
        closeButton.SetSize(height - 0.005f, height - 0.005f);
        closeButton.Text = "X";

        // Close Actions
        var closeTrigger = trigger.Create();
        closeTrigger.RegisterFrameEvent(closeButton, frameeventtype.Click);
        closeTrigger.AddAction(() =>
        {
            if (!@event.Player.IsLocal) return;
            parent.Visible = false;
        });

        return header;
    }

    private static void RemoveUnwantedFrames()
    {
        var resourceBarText = BlzGetFrameByName("ResourceBarSupplyText", 0);
        var timeDayDisplay = BlzFrameGetChild(BlzFrameGetChild(GameUI, 5), 0);
        resourceBarText.Text = "0:00";
        timeDayDisplay.Visible = false;
    }

    private static void CreateMusicButton()
    {
        MusicButton = framehandle.Create("GLUETEXTBUTTON", "MusicButton", GameUI, "DebugButton", 0);
        MusicButton.SetAbsPoint(framepointtype.Center, 0.3790f, 0.5823f);
        MusicButton.SetSize(0.043f, 0.022f);
        MusicButton.Text = "Music";
        StatsTrigger.RegisterFrameEvent(MusicButton, frameeventtype.Click);
        StatsTrigger.AddAction(MusicFrame.MusicFrameActions);
    }

    private static void CreateShopButton()
    {
        ShopButton = framehandle.Create("GLUETEXTBUTTON", "ShopButton", GameUI, "DebugButton", 0);
        ShopButton.SetAbsPoint(framepointtype.Center, 0.4210f, 0.5823f);
        ShopButton.SetSize(0.043f, 0.022f);
        ShopButton.Text = "Shop";
        ShopTrigger.RegisterFrameEvent(ShopButton, frameeventtype.Click);
        ShopTrigger.AddAction(ShopFrame.ShopFrameActions);
    }

    private static void CreateRewardsButton()
    {
        RewardsButton = framehandle.Create("GLUETEXTBUTTON", "RewardsButton", GameUI, "DebugButton", 0);
        RewardsButton.SetAbsPoint(framepointtype.Center, 0.24f, 0.15f);
        RewardsButton.SetSize(0.0525f, 0.025f);
        RewardsButton.Text = "Rewards";
        RewardsTrigger.RegisterFrameEvent(RewardsButton, frameeventtype.Click);
        RewardsTrigger.AddAction(RewardsFrame.RewardsFrameActions);
    }

    private static void TopCenterBackdrop()
    {
        var backdrop = framehandle.Create("BACKDROP", "TopCenterBackdrop", GameUI, "QuestButtonDisabledBackdropTemplate", 0);
        backdrop.SetAbsPoint(framepointtype.Center, 0.40f, 0.59f);
        backdrop.SetSize(0.1f, 0.05f);
    }

    private static void ESCHideFrames()
    {
        foreach(var player in Globals.ALL_PLAYERS)
        {
            ESCTrigger.RegisterPlayerEvent(player, playerevent.EndCinematic);
        }
        ESCTrigger.AddAction(ESCActions);
    }

    public static void RefreshFrame(framehandle frame)
    {
        frame.Visible = !frame.Visible;
        frame.Visible = !frame.Visible;
    }

    private static void ESCActions()
    {
        var player = @event.Player;
        if (!player.IsLocal) return;
        RewardsFrame.RewardFrame.Visible = false;
        ShopFrame.shopFrame.Visible = false;
        MusicFrame.MusicFramehandle.Visible = false;
    }
}


