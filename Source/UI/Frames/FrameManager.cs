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
    private static framehandle GameUI = originframetype.GameUI.GetOriginFrame(0);
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
        var timeDayDisplay = BlzFrameGetChild(BlzFrameGetChild(GameUI, 5), 0);
        resourceBarText.Text = "0:00";
        timeDayDisplay.Visible = false;
    }

    private static void CreateMusicButton()
    {
        MusicButton = BlzCreateFrameByType("GLUETEXTBUTTON", "MusicButton", GameUI, "DebugButton", 0);
        MusicButton.SetAbsPoint(framepointtype.Center, 0.3790f, 0.5823f);
        MusicButton.SetSize(0.043f, 0.022f);
        MusicButton.Text = "Music";
        StatsTrigger.RegisterFrameEvent(MusicButton, frameeventtype.Click);
        StatsTrigger.AddAction(MusicFrame.MusicFrameActions);
    }

    private static void CreateShopButton()
    {
        ShopButton = BlzCreateFrameByType("GLUETEXTBUTTON", "ShopButton", GameUI, "DebugButton", 0);
        ShopButton.SetAbsPoint(framepointtype.Center, 0.4210f, 0.5823f);
        ShopButton.SetSize(0.043f, 0.022f);
        ShopButton.Text = "Shop";
        ShopTrigger.RegisterFrameEvent(ShopButton, frameeventtype.Click);
        ShopTrigger.AddAction(ShopFrame.ShopFrameActions);
    }

    private static void TopCenterBackdrop()
    {
        var backdrop = framehandle.Create("BACKDROP", "TopCenterBackdrop", GameUI, "QuestButtonDisabledBackdropTemplate", 0);
        backdrop.SetAbsPoint(framepointtype.Center, 0.40f, 0.59f);
        backdrop.SetSize(0.1f, 0.05f);
    }
}


