using System.Text.Json.Serialization;

namespace Wc3MapTools;

public class ProjectConfig
{
    [JsonPropertyName("mapFolder")]
    public string MapFolder { get; set; } = string.Empty;
}
