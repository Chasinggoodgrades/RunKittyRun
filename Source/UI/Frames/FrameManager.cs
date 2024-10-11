using WCSharp.Api;
using System;
using static WCSharp.Api.Common;
using System.Collections.Generic;

public static class FrameManager
{
    public static trigger StatsTrigger = CreateTrigger();
    public static trigger ShopTrigger = CreateTrigger();
    public static framehandle MusicButton;
    public static framehandle ShopButton;
    public static void Initialize()
    {
        RemoveUnwantedFrames();
        TopCenterBackdrop();
        CreateMusicButton();
        CreateShopButton();
        MusicFrame.Initialize();
        ShopFrame.Initialize();
    }

    private static void RemoveUnwantedFrames()
    {
        var resourceBarText = BlzGetFrameByName("ResourceBarSupplyText", 0);
        var timeDayDisplay = BlzFrameGetChild(BlzFrameGetChild(BlzGetOriginFrame(ORIGIN_FRAME_GAME_UI, 0), 5), 0);
        resourceBarText.Text = "0:00";
        timeDayDisplay.Visible = false;
    }

    private static void CreateMusicButton()
    {
        MusicButton = BlzCreateFrameByType("GLUETEXTBUTTON", "MusicButton", BlzGetOriginFrame(ORIGIN_FRAME_GAME_UI, 0), "DebugButton", 0);
        MusicButton.SetAbsPoint(FRAMEPOINT_CENTER, 0.3790f, 0.5823f);
        MusicButton.SetSize(0.043f, 0.022f);
        MusicButton.Text = "Music";
        StatsTrigger.RegisterFrameEvent(MusicButton, FRAMEEVENT_CONTROL_CLICK);
        StatsTrigger.AddAction(MusicFrame.MusicFrameActions);
    }

    private static void CreateShopButton()
    {
        ShopButton = BlzCreateFrameByType("GLUETEXTBUTTON", "ShopButton", BlzGetOriginFrame(ORIGIN_FRAME_GAME_UI, 0), "DebugButton", 0);
        ShopButton.SetAbsPoint(FRAMEPOINT_CENTER, 0.4210f, 0.5823f);
        ShopButton.SetSize(0.043f, 0.022f);
        ShopButton.Text = "Shop";
        ShopTrigger.RegisterFrameEvent(ShopButton, FRAMEEVENT_CONTROL_CLICK);
        ShopTrigger.AddAction(ShopFrame.ShopFrameActions);
    }

    private static void TopCenterBackdrop()
    {
        var backdrop = BlzCreateFrameByType("BACKDROP", "TopCenterBackdrop", BlzGetOriginFrame(ORIGIN_FRAME_GAME_UI, 0), "QuestButtonDisabledBackdropTemplate", 0);
        backdrop.SetAbsPoint(FRAMEPOINT_CENTER, 0.40f, 0.59f);
        backdrop.SetSize(0.1f, 0.05f);
    }
}


