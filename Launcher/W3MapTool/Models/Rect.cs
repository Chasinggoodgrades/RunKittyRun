using System.Text.Json.Serialization;

namespace Wc3MapTools.Models;

public class Rect
{
    [JsonPropertyName("left")]
    public float Left { get; set; }

    [JsonPropertyName("bottom")]
    public float Bottom { get; set; }

    [JsonPropertyName("right")]
    public float Right { get; set; }

    [JsonPropertyName("top")]
    public float Top { get; set; }
}
