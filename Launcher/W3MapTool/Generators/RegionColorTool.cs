using System.Text.Json;
using System.Text.Json.Nodes;

namespace Wc3MapTools;

/// <summary>
/// Recolors regions in regions.json by name.
/// </summary>
public static class RegionColorTool
{
    // Copied and pasted from a maze use case.. I don't think this has value in RKR
    private static readonly (string Prefix, int[] Rgb)[] Rules =
    {
        ("Patrol",   new[] { 160,  32, 240 }), // purple
        ("Blinker",  new[] {   0, 120, 255 }), // blue
        ("Darter",   new[] { 255,  48,  48 }), // red
        ("Teleport", new[] {   0, 220, 220 }), // turquoise
        ("Wisp",     new[] {  40, 200,  80 }), // green (Wall / Whirl / RotateWall / …)
    };

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = true,
    };

    /// <summary>
    /// Reads objectdata/regions.json, applies prefix colors, writes it back.
    /// </summary>
    /// <param name="objectDataDir">Usually "./objectdata"</param>
    public static void ApplyPrefixColors(string objectDataDir)
    {
        string path = Path.Combine(objectDataDir, "regions.json");

        if (!File.Exists(path))
        {
            Console.WriteLine($"[ERROR] regions.json not found: {path}");
            return;
        }

        JsonNode? root = JsonNode.Parse(File.ReadAllText(path));
        if (root is not JsonArray regions)
        {
            Console.WriteLine("[ERROR] regions.json root is not an array.");
            return;
        }

        int changed = 0;

        foreach (JsonNode? node in regions)
        {
            if (node is not JsonObject region)
                continue;

            string name = region["name"]?.GetValue<string>() ?? "";
            int[]? rgb = ColorFor(name);
            if (rgb is null)
                continue;

            region["color"] = new JsonArray(rgb[0], rgb[1], rgb[2]);
            changed++;
        }

        File.WriteAllText(path, root.ToJsonString(JsonOptions) + Environment.NewLine);
        Console.WriteLine($"[OK] Updated color on {changed} region(s) in {path}");
    }

    private static int[]? ColorFor(string name)
    {
        foreach (var (prefix, rgb) in Rules)
        {
            if (name.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
                return rgb;
        }
        return null;
    }
}
