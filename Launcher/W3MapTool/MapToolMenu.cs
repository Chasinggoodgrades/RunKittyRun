using Launcher.W3MapTool.Exporters;
using Launcher.W3MapTool.Importers;
using System.Text;
using System.Text.Json;

namespace Wc3MapTools;

public static class MapToolMenu
{
    private const string OutputDir = @"..\..\..\W3MapTool\ObjectData";
    private const string MapFolder = @"..\..\..\..\source.w3x";

    public static void Run(string[] args)
    {
        Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);

        string mapDir = Path.GetFullPath(MapFolder);
        string outputDir = Path.GetFullPath(OutputDir);
        Directory.CreateDirectory(outputDir);
        Console.WriteLine($"[INFO] Map tool files will be exported to / imported from: {outputDir}");

        while (true)
        {
            Console.WriteLine();
            Console.WriteLine("=== Wc3 Map Tools ===");
            Console.WriteLine("1. Export (regions + terrain)");
            Console.WriteLine("2. Import (regions + terrain)");
            Console.WriteLine("3. Color Regions by Prefix");
            Console.WriteLine("4. Export Units");
            Console.WriteLine("5. Import Units");
            Console.WriteLine("6. Export Object Data (units/items/destructables/doodads/abilities/buffs/upgrades)");
            Console.WriteLine("7. Import Object Data");
            Console.WriteLine("8. Exit");
            Console.Write("Select option: ");

            string? input = Console.ReadLine()?.Trim();

            if (input == "1")
            {
                RegionDataExporter.Export(mapDir, outputDir);
                RegionDataExporter.ExportTerrain(mapDir, outputDir);
                Console.WriteLine("Export complete.");
            }
            else if (input == "2")
            {
                RegionDataImporter.Import(mapDir, outputDir);
                RegionDataImporter.ImportTerrain(mapDir, outputDir);
                Console.WriteLine("Import complete.");
            }
            else if (input == "3")
            {
                RegionColorTool.ApplyPrefixColors(outputDir);
                Console.WriteLine("Coloring complete.");
            }
            else if (input == "4")
            {
                UnitsDataExporter.Export(mapDir, outputDir);
                Console.WriteLine("Export complete.");
            }
            else if (input == "5")
            {
                UnitsDataImporter.Import(mapDir, outputDir);
                Console.WriteLine("Import complete.");
            }
            else if (input == "6")
            {
                ObjectDataExporter.Export(mapDir, outputDir);
                Console.WriteLine("Export complete.");
            }
            else if (input == "7")
            {
                ObjectDataImporter.Import(mapDir, outputDir);
                Console.WriteLine("Import complete.");
            }
            else if (input == "8" || input?.ToLower() == "exit" || input?.ToLower() == "q")
            {
                break;
            }
            else
            {
                Console.WriteLine("Invalid option. Please enter 1-8.");
            }
        }
    }
}
