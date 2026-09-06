using System.Text.Json;
using Wc3MapTools.Models;
using Wc3MapTools.Translators;

namespace Launcher.W3MapTool.Exporters;

public static class InfoDataExporter
{
    public static void Export(string mapDir, string outputDir)
    {
        string binaryPath = Path.Combine(mapDir, "war3map.w3i");

        if (!File.Exists(binaryPath))
        {
            Console.WriteLine($"[WARN] Not found: {binaryPath} — skipping");
            return;
        }

        byte[] buffer = File.ReadAllBytes(binaryPath);

        MapInfo info;
        try
        {
            info = InfoTranslator.WarToJson(buffer);
        }
        catch (Exception e)
        {
            Console.WriteLine($"[ERROR] Failed to parse {binaryPath}: {e.Message}");
            return;
        }

        Directory.CreateDirectory(outputDir);
        string outPath = Path.Combine(outputDir, "info.json");

        string json = JsonSerializer.Serialize(info, new JsonSerializerOptions
        {
            WriteIndented = true
        });
        File.WriteAllText(outPath, json);

        Console.WriteLine($"[INFO] Exported map info to {outPath}");
    }
}
