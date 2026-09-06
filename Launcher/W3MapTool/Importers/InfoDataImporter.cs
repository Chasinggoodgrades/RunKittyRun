using System.Text.Json;
using Wc3MapTools.Models;
using Wc3MapTools.Translators;

namespace Launcher.W3MapTool.Importers;

public static class InfoDataImporter
{
    public static void Import(string mapDir, string outputDir)
    {
        string jsonPath = Path.Combine(outputDir, "info.json");

        if (!File.Exists(jsonPath))
        {
            Console.WriteLine($"[WARN] Not found: {jsonPath} — skipping info import");
            return;
        }

        string jsonText = File.ReadAllText(jsonPath);
        MapInfo? info;
        try
        {
            info = JsonSerializer.Deserialize<MapInfo>(jsonText);
        }
        catch (Exception e)
        {
            Console.WriteLine($"[ERROR] Failed to read {jsonPath}: {e.Message}");
            return;
        }

        if (info is null)
        {
            Console.WriteLine($"[ERROR] Failed to read {jsonPath}: empty or invalid map info data.");
            return;
        }

        byte[] buffer;
        try
        {
            buffer = InfoTranslator.JsonToWar(info);
        }
        catch (Exception e)
        {
            Console.WriteLine($"[ERROR] Failed to convert map info: {e.Message}");
            return;
        }

        string destPath = Path.Combine(mapDir, "war3map.w3i");
        File.WriteAllBytes(destPath, buffer);

        Console.WriteLine($"[INFO] Written map info → {destPath}");
    }
}
