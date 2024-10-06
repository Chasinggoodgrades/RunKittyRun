using System.Collections.Generic;
using System;
using WCSharp.Api;
using static WCSharp.Api.Common;
public static class ShopFrame
{
    private static framehandle ShopFramehandle;
    private static framehandle ShopFrameTitle;
    private static Dictionary<int, framehandle> ShopButtons = new Dictionary<int, framehandle>();
    private static string[] Headers;
    private static float MusicHeaderX = 0.175f;
    private static float MusicHeaderY = 0.48f;
    private const float ButtonWidth = 0.17f;
    private const float ButtonHeight = 0.023f;
    private const float ButtonSpacing = 0.025f; // Space between buttons
    private const float ButtonStartX = 0.40f;  // X coordinate for button positions
    private const float ButtonStartY = 0.505f;  // Starting Y coordinate for the first button
    public static void ShopFrameActions()
    {


    }

}