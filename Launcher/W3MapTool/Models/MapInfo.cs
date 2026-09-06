using System.Text.Json.Serialization;

namespace Wc3MapTools.Models;

public enum GameDataSet
{
    Default = 0,
    Custom101 = 1,
    MeleeLatestPath = 2,
}

public enum GameDataVersion
{
    ROC = 0,
    TFT = 1,
}

public enum ScriptLanguage
{
    JASS = 0,
    Lua = 1,
}

public enum SupportedModes
{
    SD = 1,
    HD = 2,
    Both = 3,
}

/// <summary>war3map.w3i — general map info, players, forces, and random tables.</summary>
public class MapInfo
{
    [JsonPropertyName("saves")]
    public int Saves { get; set; }

    [JsonPropertyName("gameVersion")]
    public GameVersion GameVersion { get; set; } = new();

    [JsonPropertyName("editorVersion")]
    public int EditorVersion { get; set; }

    [JsonPropertyName("gameDataSet")]
    public GameDataSet GameDataSet { get; set; } = GameDataSet.Default;

    [JsonPropertyName("gameDataVersion")]
    public GameDataVersion GameDataVersion { get; set; } = GameDataVersion.TFT;

    [JsonPropertyName("scriptLanguage")]
    public ScriptLanguage ScriptLanguage { get; set; } = ScriptLanguage.JASS;

    [JsonPropertyName("supportedModes")]
    public SupportedModes SupportedModes { get; set; } = SupportedModes.Both;

    [JsonPropertyName("map")]
    public MapDetails Map { get; set; } = new();

    [JsonPropertyName("camera")]
    public MapCamera Camera { get; set; } = new();

    [JsonPropertyName("prologue")]
    public Prologue Prologue { get; set; } = new();

    [JsonPropertyName("loadingScreen")]
    public LoadingScreen LoadingScreen { get; set; } = new();

    [JsonPropertyName("fog")]
    public MapFog Fog { get; set; } = new();

    [JsonPropertyName("globalWeather")]
    public string GlobalWeather { get; set; } = string.Empty;

    [JsonPropertyName("customSoundEnvironment")]
    public string CustomSoundEnvironment { get; set; } = string.Empty;

    [JsonPropertyName("customLightEnv")]
    public string CustomLightEnv { get; set; } = "L";

    /// <summary>[R, G, B]</summary>
    [JsonPropertyName("water")]
    public int[] Water { get; set; } = { 0, 0, 0 };

    [JsonPropertyName("players")]
    public List<MapPlayer> Players { get; set; } = new();

    [JsonPropertyName("forces")]
    public List<MapForce> Forces { get; set; } = new();

    [JsonPropertyName("forceDefaultCameraZoom")]
    public int ForceDefaultCameraZoom { get; set; }

    [JsonPropertyName("forceMaxCameraZoom")]
    public int ForceMaxCameraZoom { get; set; }

    [JsonPropertyName("forceMinCameraZoom")]
    public int ForceMinCameraZoom { get; set; }

    [JsonPropertyName("upgrades")]
    public List<MapUpgrade> Upgrades { get; set; } = new();

    [JsonPropertyName("techtree")]
    public List<MapTechtree> Techtree { get; set; } = new();

    [JsonPropertyName("randomGroupTable")]
    public List<RandomGroupTable> RandomGroupTable { get; set; } = new();

    [JsonPropertyName("randomItemTable")]
    public List<RandomItemTable> RandomItemTable { get; set; } = new();
}

public class GameVersion
{
    [JsonPropertyName("major")] public int Major { get; set; }
    [JsonPropertyName("minor")] public int Minor { get; set; }
    [JsonPropertyName("patch")] public int Patch { get; set; }
    [JsonPropertyName("build")] public int Build { get; set; }
}

public class MapCamera
{
    /// <summary>8 floats.</summary>
    [JsonPropertyName("bounds")]
    public List<float> Bounds { get; set; } = new();

    /// <summary>4 ints.</summary>
    [JsonPropertyName("complements")]
    public List<int> Complements { get; set; } = new();
}

