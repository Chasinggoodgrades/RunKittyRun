class ColorData {
    public colorname: string
    public colorID: number
    public colorcode: string
    public playercolor: playercolor
    public red: number
    public green: number
    public blue: number

    constructor(
        colorname: string,
        colorID: number,
        colorcode: string,
        playercolor: playercolor,
        red: number,
        green: number,
        blue: number
    ) {
        this.colorname = colorname
        this.colorID = colorID
        this.colorcode = colorcode
        this.playercolor = playercolor
        this.red = red
        this.green = green
        this.blue = blue
    }
}

class Colors {
    public static COLOR_GOLD: string = '|c00FFCC00'
    public static COLOR_YELLOW_ORANGE: string = '|c00FF9900'
    public static COLOR_RED: string = '|c00FF0000'
    public static COLOR_GREEN: string = '|c0000FF00'
    public static COLOR_BLUE: string = '|c000000FF'
    public static COLOR_PURPLE: string = '|c00CC00FF'
    public static COLOR_CYAN: string = '|c000FFFFF'
    public static COLOR_ORANGE: string = '|c00FF9900'
    public static COLOR_VIOLET: string = '|c00EE82EE'
    public static COLOR_PINK: string = '|c00FFC0CB'
    public static COLOR_LAVENDER: string = '|cffdbb8eb'
    public static COLOR_BLACK: string = '|c00000000'
    public static COLOR_WHITE: string = '|c00FFFFFF'
    public static COLOR_GREY: string = '|c00808080'
    public static COLOR_BROWN: string = '|c008B4513'
    public static COLOR_LIME: string = '|c0000FF00'
    public static COLOR_TURQUOISE: string = '|cff00ebff'
    public static COLOR_YELLOW: string = '|c00FFFF00'
    public static COLOR_DARK_RED: string = '|c008B0000'
    public static COLOR_LIGHTBLUE: string = '|c006969FF'
    public static COLOR_RESET: string = '|r'
    public static ColorManager: ColorData[] = []
    public static sb: string = ''

    public static AddColor(
        colorname: string,
        colorID: number,
        colorcode: string,
        playercolor: playercolor,
        redValue: number,
        greenValue: number,
        blueValue: number
    ) {
        Colors.ColorManager.push(
            new ColorData(colorname, colorID, colorcode, playercolor, redValue, greenValue, blueValue)
        )
    }

    public static Initialize() {
        Colors.AddColor('red', 1, '|cffff0303', PLAYER_COLOR_RED, 255, 3, 3)
        Colors.AddColor('blue', 2, '|cff0042f', PLAYER_COLOR_BLUE, 0, 66, 255)
        Colors.AddColor('teal', 3, '|cff1be7ba', PLAYER_COLOR_CYAN, 27, 231, 186)
        Colors.AddColor('purple', 4, '|cff550081', PLAYER_COLOR_PURPLE, 85, 0, 129)
        Colors.AddColor('yellow', 5, '|cfffefc00', PLAYER_COLOR_YELLOW, 254, 252, 0)
        Colors.AddColor('orange', 6, '|cfffe890d', PLAYER_COLOR_ORANGE, 254, 137, 13)
        Colors.AddColor('green', 7, '|cff21bf00', PLAYER_COLOR_GREEN, 33, 191, 0)
        Colors.AddColor('pink', 8, '|cffe45caf', PLAYER_COLOR_PINK, 228, 92, 175)
        Colors.AddColor('gray', 9, '|cff939596', PLAYER_COLOR_LIGHT_GRAY, 147, 149, 150)
        Colors.AddColor('lightblue,lb,light-blue', 10, '|cff7ebff1', PLAYER_COLOR_LIGHT_BLUE, 126, 191, 241)
        Colors.AddColor('darkgreen,dg,dark-green', 11, '|cff106247', PLAYER_COLOR_EMERALD, 16, 98, 71)
        Colors.AddColor('brown', 12, '|cff42b05', PLAYER_COLOR_BROWN, 79, 43, 5)
        Colors.AddColor('maroon', 13, '|cff9c0000', PLAYER_COLOR_MAROON, 156, 0, 0)
        Colors.AddColor('navy', 14, '|cff0000c3', PLAYER_COLOR_NAVY, 0, 0, 195)
        Colors.AddColor('turquoise', 15, '|cff00ebff', PLAYER_COLOR_TURQUOISE, 0, 235, 255)
        Colors.AddColor('violet', 16, '|cffbd00f', PLAYER_COLOR_VIOLET, 189, 0, 255)
        Colors.AddColor('wheat', 17, '|cffecce87', PLAYER_COLOR_WHEAT, 236, 206, 135)
        Colors.AddColor('peach', 18, '|cfff7a58b', PLAYER_COLOR_PEACH, 247, 165, 139)
        Colors.AddColor('mint', 19, '|cffbfff81', PLAYER_COLOR_MINT, 191, 255, 129)
        Colors.AddColor('lavender', 20, '|cffdbb8eb', PLAYER_COLOR_LAVENDER, 219, 184, 235)
        Colors.AddColor('coal', 21, '|cff45055', PLAYER_COLOR_COAL, 79, 80, 85)
        Colors.AddColor('snow,white', 22, '|cffecf0f', PLAYER_COLOR_SNOW, 236, 240, 255)
        Colors.AddColor('emerald', 23, '|cff00781e', PLAYER_COLOR_EMERALD, 0, 120, 30)
        Colors.AddColor('peanut', 24, '|cffa5634', PLAYER_COLOR_PEANUT, 165, 111, 52)
    }

