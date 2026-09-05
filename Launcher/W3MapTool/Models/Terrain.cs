using System.Text.Json.Serialization;

namespace Wc3MapTools.Models;

public class Terrain
{
    [JsonPropertyName("tileset")]
    public string Tileset { get; set; } = "L";

    [JsonPropertyName("customTileset")]
    public bool CustomTileset { get; set; }

    [JsonPropertyName("tilePalette")]
    public List<string> TilePalette { get; set; } = new();

    [JsonPropertyName("cliffTilePalette")]
    public List<string> CliffTilePalette { get; set; } = new();

    [JsonPropertyName("map")]
    public TerrainMap Map { get; set; } = new();

    [JsonPropertyName("groundHeight")]
    public List<int> GroundHeight { get; set; } = new();

    [JsonPropertyName("waterHeight")]
    public List<int> WaterHeight { get; set; } = new();

    [JsonPropertyName("boundaryFlag")]
    public List<bool> BoundaryFlag { get; set; } = new();

    [JsonPropertyName("flags")]
    public List<int> Flags { get; set; } = new();

    [JsonPropertyName("groundTexture")]
    public List<int> GroundTexture { get; set; } = new();

    [JsonPropertyName("groundVariation")]
    public List<int> GroundVariation { get; set; } = new();

    [JsonPropertyName("cliffVariation")]
    public List<int> CliffVariation { get; set; } = new();

    [JsonPropertyName("cliffTexture")]
    public List<int> CliffTexture { get; set; } = new();

    [JsonPropertyName("layerHeight")]
    public List<int> LayerHeight { get; set; } = new();
}

public class TerrainMap
{
    [JsonPropertyName("width")]
    public int Width { get; set; } = 1;

    [JsonPropertyName("height")]
    public int Height { get; set; } = 1;

    [JsonPropertyName("offset")]
    public TerrainOffset Offset { get; set; } = new();
}

public class TerrainOffset
{
    [JsonPropertyName("x")]
    public float X { get; set; }

    [JsonPropertyName("y")]
    public float Y { get; set; }
}
