class PropertyEncoder {
    public static EncodeToJsonBase64(obj: object) {
        try {
            let jsonString: StringBuilder = new StringBuilder('{')
            this.AppendProperties(obj, jsonString)
            jsonString.Append('}')

            let base64String = WCSharp.Shared.Base64.ToBase64(jsonString.ToString())
            return base64String
        } catch (ex: Error) {
            // Handle any exceptions that may occur during encoding
            Logger.Critical('{Colors.COLOR_DARK_RED}Error in PropertyEncoder.EncodeToJsonBase64: {ex.Message}')
            throw ex
        }
    }

    private static GetJsonData(obj: object) {
        let jsonString: StringBuilder = new StringBuilder('{')
        AppendProperties(obj, jsonString)
        jsonString.Append('}')

        return jsonString.ToString()
    }

    public static EncodeAllDataToJsonBase64(): string {
        try {
            let jsonString: string = "";
            jsonString += '{'
            for (let player in Globals.ALL_PLAYERS) {
                if (!(playerData = SaveManager.SaveData.TryGetValue(player)) /* TODO; Prepend: let */) continue
                jsonString += `"{player.Name}":{GetJsonData(playerData)},`
            }
            if (jsonString.length > 0 && jsonString[jsonString.length - 1] == ',') jsonString.length--
            jsonString += '}'

            let base64String = WCSharp.Shared.Base64.ToBase64(jsonString)
            return base64String
        } catch (ex: Error) {
            Logger.Critical('{Colors.COLOR_DARK_RED}Error in PropertyEncoder.EncodeAllDataToJsonBase64: {ex.Message}')
            throw ex
        }
    }

    private static AppendProperties(obj: object, jsonString: StringBuilder) {
        if (obj == null) return

        let properties = Object.keys(obj)
        let firstProperty: boolean = true

        for (let i = 0; i < properties.length; i++) {
            let name = properties[i]
            let value = (obj as any)[name]

            if (!firstProperty) {
                jsonString.Append(',')
            }
            firstProperty = false

            jsonString.Append(`"${name}":`)

            if (value !== null && typeof value === 'object' && !Array.isArray(value) && typeof value !== 'string') {
                jsonString.Append('{')
                this.AppendProperties(value, jsonString)
                jsonString.Append('}')
            } else {
                typeof value === 'string' ? jsonString.Append(`"${value}"`) : jsonString.Append(`${value}`)
            }
        }
    }

    public static DecodeFromJsonBase64(base64EncodedData: StringBuilder) {
        // Decode the Base64 string to a JSON-like string
        let jsonString = WCSharp.Shared.Base64.FromBase64(base64EncodedData.ToString())
        return jsonString
    }
}