    /// <summary>
    /// Colorizes a player's name based on their player ID.
    /// </summary>
    public static PlayerNameColored(p: player) {
        return Colors.GetStringColorOfPlayer(GetPlayerId(p) + 1) + Player.name + Colors.COLOR_RESET
    }

    /// <summary>
    /// Colorizes a string based on integer value of player color ID.
    /// Use (1-24) for player colors.
    /// </summary>
    public static ColorString(text: string, playerColorID: number) {
        return Colors.GetStringColorOfPlayer(playerColorID) + text + Colors.COLOR_RESET
    }

    /// <summary>
    /// Returns the color code string for that particular color.
    /// Use (1-24) for player colors. So.. (player.Id + 1)
    /// </summary>
    public static GetStringColorOfPlayer(playerColorID: number) {
        for (let i: number = 0; i < Colors.ColorManager.length; i++) {
            let color: ColorData = Colors.ColorManager[i]
            if (color.colorID == playerColorID) {
                return color.colorcode
            }
        }
        return '|cffffffff'
    }

    public static SetPlayerColor(p: player, color: string) {
        let kitty: Kitty = Globals.ALL_KITTIES[p]
        for (let c in ColorManager) {
            if (ColorContainsCommand(c, color)) {
                kitty.Unit.SetColor(playercolor.Convert(c.colorID - 1))
                kitty.SaveData.PlayerColorData.LastPlayedColor = c.colorname.Split(',')[0]
            }
        }
    }

    public static SetColorJoinedAs(p: player) {
        let kitty: Kitty = Globals.ALL_KITTIES[p]
        let color = Colors.ColorManager[GetPlayerId(p)]
        kitty.SaveData.PlayerColorData.LastPlayedColor = color.colorname.Split(',')[0]
    }

    public static SetPlayerVertexColor(p: player, RGB: string[]) {
        let kitty: Kitty = Globals.ALL_KITTIES[p]
        let r: number = 0,
            g = 0,
            b = 0

        if (RGB.length > 0) r = int.Parse(RGB[0])
        if (RGB.length > 1) g = int.Parse(RGB[1])
        if (RGB.length > 2) b = int.Parse(RGB[2])

        SetUnitVertexColor(kitty.Unit, r, g, b, 255)
        Globals.ALL_KITTIES[p].SaveData.PlayerColorData.VortexColor = '{r},{g},{b}'
    }

    /// <summary>
    /// Sets a player's vertex color to a random RGB value.
    /// </summary>
    /// <param name="p">The player object</param>
    public static SetPlayerRandomVertexColor(p: player) {
        let kitty: Kitty = Globals.ALL_KITTIES[p]
        let r: number = GetRandomInt(0, 255)
        let g: number = GetRandomInt(0, 255)
        let b: number = GetRandomInt(0, 255)
        SetUnitVertexColor(kitty.Unit, r, g, b, 255)
        p.DisplayTimedTextTo(
            5.0,
            '{COLOR_RED}Red: {COLOR_RESET}{r}, {COLOR_GREEN}Green: {COLOR_RESET}{g}, {COLOR_BLUE}Blue: {COLOR_RESET}{b}'
        )
    }

    private static ColorContainsCommand(color: ColorData, inputColor: string) {
        let colorCommands = color.colorname.split(',')
        for (let command of colorCommands) if (command === inputColor) return true
        return false
    }

