

class Colors
{
    public COLOR_GOLD: string = "|c00FFCC00";
    public COLOR_YELLOW_ORANGE: string = "|c00FF9900";
    public COLOR_RED: string = "|c00FF0000";
    public COLOR_GREEN: string = "|c0000FF00";
    public COLOR_BLUE: string = "|c000000FF";
    public COLOR_PURPLE: string = "|c00CC00FF";
    public COLOR_CYAN: string = "|c000FFFFF";
    public COLOR_ORANGE: string = "|c00FF9900";
    public COLOR_VIOLET: string = "|c00EE82EE";
    public COLOR_PINK: string = "|c00FFC0CB";
    public COLOR_LAVENDER: string = "|cffdbb8eb";
    public COLOR_BLACK: string = "|c00000000";
    public COLOR_WHITE: string = "|c00FFFFFF";
    public COLOR_GREY: string = "|c00808080";
    public COLOR_BROWN: string = "|c008B4513";
    public COLOR_LIME: string = "|c0000FF00";
    public COLOR_TURQUOISE: string = "|cff00ebff";
    public COLOR_YELLOW: string = "|c00FFFF00";
    public COLOR_DARK_RED: string = "|c008B0000";
    public COLOR_LIGHTBLUE: string = "|c006969FF";
    public COLOR_RESET: string = "|r";
    private static List<Colors> ColorManager = new List<Colors>();
    private static sb: StringBuilder = new StringBuilder();
    private colorname: string;
    private colorID: number;
    private colorcode: string;
    private playercolor: playercolor;
    private red: number;
    private green: number;
    private blue: number;

    public Colors(colorname: string, colorID: number, colorcode: string, playercolor: playercolor, red: number, green: number, blue: number)
    {
        this.colorname = colorname;
        this.colorcode = colorcode;
        this.colorID = colorID;
        this.playercolor = playercolor;
        this.red = red;
        this.green = green;
        this.blue = blue;
    }

    public static AddColor(colorname: string, colorID: number, colorcode: string, playercolor: playercolor, redValue: number, greenValue: number, blueValue: number)
    {
        ColorManager.Add(new Colors(colorname, colorID, colorcode, playercolor, redValue, greenValue, blueValue));
    }

    public static Initialize()
    {
        AddColor("red", 1, "|cffff0303", playercolor.Red, 255, 3, 3);
        AddColor("blue", 2, "|cff0042f", playercolor.Blue, 0, 66, 255);
        AddColor("teal", 3, "|cff1be7ba", playercolor.Cyan, 27, 231, 186);
        AddColor("purple", 4, "|cff550081", playercolor.Purple, 85, 0, 129);
        AddColor("yellow", 5, "|cfffefc00", playercolor.Yellow, 254, 252, 0);
        AddColor("orange", 6, "|cfffe890d", playercolor.Orange, 254, 137, 13);
        AddColor("green", 7, "|cff21bf00", playercolor.Green, 33, 191, 0);
        AddColor("pink", 8, "|cffe45caf", playercolor.Pink, 228, 92, 175);
        AddColor("gray", 9, "|cff939596", playercolor.LightGray, 147, 149, 150);
        AddColor("lightblue,lb,light-blue", 10, "|cff7ebff1", playercolor.LightBlue, 126, 191, 241);
        AddColor("darkgreen,dg,dark-green", 11, "|cff106247", playercolor.Emerald, 16, 98, 71);
        AddColor("brown", 12, "|cff42b05", playercolor.Brown, 79, 43, 5);
        AddColor("maroon", 13, "|cff9c0000", playercolor.Maroon, 156, 0, 0);
        AddColor("navy", 14, "|cff0000c3", playercolor.Navy, 0, 0, 195);
        AddColor("turquoise", 15, "|cff00ebff", playercolor.Turquoise, 0, 235, 255);
        AddColor("violet", 16, "|cffbd00f", playercolor.Violet, 189, 0, 255);
        AddColor("wheat", 17, "|cffecce87", playercolor.Wheat, 236, 206, 135);
        AddColor("peach", 18, "|cfff7a58b", playercolor.Peach, 247, 165, 139);
        AddColor("mint", 19, "|cffbfff81", playercolor.Mint, 191, 255, 129);
        AddColor("lavender", 20, "|cffdbb8eb", playercolor.Lavender, 219, 184, 235);
        AddColor("coal", 21, "|cff45055", playercolor.Coal, 79, 80, 85);
        AddColor("snow,white", 22, "|cffecf0f", playercolor.Snow, 236, 240, 255);
        AddColor("emerald", 23, "|cff00781e", playercolor.Emerald, 0, 120, 30);
        AddColor("peanut", 24, "|cffa5634", playercolor.Peanut, 165, 111, 52);
    }

