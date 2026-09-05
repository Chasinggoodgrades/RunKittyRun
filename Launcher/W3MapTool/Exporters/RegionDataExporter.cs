using System.Text.Json;
using Wc3MapTools.Models;
using Wc3MapTools.Translators;

namespace Launcher.W3MapTool.Exporters;

public static class RegionDataExporter
{
    public static void Export(string mapDir, string outputDir)
    {
        string binaryPath = Path.Combine(mapDir, "war3map.w3r");

        if (!File.Exists(binaryPath))
        {
            Console.WriteLine($"[WARN] Not found: {binaryPath} — skipping");
            return;
        }

        byte[] buffer = File.ReadAllBytes(binaryPath);

        List<Region> regions;
        try
        {
            regions = RegionsTranslator.WarToJson(buffer);
        }
        catch (Exception e)
        {
            Console.WriteLine($"[ERROR] Failed to parse {binaryPath}: {e.Message}");
            return;
        }

        Directory.CreateDirectory(outputDir);
        string outPath = Path.Combine(outputDir, "regions.json");

        string json = JsonSerializer.Serialize(regions, new JsonSerializerOptions
        {
            WriteIndented = true
        });
        File.WriteAllText(outPath, json);

        Console.WriteLine($"[INFO] Exported {regions.Count} regions to {outPath}");
    }

    public static void ExportTerrain(string mapDir, string outputDir)
    {
        string binaryPath = Path.Combine(mapDir, "war3map.w3e");

        if (!File.Exists(binaryPath))
        {
            Console.WriteLine($"[WARN] Not found: {binaryPath} — skipping");
            return;
        }

        byte[] buffer = File.ReadAllBytes(binaryPath);

        Terrain terrain;
        try
        {
            terrain = TerrainTranslator.WarToJson(buffer);
        }
        catch (Exception e)
        {
            Console.WriteLine($"[ERROR] Failed to parse {binaryPath}: {e.Message}");
            return;
        }

        Directory.CreateDirectory(outputDir);
        string outPath = Path.Combine(outputDir, "terrain.json");

        string json = JsonSerializer.Serialize(terrain, new JsonSerializerOptions
        {
            WriteIndented = true
        });
        File.WriteAllText(outPath, json);

        Console.WriteLine($"[INFO] Exported terrain to {outPath}");
    }
}
