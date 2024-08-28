using WCSharp.Api;
using System;
using static WCSharp.Api.Common;

public static class FrameManager
{
    public static void Initialize()
    {
        RemoveUnwantedFrames();
        TopCenterBackdrop();
        CreateStatsButton();
        CreateShopButton();
    }


    public static void RemoveUnwantedFrames()
    {
        BlzFrameSetText(BlzGetFrameByName("ResourceBarSupplyText", 0), "0:00");
        BlzFrameSetVisible(BlzFrameGetChild(BlzFrameGetChild(BlzGetOriginFrame(ORIGIN_FRAME_GAME_UI, 0), 5), 0), false);

    }

    private static void CreateStatsButton()
    {
        var statsButton = BlzCreateFrameByType("GLUETEXTBUTTON", "StatsButton", BlzGetOriginFrame(ORIGIN_FRAME_GAME_UI, 0), "DebugButton", 0);
        BlzFrameSetAbsPoint(statsButton, FRAMEPOINT_CENTER, 0.3790f, 0.5823f);
        BlzFrameSetSize(statsButton, 0.043f, 0.022f);
        BlzFrameSetText(statsButton, "Stats");
    }

    private static void CreateShopButton()
    {
        var shopButton = BlzCreateFrameByType("GLUETEXTBUTTON", "ShopButton", BlzGetOriginFrame(ORIGIN_FRAME_GAME_UI, 0), "DebugButton", 0);
        BlzFrameSetAbsPoint(shopButton, FRAMEPOINT_CENTER, 0.4210f, 0.5823f);
        BlzFrameSetSize(shopButton, 0.043f, 0.022f);
        BlzFrameSetText(shopButton, "Shop");
    }

    private static void TopCenterBackdrop()
    {
        //var container = BlzCreateFrameByType("FRAME", "TopCenterContainer", BlzGetOriginFrame(ORIGIN_FRAME_GAME_UI, 0), "ScoreScreenBackdrop", 0);
        var backdrop = BlzCreateFrameByType("BACKDROP", "TopCenterBackdrop", BlzGetOriginFrame(ORIGIN_FRAME_GAME_UI, 0), "QuestButtonDisabledBackdropTemplate", 0);
        BlzFrameSetAbsPoint(backdrop, FRAMEPOINT_CENTER, 0.40f, 0.59f);
        BlzFrameSetSize(backdrop, 0.1f, 0.05f);
    }


}