    /// <summary>
    /// Colorizes a player's name based on their player ID.
    /// </summary>
    public static PlayerNameColored(p: player)  { return GetStringColorOfPlayer(GetPlayerId(p) + 1) + p.Name + COLOR_RESET; }

    /// <summary>
    /// Colorizes a string based on integer value of player color ID.
    /// Use (1-24) for player colors.
    /// </summary>
    public static ColorString(text: string, playerColorID: number)  { return GetStringColorOfPlayer(playerColorID) + text + COLOR_RESET; }

    /// <summary>
    /// Returns the color code string for that particular color.
    /// Use (1-24) for player colors. So.. (player.Id + 1)
    /// </summary>
    public static GetStringColorOfPlayer(playerColorID: number)
    {
        for (let i: number = 0; i < ColorManager.Count; i++)
        {
            let color: Colors = ColorManager[i];
            if (color.colorID == playerColorID)
            {
                return color.colorcode;
            }
        }
        return "|cffffffff";
    }

    public static SetPlayerColor(p: player, color: string)
    {
        let kitty: Kitty = Globals.ALL_KITTIES[p];
        for (let c in ColorManager)
        {
            if (ColorContainsCommand(c, color))
            {
                kitty.Unit.SetColor(playercolor.Convert(c.colorID - 1));
                kitty.SaveData.PlayerColorData.LastPlayedColor = c.colorname.Split(',')[0];
            }
        }
    }

    public static SetColorJoinedAs(p: player)
    {
        let kitty: Kitty = Globals.ALL_KITTIES[p];
        let color = ColorManager[p.Id];
        kitty.SaveData.PlayerColorData.LastPlayedColor = color.colorname.Split(',')[0];
    }

    public static SetPlayerVertexColor(p: player, string[] RGB)
    {
        let kitty: Kitty = Globals.ALL_KITTIES[p];
        let r: number = 0, g = 0, b = 0;

        if (RGB.Length > 0) r = int.Parse(RGB[0]);
        if (RGB.Length > 1) g = int.Parse(RGB[1]);
        if (RGB.Length > 2) b = int.Parse(RGB[2]);

        kitty.Unit.SetVertexColor(r, g, b, 255);
        Globals.ALL_KITTIES[p].SaveData.PlayerColorData.VortexColor = "{r},{g},{b}";
    }

    /// <summary>
    /// Sets a player's vertex color to a random RGB value.
    /// </summary>
    /// <param name="p">The player object</param>
    public static SetPlayerRandomVertexColor(p: player)
    {
        let kitty: Kitty = Globals.ALL_KITTIES[p];
        let r: number = GetRandomInt(0, 255);
        let g: number = GetRandomInt(0, 255);
        let b: number = GetRandomInt(0, 255);
        kitty.Unit.SetVertexColor(r, g, b, 255);
        p.DisplayTimedTextTo(5.0, "{COLOR_RED}Red: {COLOR_RESET}{r}, {COLOR_GREEN}Green: {COLOR_RESET}{g}, {COLOR_BLUE}Blue: {COLOR_RESET}{b}");
    }

    private static ColorContainsCommand(color: Colors, inputColor: string)
    {
        let colorCommands = color.colorname.Split(",");
        for (let command in colorCommands)
            if (command == inputColor)
                return true;
        return false;
    }

    /// <summary>
    /// Highlights a string with yellow color.
    /// </summary>
    /// <param name="text"></param>
    /// <returns></returns>
    public static HighlightString(text: string)
    {
        return text != null && text.Length > 0 ? COLOR_YELLOW + text + COLOR_RESET : "{COLOR_RED}ERROR{COLOR_RESET}";
    }

