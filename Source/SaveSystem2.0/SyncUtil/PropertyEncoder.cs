using System;
using System.Reflection;
using System.Text;

public static class PropertyEncoder
{
    public static string EncodeToJsonBase64(object obj)
    {
        StringBuilder jsonString = new StringBuilder("{");
        AppendProperties(obj, jsonString);
        jsonString.Append("}");

        var base64String = WCSharp.Shared.Base64.ToBase64(jsonString.ToString());
        return base64String;
    }

    private static string GetJsonData(object obj)
    {
        StringBuilder jsonString = new StringBuilder("{");
        AppendProperties(obj, jsonString);
        jsonString.Append("}");

        return jsonString.ToString();
    }

    public static string EncodeAllDataToJsonBase64()
    {
        StringBuilder jsonString = new StringBuilder();
        jsonString.Append("{");
        foreach (var player in Globals.ALL_PLAYERS)
        {
            var playerData = SaveManager.SaveData[player];
            jsonString.Append($"\"{player.Name}\":{GetJsonData(playerData)},");
        }
        if (jsonString.Length > 0 && jsonString[jsonString.Length - 1] == ',')
            jsonString.Length--;
        jsonString.Append("}");

        var base64String = WCSharp.Shared.Base64.ToBase64(jsonString.ToString());
        return base64String;
    }

    private static void AppendProperties(object obj, StringBuilder jsonString)
    {
        if (obj == null)
            return;

        Type type = obj.GetType();
        PropertyInfo[] properties = type.GetProperties();
        bool firstProperty = true;

        foreach (var property in properties)
        {
            var name = property.Name;
            var value = property.GetValue(obj, null);

            if (!firstProperty)
            {
                jsonString.Append(",");
            }
            firstProperty = false;

            jsonString.Append($"\"{name}\":");

            if (value != null && property.PropertyType.IsClass && property.PropertyType != typeof(string))
            {
                jsonString.Append("{");
                AppendProperties(value, jsonString);
                jsonString.Append("}");
            }
            else
            {
                _ = value is string ? jsonString.Append($"\"{value}\"") : jsonString.Append($"{value}");
            }
        }
    }

    public static string DecodeFromJsonBase64(StringBuilder base64EncodedData)
    {
        // Decode the Base64 string to a JSON-like string
        var jsonString = WCSharp.Shared.Base64.FromBase64(base64EncodedData.ToString());
        return jsonString;
    }
}
