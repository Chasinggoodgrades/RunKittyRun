using System.Text.Json;
using Wc3MapTools.Models;
using Wc3MapTools.Translators;

namespace Launcher.W3MapTool.Importers;

public static class RegionDataImporter
{
    public static void Import(string mapDir, string outputDir)
    {
        string jsonPath = Path.Combine(outputDir, "regions.json");

        if (!File.Exists(jsonPath))
        {
            Console.WriteLine($"[WARN] Not found: {jsonPath} — skipping regions import");
            return;
        }

        string jsonText = File.ReadAllText(jsonPath);
        List<Region> regions;
        try
        {
            regions = JsonSerializer.Deserialize<List<Region>>(jsonText) ?? new List<Region>();
        }
        catch (Exception e)
        {
            Console.WriteLine($"[ERROR] Failed to read {jsonPath}: {e.Message}");
            return;
        }

        byte[] buffer;
        try
        {
            buffer = RegionsTranslator.JsonToWar(regions);
        }
        catch (Exception e)
        {
            Console.WriteLine($"[ERROR] Failed to convert regions: {e.Message}");
            return;
        }

        string destPath = Path.Combine(mapDir, "war3map.w3r");
        File.WriteAllBytes(destPath, buffer);

        Console.WriteLine($"[INFO] Written {regions.Count} regions → {destPath}");
    }

    public static void ImportTerrain(string mapDir, string outputDir)
    {
        string jsonPath = Path.Combine(outputDir, "terrain.json");

        if (!File.Exists(jsonPath))
        {
            Console.WriteLine($"[WARN] Not found: {jsonPath} — skipping terrain import");
            return;
        }

        string jsonText = File.ReadAllText(jsonPath);
        Terrain? terrain;
        try
        {
            terrain = JsonSerializer.Deserialize<Terrain>(jsonText);
        }
        catch (Exception e)
        {
            Console.WriteLine($"[ERROR] Failed to read {jsonPath}: {e.Message}");
            return;
        }

        if (terrain is null)
        {
            Console.WriteLine($"[ERROR] Failed to read {jsonPath}: empty or invalid terrain data.");
            return;
        }

        byte[] buffer;
        try
        {
            buffer = TerrainTranslator.JsonToWar(terrain);
        }
        catch (Exception e)
        {
            Console.WriteLine($"[ERROR] Failed to convert terrain: {e.Message}");
            return;
        }

        string destPath = Path.Combine(mapDir, "war3map.w3e");
        File.WriteAllBytes(destPath, buffer);

        Console.WriteLine($"[INFO] Written terrain → {destPath}");
    }
}