public class PlayableMapArea
{
    [JsonPropertyName("width")]
    public int Width { get; set; } = 64;

    [JsonPropertyName("height")]
    public int Height { get; set; } = 64;
}

public class MapFlags
{
    [JsonPropertyName("hideMinimapInPreview")] public bool HideMinimapInPreview { get; set; }
    [JsonPropertyName("modifyAllyPriorities")] public bool ModifyAllyPriorities { get; set; } = true;
    [JsonPropertyName("isMeleeMap")] public bool IsMeleeMap { get; set; }
    [JsonPropertyName("maskedPartiallyVisible")] public bool MaskedPartiallyVisible { get; set; }
    [JsonPropertyName("fixedPlayerSetting")] public bool FixedPlayerSetting { get; set; }
    [JsonPropertyName("useCustomForces")] public bool UseCustomForces { get; set; }
    [JsonPropertyName("useCustomTechtree")] public bool UseCustomTechtree { get; set; }
    [JsonPropertyName("useCustomAbilities")] public bool UseCustomAbilities { get; set; }
    [JsonPropertyName("useCustomUpgrades")] public bool UseCustomUpgrades { get; set; }
    [JsonPropertyName("waterWavesOnCliffShores")] public bool WaterWavesOnCliffShores { get; set; }
    [JsonPropertyName("waterWavesOnRollingShores")] public bool WaterWavesOnRollingShores { get; set; }
    [JsonPropertyName("useTerrainFog")] public bool UseTerrainFog { get; set; }
    [JsonPropertyName("useItemClassificationSystem")] public bool UseItemClassificationSystem { get; set; }
    [JsonPropertyName("enableWaterTinting")] public bool EnableWaterTinting { get; set; }
    [JsonPropertyName("useAccurateProbabilityForCalculations")] public bool UseAccurateProbabilityForCalculations { get; set; }
    [JsonPropertyName("useCustomAbilitySkins")] public bool UseCustomAbilitySkins { get; set; }
    [JsonPropertyName("disableDenyIcon")] public bool DisableDenyIcon { get; set; }
    [JsonPropertyName("forceDefaultCameraZoom")] public bool ForceDefaultCameraZoom { get; set; }
    [JsonPropertyName("forceMaxCameraZoom")] public bool ForceMaxCameraZoom { get; set; }
    [JsonPropertyName("forceMinCameraZoom")] public bool ForceMinCameraZoom { get; set; }
}

public class MapDetails
{
    [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
    [JsonPropertyName("author")] public string Author { get; set; } = string.Empty;
    [JsonPropertyName("description")] public string Description { get; set; } = string.Empty;
    [JsonPropertyName("recommendedPlayers")] public string RecommendedPlayers { get; set; } = string.Empty;
    [JsonPropertyName("playableArea")] public PlayableMapArea PlayableArea { get; set; } = new();
    [JsonPropertyName("flags")] public MapFlags Flags { get; set; } = new();
    [JsonPropertyName("mainTileType")] public string MainTileType { get; set; } = string.Empty;
}

public class LoadingScreen
{
    [JsonPropertyName("background")] public int Background { get; set; }
    [JsonPropertyName("path")] public string Path { get; set; } = string.Empty;
    [JsonPropertyName("text")] public string Text { get; set; } = string.Empty;
    [JsonPropertyName("title")] public string Title { get; set; } = string.Empty;
    [JsonPropertyName("subtitle")] public string Subtitle { get; set; } = string.Empty;
}

public class Prologue
{
    [JsonPropertyName("path")] public string Path { get; set; } = string.Empty;
    [JsonPropertyName("text")] public string Text { get; set; } = string.Empty;
    [JsonPropertyName("title")] public string Title { get; set; } = string.Empty;
    [JsonPropertyName("subtitle")] public string Subtitle { get; set; } = string.Empty;
}

public enum FogType
{
    Linear = 0,
    Exponential1 = 1,
    Exponential2 = 2,
}

public class MapFog
{
    [JsonPropertyName("type")] public FogType Type { get; set; } = FogType.Linear;
    [JsonPropertyName("startHeight")] public float StartHeight { get; set; }
    [JsonPropertyName("endHeight")] public float EndHeight { get; set; }
    [JsonPropertyName("density")] public float Density { get; set; }

