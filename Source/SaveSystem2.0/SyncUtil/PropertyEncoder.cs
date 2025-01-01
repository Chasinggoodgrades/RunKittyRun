using System;
using System.Text;
using System.Reflection;

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

    private static void AppendProperties(object obj, StringBuilder jsonString)
    {
        if (obj == null)
            return;

        Type type = obj.GetType();
        PropertyInfo[] properties = type.GetProperties();

        foreach (var property in properties)
        {
            var name = property.Name;
            var value = property.GetValue(obj, null);

            jsonString.Append($"\"{name}\":");

            if (value != null && property.PropertyType.IsClass && property.PropertyType != typeof(string))
            {
                jsonString.Append("{");
                AppendProperties(value, jsonString);
                jsonString.Append("},");
            }
            else if (value is string)
            {
                jsonString.Append($"\"{value}\",");
            }
            else
            {
                jsonString.Append($"{value},");
            }
        }

        if (jsonString.Length > 0 && jsonString[jsonString.Length - 1] == ',')
            jsonString.Length--;
    }


    public static string DecodeFromJsonBase64(StringBuilder base64EncodedData)
    {
        // Decode the Base64 string to a JSON-like string
        var jsonString = WCSharp.Shared.Base64.FromBase64(base64EncodedData.ToString());
        return jsonString;
    }

}