    /// <summary>
    /// Sets the unit's vertex color based on the passed parameter playerID...
    /// </summary>
    /// <param name="unit"></param>
    /// <param name="playerID"></param>
    public static SetUnitToVertexColor(unit: unit, playerID: number)
    {
        let color: Colors = ColorManager[playerID];
        unit.SetVertexColor(color.red, color.green, color.blue, 255);
        if (unit.UnitType == Constants.UNIT_CUSTOM_DOG) return;
        Globals.ALL_KITTIES[unit.Owner].SaveData.PlayerColorData.VortexColor = "{color.red},{color.green},{color.blue}";
    }

    public static ListColorCommands(player: player)
    {
        sb.Clear();
        for (let color: Colors in ColorManager)
            sb.Append("{color.colorcode}{color.colorname}|r, ");

        player.DisplayTimedTextTo(10.0, sb.ToString());
    }

    public static GetPlayerByColor: player(colorName: string)
    {
        for (let color: Colors in ColorManager)
        {
            if (ColorContainsCommand(color, colorName.ToLower()))
            {
                return Player(color.colorID - 1);
            }
        }
        return null;
    }

    public static PopulateColorsData(kitty: Kitty)
    {
        try
        {
            let colorData: string = kitty.SaveData.PlayerColorData.PlayedColors;
            if (!string.IsNullOrEmpty(colorData)) return; // already populated
            sb.Clear();

            for (let i: number = 0; i < ColorManager.Count; i++) // else populate it
            {
                string[] colorName = ColorManager[i].colorname.Split(',');
                sb.Append(colorName[0]).Append(":0");
                if (i < ColorManager.Count - 1)
                    sb.Append(",");
            }

            kitty.SaveData.PlayerColorData.PlayedColors = sb.ToString();
        }
        catch (e: Error)
        {
            Logger.Warning("Error in PopulateColorsData: {e.Message}");
        }
    }

    /// <summary>
    /// This function only calls at the end of the game for SaveData purposes. So it should be okay to run and update all player colors accordingly.
    /// </summary>
    /// <param name="kitty"></param>
    public static UpdateColors(kitty: Kitty)
    {
        try
        {
            let colorData: string = kitty.SaveData.PlayerColorData.PlayedColors;
            let currentColor: string = kitty.SaveData.PlayerColorData.LastPlayedColor;

            if (string.IsNullOrEmpty(colorData) || string.IsNullOrEmpty(currentColor)) return;

            sb.Clear();
            string[] pairs = colorData.Split(',');

            for (let i: number = 0; i < pairs.Length; i++)
            {
                string[] parts = pairs[i].Split(':');
                if (parts.Length == 2 && int.TryParse(parts[1], number: count: out))
                {
                    if (parts[0] == currentColor)
                    {
                        count++;
                    }
                    sb.Append("{parts[0]}:{count},");
                }
            }

            if (sb.Length > 0)
            {
                sb.Length--;
            }

            kitty.SaveData.PlayerColorData.PlayedColors = sb.ToString();
        }
        catch (e: Error)
        {
            Logger.Warning("Error in UpdateColors: {e.Message}");
        }
    }

    /// <summary>
    /// Returns the string of the most played color and also updates the PlayerColorData.MostPlayedColor to that color.
    /// </summary>
    /// <param name="kitty"></param>
    /// <returns></returns>
    public static GetMostPlayedColor(kitty: Kitty)
    {
        let colorData: string = kitty.SaveData.PlayerColorData.PlayedColors;
        if (string.IsNullOrEmpty(colorData)) return null;

        string[] pairs = colorData.Split(','); // splits like .. "red:5", "blue:6", etc.
        string[] names = colorData.Split(':'); // splits like .. "red", "5", "blue", "6", etc.
        let mostPlayedColor: string = names[0]; // default to first color
        let maxCount: number = 0;

        for (let i: number = 0; i < pairs.Length; i++)
        {
            let pair: string = pairs[i];
            string[] parts = pair.Split(':');
            if (parts.Length == 2 && int.TryParse(parts[1], number: count: out))
            {
                if (count > maxCount)
                {
                    mostPlayedColor = parts[0];
                    maxCount = count;
                }
            }
        }

        // Set the save data to the most played color
        kitty.SaveData.PlayerColorData.MostPlayedColor = mostPlayedColor;

        return mostPlayedColor;
    }

}
