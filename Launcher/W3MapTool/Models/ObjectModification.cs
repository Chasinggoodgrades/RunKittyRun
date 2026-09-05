using System.Text.Json.Serialization;

namespace Wc3MapTools.Models;

/// <summary>Which object-data file a modification table applies to.</summary>
public enum ObjectDataType
{
    Units,
    Items,
    Destructables,
    Doodads,
    Abilities,
    Buffs,
    Upgrades,
}

public enum ModificationValueType
{
    Int = 0,
    Real = 1,
    Unreal = 2,
    String = 3,
}

/// <summary>A single field override (e.g. "unam" = name) on an object.</summary>
public class Modification
{
    /// <summary>4-character field id, e.g. "unam".</summary>
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("type")]
    public ModificationValueType Type { get; set; }

    [JsonPropertyName("valueInt")]
    public int? ValueInt { get; set; }

    [JsonPropertyName("valueFloat")]
    public float? ValueFloat { get; set; }

    [JsonPropertyName("valueString")]
    public string? ValueString { get; set; }

    /// <summary>Only used for Doodads, Abilities, Upgrades.</summary>
    [JsonPropertyName("level")]
    public int? Level { get; set; }

    /// <summary>Only used for Doodads, Abilities, Upgrades.</summary>
    [JsonPropertyName("column")]
    public int? Column { get; set; }
}

/// <summary>
/// One object entry (original or custom) and every field modification made to it.
/// For custom objects, <see cref="ObjectId"/> is "customId:originalId" (e.g. "h000:hfoo").
/// For original objects, <see cref="ObjectId"/> is just the base rawcode (e.g. "hfoo").
/// </summary>
public class ObjectRecord
{
    [JsonPropertyName("objectId")]
    public string ObjectId { get; set; } = string.Empty;

    [JsonPropertyName("modifications")]
    public List<Modification> Modifications { get; set; } = new();
}

public class ObjectModificationTable
{
    [JsonPropertyName("original")]
    public List<ObjectRecord> Original { get; set; } = new();

    [JsonPropertyName("custom")]
    public List<ObjectRecord> Custom { get; set; } = new();
}
