using System;
using System.Collections.Generic;
using System.Drawing;
using WCSharp.Api;
using WCSharp.Events;
using WCSharp.Shared;
using WCSharp.Shared.Data;
using WCSharp.Sync;
using static WCSharp.Api.Common;


public class Colors
{
    public const string COLOR_GOLD = "|c00FFCC00";
    public const string COLOR_YELLOW_ORANGE = "|c00FF9900";
    public const string COLOR_RED = "|c00FF0000";
    public const string COLOR_GREEN = "|c0000FF00";
    public const string COLOR_BLUE = "|c0000FF";
    public const string COLOR_PURPLE = "|c00CC00FF";
    public const string COLOR_CYAN = "|c000FFFFF";
    public const string COLOR_ORANGE = "|c00FF9900";
    public const string COLOR_VIOLET = "|c00EE82EE";
    public const string COLOR_PINK = "|c00FFC0CB";
    public const string COLOR_BLACK = "|c00000000";
    public const string COLOR_WHITE = "|c00FFFFFF";
    public const string COLOR_GREY = "|c00808080";
    public const string COLOR_BROWN = "|c008B4513";
    public const string COLOR_LIME = "|c0000FF00";
    public const string COLOR_TEAL = "|c0000FF";
    public const string COLOR_YELLOW = "|c00FFFF00";
    public const string COLOR_DARK_RED = "|c008B0000";
    public const string COLOR_RESET = "|r";
    private static List<Colors> ColorManager = new List<Colors>();
    private string colorname;
    private int colorID;
    private string colorcode;

    public Colors(string colorname, int colorID, string colorcode)
    {
        this.colorname = colorname;
        this.colorcode = colorcode;
        this.colorID = colorID;
    }

    public static void AddColor(string colorname, int colorID, string colorcode)
    {
        ColorManager.Add(new Colors(colorname, colorID, colorcode));
    }

    public static void Initialize()
    {
        AddColor("red", 1, "|cffff0303");
        AddColor("blue", 2, "|cff0042ff");
        AddColor("teal", 3, "|cff1be7ba");
        AddColor("purple", 4, "|cff550081");
        AddColor("yellow", 5, "|cfffefc00");
        AddColor("orange", 6, "|cfffe890d");
        AddColor("green", 7, "|cff21bf00");
        AddColor("pink", 8, "|cffe45caf");
        AddColor("gray", 9, "|cff939596");
        AddColor("light blue,lb,light-blue,lightblue", 10, "|cff7ebff1");
        AddColor("darkgreen,dark green,dg,dark-green", 11, "|cff106247");
        AddColor("brown", 12, "|cff4f2b05");
        AddColor("maroon", 13, "|cff9c0000");
        AddColor("navy", 14, "|cff0000c3");
        AddColor("turquoise", 15, "|cff00ebff");
        AddColor("violet", 16, "|cffbd00ff");
        AddColor("wheat", 17, "|cffecce87");
        AddColor("peach", 18, "|cfff7a58b");
        AddColor("mint", 19, "|cffbfff81");
        AddColor("lavender", 20, "|cffdbb8eb");
        AddColor("coal", 21, "|cff4f5055");
        AddColor("snow,white", 22, "|cffecf0ff");
        AddColor("emerald", 23, "|cff00781e");
        AddColor("peanut", 24, "|cffa56f34");
    }

    /// <summary>
    /// Returns the color code string for that particular color.
    /// Use (1-24) for player colors.
    /// </summary>
    public static string GetPlayerColor(int playerColorID)
    {
        foreach (var color in ColorManager)
        {
            if (color.colorID == playerColorID)
            {
                return color.colorcode;
            }
        }
        return "|cffffffff";
    }

    /// <summary>
    /// Colorizes a player's name based on their player ID.
    /// </summary>
    public static string PlayerNameColored(player p)
    {
        return GetPlayerColor(GetPlayerId(p) + 1) + p.Name + COLOR_RESET;
    }

    /// <summary>
    /// Colorizes a string based on integer value of player color ID.
    /// Use (1-24) for player colors.
    /// </summary>
    public static string ColorString(string text, int playerColorID)
    {
        return GetPlayerColor(playerColorID) + text + COLOR_RESET;
    }




}
