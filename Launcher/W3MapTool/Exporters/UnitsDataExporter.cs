using System.Text.Json;
using Wc3MapTools.Models;
using Wc3MapTools.Translators;

namespace Launcher.W3MapTool.Exporters;

public static class UnitsDataExporter
{
    public static void Export(string mapDir, string outputDir)
    {
        string binaryPath = Path.Combine(mapDir, "war3mapUnits.doo");

        if (!File.Exists(binaryPath))
        {
            Console.WriteLine($"[WARN] Not found: {binaryPath} — skipping");
            return;
        }

        byte[] buffer = File.ReadAllBytes(binaryPath);

        List<Unit> units;
        try
        {
            units = UnitsTranslator.WarToJson(buffer);
        }
        catch (Exception e)
        {
            Console.WriteLine($"[ERROR] Failed to parse {binaryPath}: {e.Message}");
            return;
        }

        Directory.CreateDirectory(outputDir);
        string outPath = Path.Combine(outputDir, "units.json");

        string json = JsonSerializer.Serialize(units, new JsonSerializerOptions
        {
            WriteIndented = true
        });
        File.WriteAllText(outPath, json);

        Console.WriteLine($"[INFO] Exported {units.Count} units to {outPath}");
    }
}
