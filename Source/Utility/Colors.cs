using System.Collections.Generic;
using System.Text;
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
    private int red;
    private int green;
    private int blue;

    public Colors(string colorname, int colorID, string colorcode, playercolor playercolor, int red, int green, int blue)
    {
        this.colorname = colorname;
        this.colorcode = colorcode;
        this.colorID = colorID;
        this.playercolor = playercolor;
        this.red = red;
        this.green = green;
        this.blue = blue;
    }

    public static void AddColor(string colorname, int colorID, string colorcode, playercolor playercolor, int redValue, int greenValue, int blueValue)
    {
        ColorManager.Add(new Colors(colorname, colorID, colorcode, playercolor, redValue, greenValue, blueValue));
    }

    public static void Initialize()
    {
        AddColor("red", 1, "|cffff0303", playercolor.Red, 255, 3, 3);
        AddColor("blue", 2, "|cff0042ff", playercolor.Blue, 0, 66, 255);
        AddColor("teal", 3, "|cff1be7ba", playercolor.Cyan, 27, 231, 186);
        AddColor("purple", 4, "|cff550081", playercolor.Purple, 85, 0, 129);
        AddColor("yellow", 5, "|cfffefc00", playercolor.Yellow, 254, 252, 0);
        AddColor("orange", 6, "|cfffe890d", playercolor.Orange, 254, 137, 13);
        AddColor("green", 7, "|cff21bf00", playercolor.Green, 33, 191, 0);
        AddColor("pink", 8, "|cffe45caf", playercolor.Pink, 228, 92, 175);
        AddColor("gray", 9, "|cff939596", playercolor.LightGray, 147, 149, 150);
        AddColor("lightblue,lb,light-blue", 10, "|cff7ebff1", playercolor.LightBlue, 126, 191, 241);
        AddColor("darkgreen,dg,dark-green", 11, "|cff106247", playercolor.Emerald, 16, 98, 71);
        AddColor("brown", 12, "|cff4f2b05", playercolor.Brown, 79, 43, 5);
        AddColor("maroon", 13, "|cff9c0000", playercolor.Maroon, 156, 0, 0);
        AddColor("navy", 14, "|cff0000c3", playercolor.Navy, 0, 0, 195);
        AddColor("turquoise", 15, "|cff00ebff", playercolor.Turquoise, 0, 235, 255);
        AddColor("violet", 16, "|cffbd00ff", playercolor.Violet, 189, 0, 255);
        AddColor("wheat", 17, "|cffecce87", playercolor.Wheat, 236, 206, 135);
        AddColor("peach", 18, "|cfff7a58b", playercolor.Peach, 247, 165, 139);
        AddColor("mint", 19, "|cffbfff81", playercolor.Mint, 191, 255, 129);
        AddColor("lavender", 20, "|cffdbb8eb", playercolor.Lavender, 219, 184, 235);
        AddColor("coal", 21, "|cff4f5055", playercolor.Coal, 79, 80, 85);
        AddColor("snow,white", 22, "|cffecf0ff", playercolor.Snow, 236, 240, 255);
        AddColor("emerald", 23, "|cff00781e", playercolor.Emerald, 0, 120, 30);
        AddColor("peanut", 24, "|cffa56f34", playercolor.Peanut, 165, 111, 52);
    }

    /// <summary>
    /// Colorizes a player's name based on their player ID.
    /// </summary>
    public static string PlayerNameColored(player p) => GetStringColorOfPlayer(GetPlayerId(p) + 1) + p.Name + COLOR_RESET;

    /// <summary>
    /// Colorizes a string based on integer value of player color ID.
    /// Use (1-24) for player colors.
    /// </summary>
    public static string ColorString(string text, int playerColorID) => GetStringColorOfPlayer(playerColorID) + text + COLOR_RESET;

    /// <summary>
    /// Returns the color code string for that particular color.
    /// Use (1-24) for player colors. So.. (player.Id + 1)
    /// </summary>
    public static string GetStringColorOfPlayer(int playerColorID)
    {
        for (int i = 0; i < ColorManager.Count; i++)
        {
            var color = ColorManager[i];
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
        int r = 0, g = 0, b = 0;

        if (RGB.Length > 0) r = int.Parse(RGB[0]);
        if (RGB.Length > 1) g = int.Parse(RGB[1]);
        if (RGB.Length > 2) b = int.Parse(RGB[2]);

        kitty.Unit.SetVertexColor(r, g, b, 255);
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
        return text != null && text.Length > 0 ? COLOR_YELLOW + text + COLOR_RESET : $"{COLOR_RED}ERROR{COLOR_RESET}";
    }

    /// <summary>
    /// Sets the unit's vertex color based on the passed parameter playerID...
    /// </summary>
    /// <param name="unit"></param>
    /// <param name="playerID"></param>
    public static void SetUnitToVertexColor(unit unit, int playerID)
    {
        var color = ColorManager[playerID];
        unit.SetVertexColor(color.red, color.green, color.blue, 255);
    }

    public static void ListColorCommands(player player)
    {
        StringBuilder combinedColors = new StringBuilder();

        foreach (var color in ColorManager)
            combinedColors.Append($"{color.colorcode}{color.colorname}|r, ");

        player.DisplayTimedTextTo(10.0f, combinedColors.ToString());
    }

    public static player GetPlayerByColor(string colorName)
    {
        foreach (var color in ColorManager)
        {
            if (ColorContainsCommand(color, colorName.ToLower()))
            {
                return Player(color.colorID - 1);
            }
        }
        return null;
    }

    /// <summary>
    /// This function only calls at the end of the game for SaveData purposes. So it should be okay to run and update all player colors accordingly.
    /// </summary>
    /// <param name="kitty"></param>
    public static void UpdateColors(Kitty kitty)
    {
        var colorData = new Dictionary<string, string>();

    }

    public static string GetMostPlayedColor(Kitty kitty)
    {
        var colorData = kitty.SaveData.PlayerColorData.PlayedColors;
        if (string.IsNullOrEmpty(colorData)) return null;

        string[] pairs = colorData.Split(','); // splits like .. "red:5", "blue:6", etc.
        string mostPlayedColor = "";
        int maxCount = 0;

        for (int i = 0; i < pairs.Length; i++)
        {
            var pair = pairs[i];
            string[] parts = pair.Split(':');
            if (parts.Length == 2 && int.TryParse(parts[1], out int count))
            {
                if (count > maxCount)
                {
                    mostPlayedColor = parts[0];
                    maxCount = count;
                }
            }
        }
        return mostPlayedColor;
    }

}
