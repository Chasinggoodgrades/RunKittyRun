using WCSharp.Api;
using System;
using static WCSharp.Api.Common;
using System.Collections.Generic;

public static class FrameManager
{
    public static trigger StatsTrigger = CreateTrigger();
    public static trigger ShopTrigger = CreateTrigger();
    public static framehandle MusicButton;
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
        BlzFrameSetText(BlzGetFrameByName("ResourceBarSupplyText", 0), "0:00");
        BlzFrameSetVisible(BlzFrameGetChild(BlzFrameGetChild(BlzGetOriginFrame(ORIGIN_FRAME_GAME_UI, 0), 5), 0), false); // Hides time/day display
    }

    private static void CreateMusicButton()
    {
        MusicButton = BlzCreateFrameByType("GLUETEXTBUTTON", "MusicButton", BlzGetOriginFrame(ORIGIN_FRAME_GAME_UI, 0), "DebugButton", 0);
        BlzFrameSetAbsPoint(MusicButton, FRAMEPOINT_CENTER, 0.3790f, 0.5823f);
        BlzFrameSetSize(MusicButton, 0.043f, 0.022f);
        BlzFrameSetText(MusicButton, "Music");
        StatsTrigger.RegisterFrameEvent(MusicButton, FRAMEEVENT_CONTROL_CLICK);
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


