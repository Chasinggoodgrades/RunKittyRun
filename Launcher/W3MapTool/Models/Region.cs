using System.Text.Json.Serialization;

namespace Wc3MapTools.Models;

public class Region
{
    [JsonPropertyName("position")]
    public Rect Position { get; set; } = new Rect();

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("id")]
    public int Id { get; set; }

    /// <summary>4-character rawcode (e.g. "RLsh"), or null/empty if no weather effect is set.</summary>
    [JsonPropertyName("weatherEffect")]
    public string? WeatherEffect { get; set; }

    [JsonPropertyName("ambientSound")]
    public string? AmbientSound { get; set; }

    /// <summary>[R, G, B], each 0-255. Warcraft III does not store per-region alpha.</summary>
    [JsonPropertyName("color")]
    public int[] Color { get; set; } = { 0, 0, 0 };
}
