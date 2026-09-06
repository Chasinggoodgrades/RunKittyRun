using System.Text.Json;
using Wc3MapTools.Models;
using Wc3MapTools.Translators;

namespace Launcher.W3MapTool.Exporters;

/// <summary>
/// Maps each <see cref="ObjectDataType"/> to its war3map binary filename(s)
/// and matching JSON name, so export/import can loop over all seven tables.
/// </summary>
internal static class ObjectDataFileMap
{
    public record Entry(ObjectDataType Type, string BinaryFileName, string? SkinFileName, string JsonFileName);

    public static readonly Entry[] Entries =
    {
        new(ObjectDataType.Units, "war3map.w3u", null, "units-objectdata.json"),
        new(ObjectDataType.Items, "war3map.w3t", null, "items-objectdata.json"),
        new(ObjectDataType.Destructables, "war3map.w3b", "war3mapSkin.w3b", "destructables-objectdata.json"),
        new(ObjectDataType.Doodads, "war3map.w3d", null, "doodads-objectdata.json"),
        new(ObjectDataType.Abilities, "war3map.w3a", null, "abilities-objectdata.json"),
        new(ObjectDataType.Buffs, "war3map.w3h", null, "buffs-objectdata.json"),
        new(ObjectDataType.Upgrades, "war3map.w3q", null, "upgrades-objectdata.json"),
    };
}

public static class ObjectDataExporter
{
    public static void Export(string mapDir, string outputDir)
    {
        foreach (var entry in ObjectDataFileMap.Entries)
        {
            ExportOne(mapDir, outputDir, entry);
        }
    }

    private static void ExportOne(string mapDir, string outputDir, ObjectDataFileMap.Entry entry)
    {
        string binaryPath = Path.Combine(mapDir, entry.BinaryFileName);

        if (!File.Exists(binaryPath))
        {
            Console.WriteLine($"[WARN] Not found: {binaryPath} — skipping");
            return;
        }

        byte[] buffer = File.ReadAllBytes(binaryPath);

        byte[]? bufferSkin = null;
        if (entry.SkinFileName is not null)
        {
            string skinPath = Path.Combine(mapDir, entry.SkinFileName);
            if (File.Exists(skinPath))
            {
                bufferSkin = File.ReadAllBytes(skinPath);
            }
        }

        ObjectModificationTable table;
        try
        {
            table = ObjectsTranslator.WarToJson(entry.Type, buffer, bufferSkin);
        }
        catch (Exception e)
        {
            Console.WriteLine($"[ERROR] Failed to parse {binaryPath}: {e.Message}");
            return;
        }

        Directory.CreateDirectory(outputDir);
        string outPath = Path.Combine(outputDir, entry.JsonFileName);

        string json = JsonSerializer.Serialize(table, new JsonSerializerOptions
        {
            WriteIndented = true
        });
        File.WriteAllText(outPath, json);

        Console.WriteLine($"[INFO] Exported {entry.Type} object data ({table.Original.Count} original, {table.Custom.Count} custom) to {outPath}");
    }
}
