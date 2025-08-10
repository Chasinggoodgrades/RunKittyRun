

class PropertyEncoder
{
    public static EncodeToJsonBase64(obj: object)
    {
        try
        {
            let jsonString: StringBuilder = new StringBuilder("{");
            AppendProperties(obj, jsonString);
            jsonString.Append("}");

            let base64String = WCSharp.Shared.Base64.ToBase64(jsonString.ToString());
            return base64String;
        }
        catch (ex: Error)
        {
            // Handle any exceptions that may occur during encoding
            Logger.Critical("{Colors.COLOR_DARK_RED}Error in PropertyEncoder.EncodeToJsonBase64: {ex.Message}");
            throw new Error() // TODO; Rethrow actual error
        }
    }

    private static GetJsonData(obj: object)
    {
        let jsonString: StringBuilder = new StringBuilder("{");
        AppendProperties(obj, jsonString);
        jsonString.Append("}");

        return jsonString.ToString();
    }

    public static EncodeAllDataToJsonBase64(): string
    {
        try
        {
            let jsonString: StringBuilder = new StringBuilder();
            jsonString.Append("{");
            for (let player in Globals.ALL_PLAYERS)
            {
                if (!(playerData = SaveManager.SaveData.TryGetValue(player)) /* TODO; Prepend: let */) continue;
                jsonString.Append("\"{player.Name}\":{GetJsonData(playerData)},");
            }
            if (jsonString.Length > 0 && jsonString[jsonString.Length - 1] == ',')
                jsonString.Length--;
            jsonString.Append("}");

            let base64String = WCSharp.Shared.Base64.ToBase64(jsonString.ToString());
            return base64String;
        }
        catch (ex: Error)
        {
            Logger.Critical("{Colors.COLOR_DARK_RED}Error in PropertyEncoder.EncodeAllDataToJsonBase64: {ex.Message}");
            throw new Error() // TODO; Rethrow actual error
        }
    }

    private static AppendProperties(obj: object, jsonString: StringBuilder)
    {
        if (obj == null)
            return;

        let type: Type = obj.GetType();
        PropertyInfo[] properties = type.GetProperties();
        let firstProperty: boolean = true;

        for (let property in properties)
        {
            let name = property.Name;
            let value = property.GetValue(obj, null);

            if (!firstProperty)
            {
                jsonString.Append(",");
            }
            firstProperty = false;

            jsonString.Append("\"{name}\":");

            if (value != null && property.PropertyType.IsClass && property.PropertyType != typeof(string))
            {
                jsonString.Append("{");
                AppendProperties(value, jsonString);
                jsonString.Append("}");
            }
            else
            {
                _ = value is string ? jsonString.Append("\"{value}\"") : jsonString.Append("{value}");
            }
        }
    }

    public static DecodeFromJsonBase64(base64EncodedData: StringBuilder)
    {
        // Decode the Base64 string to a JSON-like string
        let jsonString = WCSharp.Shared.Base64.FromBase64(base64EncodedData.ToString());
        return jsonString;
    }
}
