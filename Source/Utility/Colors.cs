using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public class Colors
{
    public const string COLOR_GOLD = "|c00FFCC00";
    public const string COLOR_YELLOW_ORANGE = "|c00FF9900";
    public const string COLOR_RED = "|c00FF0000";
    public const string COLOR_GREEN = "|c0000FF00";
    public const string COLOR_BLUE = "|c000000FF";
    public const string COLOR_PURPLE = "|c00CC00FF";
    public const string COLOR_CYAN = "|c000FFFFF";
    public const string COLOR_ORANGE = "|c00FF9900";
    public const string COLOR_VIOLET = "|c00EE82EE";
    public const string COLOR_PINK = "|c00FFC0CB";
    public const string COLOR_LAVENDER = "|cffdbb8eb";
    public const string COLOR_BLACK = "|c00000000";
    public const string COLOR_WHITE = "|c00FFFFFF";
    public const string COLOR_GREY = "|c00808080";
    public const string COLOR_BROWN = "|c008B4513";
    public const string COLOR_LIME = "|c0000FF00";
    public const string COLOR_TURQUOISE = "|cff00ebff";
    public const string COLOR_YELLOW = "|c00FFFF00";
    public const string COLOR_DARK_RED = "|c008B0000";
    public const string COLOR_LIGHTBLUE = "|c006969FF";
    public const string COLOR_RESET = "|r";
    private static List<Colors> ColorManager = new List<Colors>();
    private string colorname;
    private int colorID;
    private string colorcode;
    private playercolor playercolor;

    public Colors(string colorname, int colorID, string colorcode, playercolor playercolor)
    {
        this.colorname = colorname;
        this.colorcode = colorcode;
        this.colorID = colorID;
        this.playercolor = playercolor;
    }

    public static void AddColor(string colorname, int colorID, string colorcode, playercolor playercolor)
    {
        ColorManager.Add(new Colors(colorname, colorID, colorcode, playercolor));
    }

    public static void Initialize()
    {
        AddColor("red", 1, "|cffff0303", playercolor.Red);
        AddColor("blue", 2, "|cff0042ff", playercolor.Blue);
        AddColor("teal", 3, "|cff1be7ba", playercolor.Cyan);
        AddColor("purple", 4, "|cff550081", playercolor.Purple);
        AddColor("yellow", 5, "|cfffefc00", playercolor.Yellow);
        AddColor("orange", 6, "|cfffe890d", playercolor.Orange);
        AddColor("green", 7, "|cff21bf00", playercolor.Green);
        AddColor("pink", 8, "|cffe45caf", playercolor.Pink);
        AddColor("gray", 9, "|cff939596", playercolor.LightGray);
        AddColor("light blue,lb,light-blue,lightblue", 10, "|cff7ebff1", playercolor.LightBlue);
        AddColor("darkgreen,dark green,dg,dark-green", 11, "|cff106247", playercolor.Emerald);
        AddColor("brown", 12, "|cff4f2b05", playercolor.Brown);
        AddColor("maroon", 13, "|cff9c0000", playercolor.Maroon);
        AddColor("navy", 14, "|cff0000c3", playercolor.Navy);
        AddColor("turquoise", 15, "|cff00ebff", playercolor.Turquoise);
        AddColor("violet", 16, "|cffbd00ff", playercolor.Violet);
        AddColor("wheat", 17, "|cffecce87", playercolor.Wheat);
        AddColor("peach", 18, "|cfff7a58b", playercolor.Peach);
        AddColor("mint", 19, "|cffbfff81", playercolor.Mint);
        AddColor("lavender", 20, "|cffdbb8eb", playercolor.Lavender);
        AddColor("coal", 21, "|cff4f5055", playercolor.Coal);
        AddColor("snow,white", 22, "|cffecf0ff", playercolor.Snow);
        AddColor("emerald", 23, "|cff00781e", playercolor.Emerald);
        AddColor("peanut", 24, "|cffa56f34", playercolor.Peanut);
    }

    /// <summary>
    /// Colorizes a player's name based on their player ID.
    /// </summary>
    public static string PlayerNameColored(player p) => GetPlayerColor(GetPlayerId(p) + 1) + p.Name + COLOR_RESET;

    /// <summary>
    /// Colorizes a string based on integer value of player color ID.
    /// Use (1-24) for player colors.
    /// </summary>
    public static string ColorString(string text, int playerColorID) => GetPlayerColor(playerColorID) + text + COLOR_RESET;

    /// <summary>
    /// Returns the color code string for that particular color.
    /// Use (1-24) for player colors. So.. (player.Id + 1)
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

    public static void SetPlayerColor(player p, string color)
    {
        var kitty = Globals.ALL_KITTIES[p];
        foreach (var c in ColorManager)
        {
            if (ColorContainsCommand(c, color))
                kitty.Unit.SetColor(playercolor.Convert(c.colorID - 1));
        }
    }

    public static void SetPlayerVertexColor(player p, string[] RGB)
    {
        var kitty = Globals.ALL_KITTIES[p];
        if (RGB.Length == 4)
        {
            var r = int.Parse(RGB[1]);
            var g = int.Parse(RGB[2]);
            var b = int.Parse(RGB[3]);
            kitty.Unit.SetVertexColor(r, g, b, 255);
        }
    }

    /// <summary>
    /// Sets a player's vertex color to a random RGB value.
    /// </summary>
    /// <param name="p">The player object</param>
    public static void SetPlayerRandomVertexColor(player p)
    {
        var kitty = Globals.ALL_KITTIES[p];
        var r = GetRandomInt(0, 255);
        var g = GetRandomInt(0, 255);
        var b = GetRandomInt(0, 255);
        kitty.Unit.SetVertexColor(r, g, b, 255);
        p.DisplayTimedTextTo(5.0f, $"{COLOR_RED}Red: {COLOR_RESET}{r}, {COLOR_GREEN}Green: {COLOR_RESET}{g}, {COLOR_BLUE}Blue: {COLOR_RESET}{b}");
    }

    private static bool ColorContainsCommand(Colors color, string inputColor)
    {
        var colorCommands = color.colorname.Split(",");
        foreach (var command in colorCommands)
            if (command == inputColor)
                return true;
        return false;
    }

    /// <summary>
    /// Highlights a string with yellow color.
    /// </summary>
    /// <param name="text"></param>
    /// <returns></returns>
    public static string HighlightString(string text)
    {
        if(text != null && text.Length > 0) return COLOR_YELLOW + text + COLOR_RESET;
        else return $"{COLOR_RED}ERROR{COLOR_RESET}";
    }

}
