using System.Text.Json.Serialization;

namespace Wc3MapTools.Models;

/// <summary>A unit/item/building instance placed on the map (war3mapUnits.doo).</summary>
public class Unit
{
    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;

    [JsonPropertyName("variation")]
    public int? Variation { get; set; }

    [JsonPropertyName("skinId")]
    public string? SkinId { get; set; }

    /// <summary>[x, y, z]</summary>
    [JsonPropertyName("position")]
    public float[] Position { get; set; } = { 0, 0, 0 };

    [JsonPropertyName("rotation")]
    public float Rotation { get; set; }

    [JsonPropertyName("hero")]
    public HeroAttributes? Hero { get; set; }

    [JsonPropertyName("inventory")]
    public List<InventoryItem>? Inventory { get; set; }

    [JsonPropertyName("abilities")]
    public List<AbilityModification>? Abilities { get; set; }

    [JsonPropertyName("player")]
    public int Player { get; set; }

    /// <summary>% of max, omitted when unmodified.</summary>
    [JsonPropertyName("hitpoints")]
    public int? Hitpoints { get; set; }

    /// <summary>Absolute value of max, omitted when unmodified.</summary>
    [JsonPropertyName("mana")]
    public int? Mana { get; set; }

    [JsonPropertyName("gold")]
    public int? Gold { get; set; }

    [JsonPropertyName("targetAcquisition")]
    public float? TargetAcquisition { get; set; }

    /// <summary>Custom color; omitted defaults to owning player's color.</summary>
    [JsonPropertyName("color")]
    public int? Color { get; set; }

    [JsonPropertyName("id")]
    public int Id { get; set; } = -1;

    [JsonPropertyName("randomItemSetId")]
    public int? RandomItemSetId { get; set; }

    [JsonPropertyName("customItemSets")]
    public List<List<ItemDropChance>>? CustomItemSets { get; set; }

    [JsonPropertyName("waygateRegionId")]
    public int? WaygateRegionId { get; set; }

    /// <summary>Only present for "uDNR"/"iDNR" random unit/item placeholders.</summary>
    [JsonPropertyName("randomEntity")]
    public RandomEntity? RandomEntity { get; set; }
}

public class HeroAttributes
{
    [JsonPropertyName("level")]
    public int Level { get; set; } = 1;

    [JsonPropertyName("str")]
    public int Str { get; set; }

    [JsonPropertyName("agi")]
    public int Agi { get; set; }

    [JsonPropertyName("int")]
    public int Int { get; set; }
}

public class InventoryItem
{
    /// <summary>1-based inventory slot.</summary>
    [JsonPropertyName("slot")]
    public int Slot { get; set; }

    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;
}

public class AbilityModification
{
    [JsonPropertyName("ability")]
    public string Ability { get; set; } = string.Empty;

    [JsonPropertyName("active")]
    public bool Active { get; set; }

    [JsonPropertyName("level")]
    public int Level { get; set; }
}

public class ItemDropChance
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("chance")]
    public int Chance { get; set; }
}

/// <summary>
/// Only one of the three groups below is populated at a time, matching
/// which random-flag variant was read from war3mapUnits.doo:
/// Level/Class (flag 0), Group/Position (flag 1), or UnitSet (flag 2).
/// </summary>
public class RandomEntity
{
    [JsonPropertyName("level")]
    public int? Level { get; set; }

    [JsonPropertyName("class")]
    public int? Class { get; set; }

    [JsonPropertyName("group")]
    public int? Group { get; set; }

    [JsonPropertyName("position")]
    public int? Position { get; set; }

    [JsonPropertyName("unitSet")]
    public List<ItemDropChance>? UnitSet { get; set; }
}