    /// <summary>
    /// Highlights a string with yellow color.
    /// </summary>
    /// <param name="text"></param>
    /// <returns></returns>
    public static HighlightString(text: string) {
        return text != null && text.Length > 0 ? COLOR_YELLOW + text + COLOR_RESET : '{COLOR_RED}ERROR{COLOR_RESET}'
    }

    /// <summary>
    /// Sets the unit's vertex color based on the passed parameter playerID...
    /// </summary>
    /// <param name="unit"></param>
    /// <param name="playerID"></param>
    public static SetUnitToVertexColor(unit: unit, playerID: number) {
        let color: ColorData = Colors.ColorManager[playerID]
        SetUnitVertexColor(unit, color.red, color.green, color.blue, 255)
        if (GetUnitTypeId(unit) == Constants.UNIT_CUSTOM_DOG) return
        Globals.ALL_KITTIES[unit.Owner].SaveData.PlayerColorData.VortexColor =
            `${color.red},${color.green},${color.blue}`
    }

    public static ListColorCommands(player: player) {
        Colors.sb = ''
        for (let color of Colors.ColorManager) Colors.sb += `${color.colorcode}${color.colorname}|r, `

        player.DisplayTimedTextTo(10.0, Colors.sb)
    }

    public static GetPlayerByColor(colorName: string): player {
        for (let color of Colors.ColorManager) {
            if (Colors.ColorContainsCommand(color, colorName.toLowerCase())) {
                return Player(color.colorID - 1)
            }
        }
        return null
    }

    public static PopulateColorsData(kitty: Kitty) {
        try {
            let colorData: string = kitty.SaveData.PlayerColorData.PlayedColors
            if (!string.IsNullOrEmpty(colorData)) return // already populated
            Colors.sb = ''

            for (
                let i: number = 0;
                i < Colors.ColorManager.length;
                i++ // else populate it
            ) {
                let colorName = Colors.ColorManager[i].colorname.split(',')
                Colors.sb += colorName[0] + ':0'
                if (i < Colors.ColorManager.length - 1) Colors.sb += ','
            }

            kitty.SaveData.PlayerColorData.PlayedColors = Colors.sb
        } catch (e: Error) {
            Logger.Warning('Error in PopulateColorsData: {e.Message}')
        }
    }

    /// <summary>
    /// This function only calls at the end of the game for SaveData purposes. So it should be okay to run and update all player colors accordingly.
    /// </summary>
    /// <param name="kitty"></param>
    public static UpdateColors(kitty: Kitty) {
        try {
            let colorData: string = kitty.SaveData.PlayerColorData.PlayedColors
            let currentColor: string = kitty.SaveData.PlayerColorData.LastPlayedColor

            if (string.IsNullOrEmpty(colorData) || string.IsNullOrEmpty(currentColor)) return

            Colors.sb = ''
            let pairs = colorData.split(',')

            for (let i = 0; i < pairs.length; i++) {
                const parts = pairs[i].split(':')

                if (parts.length === 2) {
                    let count = parseInt(parts[1], 10)

                    if (!isNaN(count)) {
                        if (parts[0] === currentColor) {
                            count++
                        }

                        Colors.sb += `${parts[0]}:${count},`
                    }
                }
            }

            if (Colors.sb.length > 0) {
                Colors.sb = Colors.sb.slice(0, -1)
            }

            kitty.SaveData.PlayerColorData.PlayedColors = Colors.sb
        } catch (e: Error) {
            Logger.Warning('Error in UpdateColors: {e.Message}')
        }
    }

    /// <summary>
    /// Returns the string of the most played color and also updates the PlayerColorData.MostPlayedColor to that color.
    /// </summary>
    /// <param name="kitty"></param>
    /// <returns></returns>
    public static GetMostPlayedColor(kitty: Kitty) {
        let colorData: string = kitty.SaveData.PlayerColorData.PlayedColors
        if (string.IsNullOrEmpty(colorData)) return null

        const pairs: string[] = colorData.split(',') // splits like .. "red:5", "blue:6", etc.
        const names: string[] = colorData.split(':') // splits like .. "red", "5", "blue", "6", etc.

        let mostPlayedColor: string | null = null
        let maxCount = 0

        for (let i = 0; i < pairs.length; i++) {
            const pair = pairs[i]
            const parts = pair.split(':')

            if (parts.length === 2) {
                const count = parseInt(parts[1], 10)

                if (!isNaN(count) && count > maxCount) {
                    mostPlayedColor = parts[0]
                    maxCount = count
                }
            }
        }

        // Set the save data to the most played color
        kitty.SaveData.PlayerColorData.MostPlayedColor = mostPlayedColor

        return mostPlayedColor
    }
}
