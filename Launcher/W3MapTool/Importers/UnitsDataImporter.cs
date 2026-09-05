using System.Text.Json;
using Wc3MapTools.Models;
using Wc3MapTools.Translators;

namespace Launcher.W3MapTool.Importers;

public static class UnitsDataImporter
{
    public static void Import(string mapDir, string outputDir)
    {
        string jsonPath = Path.Combine(outputDir, "units.json");

        if (!File.Exists(jsonPath))
        {
            Console.WriteLine($"[WARN] Not found: {jsonPath} — skipping units import");
            return;
        }

        string jsonText = File.ReadAllText(jsonPath);
        List<Unit>? units;
        try
        {
            units = JsonSerializer.Deserialize<List<Unit>>(jsonText);
        }
        catch (Exception e)
        {
            Console.WriteLine($"[ERROR] Failed to read {jsonPath}: {e.Message}");
            return;
        }

        if (units is null)
        {
            Console.WriteLine($"[ERROR] Failed to read {jsonPath}: empty or invalid units data.");
            return;
        }

        byte[] buffer;
        try
        {
            buffer = UnitsTranslator.JsonToWar(units);
        }
        catch (Exception e)
        {
            Console.WriteLine($"[ERROR] Failed to convert units: {e.Message}");
            return;
        }

        string destPath = Path.Combine(mapDir, "war3mapUnits.doo");
        File.WriteAllBytes(destPath, buffer);

        Console.WriteLine($"[INFO] Written {units.Count} units → {destPath}");
    }
}
