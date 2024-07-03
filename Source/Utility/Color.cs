using System;
using System.Collections.Generic;
using System.Drawing;
using WCSharp.Api;
using WCSharp.Events;
using WCSharp.Shared;
using WCSharp.Shared.Data;
using WCSharp.Sync;
using static WCSharp.Api.Common;


public static class Color
{
    public static string COLOR_GOLD = "|c00FFCC00";
    public static string COLOR_YELLOW_ORANGE = "|c00FF9900";
    public static string COLOR_RESET = "|r";
    public static readonly Dictionary<int, string> playerColors = new Dictionary<int, string>
    {
        { 1, "|cffff0303" },  // Red
        { 2, "|cff0042ff" },  // Blue
        { 3, "|cff1be7ba" },  // Teal
        { 4, "|cff550081" },  // Purple
        { 5, "|cfffefc00" },  // Yellow
        { 6, "|cfffe890d" },  // Orange
        { 7, "|cff21bf00" },  // Green
        { 8, "|cffe45caf" },  // Pink
        { 9, "|cff939596" },  // Gray
        { 10, "|cff7ebff1" }, // Light Blue
        { 11, "|cff106247" }, // Dark Green
        { 12, "|cff4f2b05" }, // Brown
        { 13, "|cff9c0000" }, // Maroon
        { 14, "|cff0000c3" }, // Navy
        { 15, "|cff00ebff" }, // Turquoise
        { 16, "|cffbd00ff" }, // Violet
        { 17, "|cffecce87" }, // Wheat
        { 18, "|cfff7a58b" }, // Peach
        { 19, "|cffbfff81" }, // Mint
        { 20, "|cffdbb8eb" }, // Lavender
        { 21, "|cff4f5055" }, // Coal
        { 22, "|cffecf0ff" }, // Snow
        { 23, "|cff00781e" }, // Emerald
        { 24, "|cffa56f34" }  // Peanut
    };
    public static string GetPlayerColor(player p)
    {
        var playerId = GetPlayerId(p) + 1;
        if (playerColors.TryGetValue(playerId, out var color))
        {
            return color;
        }
        return "|cffffffff";
    }
    public static string PlayerNameColored(player p)
    {
        return GetPlayerColor(p) + p.Name + COLOR_RESET;
    }
}