    /// <summary>[R, G, B]</summary>
    [JsonPropertyName("color")]
    public int[] Color { get; set; } = { 0, 0, 0 };
}

public enum PlayerType
{
    Human = 1,
    Computer,
    Neutral,
    Rescuable,
}

public enum PlayerRace
{
    Human = 1,
    Orc,
    Undead,
    NightElf,
}

public class PlayerStartingPosition
{
    [JsonPropertyName("x")] public float X { get; set; }
    [JsonPropertyName("y")] public float Y { get; set; }
    [JsonPropertyName("fixed")] public bool Fixed { get; set; }
}

public class MapPlayer
{
    [JsonPropertyName("playerNum")] public int PlayerNum { get; set; }
    [JsonPropertyName("type")] public PlayerType Type { get; set; }
    [JsonPropertyName("race")] public PlayerRace Race { get; set; }
    [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
    [JsonPropertyName("startingPos")] public PlayerStartingPosition StartingPos { get; set; } = new();

    [JsonPropertyName("allyLowPriorityFlags")] public List<int> AllyLowPriorityFlags { get; set; } = new();
    [JsonPropertyName("allyHighPriorityFlags")] public List<int> AllyHighPriorityFlags { get; set; } = new();
    [JsonPropertyName("enemyLowPriorityFlags")] public List<int> EnemyLowPriorityFlags { get; set; } = new();
    [JsonPropertyName("enemyHighPriorityFlags")] public List<int> EnemyHighPriorityFlags { get; set; } = new();
}

public class ForceFlags
{
    [JsonPropertyName("allied")] public bool Allied { get; set; }
    [JsonPropertyName("alliedVictory")] public bool AlliedVictory { get; set; }
    [JsonPropertyName("shareVision")] public bool ShareVision { get; set; }
    [JsonPropertyName("shareUnitControl")] public bool ShareUnitControl { get; set; }
    [JsonPropertyName("shareAdvUnitControl")] public bool ShareAdvUnitControl { get; set; }
}

public class MapForce
{
    [JsonPropertyName("flags")] public ForceFlags Flags { get; set; } = new();
    [JsonPropertyName("players")] public List<int> Players { get; set; } = new();
    [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
}

public enum UpgradeAvailability
{
    Unavailable = 0,
    Available,
    Researched,
}

public class MapUpgrade
{
    [JsonPropertyName("players")] public List<int> Players { get; set; } = new();
    [JsonPropertyName("id")] public string Id { get; set; } = string.Empty;

    /// <summary>0-based index.</summary>
    [JsonPropertyName("level")]
    public int Level { get; set; }

    [JsonPropertyName("availability")] public UpgradeAvailability Availability { get; set; }
}

public class MapTechtree
{
    [JsonPropertyName("players")] public List<int> Players { get; set; } = new();

    /// <summary>Item, unit, or ability rawcode.</summary>
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;
}

public enum RandomGroupType
{
    Unit = 0,
    Building = 1,
    Item = 2,
}

public class RandomGroupRow
{
    [JsonPropertyName("chance")] public int Chance { get; set; }
    [JsonPropertyName("entries")] public List<string> Entries { get; set; } = new();
}

public class RandomGroupTable
{
    [JsonPropertyName("number")] public int Number { get; set; }
    [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
    [JsonPropertyName("positions")] public List<RandomGroupType> Positions { get; set; } = new();
    [JsonPropertyName("rows")] public List<RandomGroupRow> Rows { get; set; } = new();
}

public class RandomItemTable
{
    [JsonPropertyName("number")] public int Number { get; set; }
    [JsonPropertyName("name")] public string Name { get; set; } = string.Empty;
    [JsonPropertyName("sets")] public List<List<ItemDropChance>> Sets { get; set; } = new();
}
