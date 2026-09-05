using Launcher.W3MapTool.Exporters;
using System.Text.Json;
using Wc3MapTools.Models;
using Wc3MapTools.Translators;

namespace Launcher.W3MapTool.Importers;

public static class ObjectDataImporter
{
    public static void Import(string mapDir, string outputDir)
    {
        foreach (var entry in ObjectDataFileMap.Entries)
        {
            ImportOne(mapDir, outputDir, entry);
        }
    }

    private static void ImportOne(string mapDir, string outputDir, ObjectDataFileMap.Entry entry)
    {
        string jsonPath = Path.Combine(outputDir, entry.JsonFileName);

        if (!File.Exists(jsonPath))
        {
            Console.WriteLine($"[WARN] Not found: {jsonPath} — skipping {entry.Type} import");
            return;
        }

        string jsonText = File.ReadAllText(jsonPath);
        ObjectModificationTable? table;
        try
        {
            table = JsonSerializer.Deserialize<ObjectModificationTable>(jsonText);
        }
        catch (Exception e)
        {
            Console.WriteLine($"[ERROR] Failed to read {jsonPath}: {e.Message}");
            return;
        }

        if (table is null)
        {
            Console.WriteLine($"[ERROR] Failed to read {jsonPath}: empty or invalid object data.");
            return;
        }

        (byte[] buffer, byte[]? bufferSkin) result;
        try
        {
            result = ObjectsTranslator.JsonToWar(entry.Type, table);
        }
        catch (Exception e)
        {
            Console.WriteLine($"[ERROR] Failed to convert {entry.Type} object data: {e.Message}");
            return;
        }

        string destPath = Path.Combine(mapDir, entry.BinaryFileName);
        File.WriteAllBytes(destPath, result.buffer);
        Console.WriteLine($"[INFO] Written {entry.Type} object data → {destPath}");

        if (entry.SkinFileName is not null && result.bufferSkin is not null)
        {
            string skinDestPath = Path.Combine(mapDir, entry.SkinFileName);
            File.WriteAllBytes(skinDestPath, result.bufferSkin);
            Console.WriteLine($"[INFO] Written {entry.Type} skin data → {skinDestPath}");
        }
    }
}
