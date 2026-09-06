using Wc3MapTools.IO;
using Wc3MapTools.Models;

namespace Wc3MapTools.Translators;

public static class RegionsTranslator
{
    private const int FileVersion = 5;

    public static byte[] JsonToWar(List<Region> regions)
    {
        var writer = new WarBinaryWriter();
        writer.AddInt32(FileVersion);
        writer.AddInt32(regions.Count);

        foreach (var region in regions)
        {
            writer.AddFloat(region.Position.Left);
            writer.AddFloat(region.Position.Bottom);
            writer.AddFloat(region.Position.Right);
            writer.AddFloat(region.Position.Top);

            writer.AddString(region.Name);
            writer.AddInt32(region.Id);

            if (!string.IsNullOrEmpty(region.WeatherEffect))
            {
                writer.AddChars(region.WeatherEffect);
            }
            else
            {
                writer.AddByte(0);
                writer.AddByte(0);
                writer.AddByte(0);
                writer.AddByte(0);
            }

            writer.AddString(region.AmbientSound ?? string.Empty);

            // On-disk color order is B, G, R, then an unused alpha byte (always 0xFF).
            var color = region.Color is { Length: 3 } ? region.Color : new[] { 0, 0, 0 };
            writer.AddByte((byte)color[2]);
            writer.AddByte((byte)color[1]);
            writer.AddByte((byte)color[0]);
            writer.AddByte(0xFF);
        }

        return writer.GetBuffer();
    }

    public static List<Region> WarToJson(byte[] buffer)
    {
        var reader = new WarBinaryReader(buffer);

        int version = reader.ReadInt32();
        if (version != FileVersion)
        {
            throw new InvalidDataException(
                $"Unexpected war3map.w3r version: expected {FileVersion}, got {version}");
        }

        int numRegions = reader.ReadInt32();
        var result = new List<Region>(numRegions);

        for (int i = 0; i < numRegions; i++)
        {
            var region = new Region
            {
                Position = new Rect
                {
                    Left = reader.ReadFloat(),
                    Bottom = reader.ReadFloat(),
                    Right = reader.ReadFloat(),
                    Top = reader.ReadFloat()
                },
                Name = reader.ReadString(),
                Id = reader.ReadInt32()
            };

            region.WeatherEffect = reader.ReadChars(4, treatAllZeroAsEmpty: true);
            region.AmbientSound = reader.ReadString();

            byte b = reader.ReadByte();
            byte g = reader.ReadByte();
            byte r = reader.ReadByte();
            reader.ReadByte(); // alpha byte, unused by the game

            region.Color = new[] { (int)r, (int)g, (int)b };

            result.Add(region);
        }

        return result;
    }
}
