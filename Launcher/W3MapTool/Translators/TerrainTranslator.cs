using Wc3MapTools.IO;
using Wc3MapTools.Models;

namespace Wc3MapTools.Translators;

/// <summary>
/// Converts between war3map.w3e (binary) and a JSON-friendly Terrain object.
/// Direct port of wc3maptranslator's TerrainTranslator.js — same field order,
/// same version number, same bit-packed tile point layout.
/// </summary>
public static class TerrainTranslator
{
    private const int FileVersion = 12;

    public static byte[] JsonToWar(Terrain terrain)
    {
        var writer = new WarBinaryWriter();

        /*
         * Header
         */
        writer.AddChars("W3E!"); // file id
        writer.AddInt32(FileVersion);

        writer.AddChars(terrain.Tileset); // base tileset
        writer.AddInt32(terrain.CustomTileset ? 1 : 0);

        /*
         * Tiles
         */
        writer.AddInt32(terrain.TilePalette.Count);
        foreach (var tile in terrain.TilePalette)
        {
            writer.AddChars(tile);
        }

        /*
         * Cliffs
         */
        writer.AddInt32(terrain.CliffTilePalette.Count);
        foreach (var cliffTile in terrain.CliffTilePalette)
        {
            writer.AddChars(cliffTile);
        }

        /*
         * Map size data
         */
        int rowLength = terrain.Map.Width + 1;
        writer.AddInt32(rowLength);
        writer.AddInt32(terrain.Map.Height + 1);

        /*
         * Map offset
         */
        writer.AddFloat(terrain.Map.Offset.X);
        writer.AddFloat(terrain.Map.Offset.Y);

        /*
         * Tile points
         */
        // Partition the terrain masks into "chunks" (i.e. rows) of (width+1) length,
        // reverse that list of rows (due to vertical flipping), and then write the rows out.
        var groundHeight = ChunkReverseFlatten(terrain.GroundHeight, rowLength);
        var waterHeight = ChunkReverseFlatten(terrain.WaterHeight, rowLength);
        var boundaryFlag = ChunkReverseFlatten(terrain.BoundaryFlag, rowLength);
        var flags = ChunkReverseFlatten(terrain.Flags, rowLength);
        var groundTexture = ChunkReverseFlatten(terrain.GroundTexture, rowLength);
        var groundVariation = ChunkReverseFlatten(terrain.GroundVariation, rowLength);
        var cliffVariation = ChunkReverseFlatten(terrain.CliffVariation, rowLength);
        var cliffTexture = ChunkReverseFlatten(terrain.CliffTexture, rowLength);
        var layerHeight = ChunkReverseFlatten(terrain.LayerHeight, rowLength);

        for (int i = 0; i < groundHeight.Count; i++)
        {
            int hasBoundaryFlag = boundaryFlag[i] ? 0x4000 : 0;

            writer.AddUInt16(groundHeight[i]);
            writer.AddUInt16(waterHeight[i] | hasBoundaryFlag);
            writer.AddUInt16(flags[i] | groundTexture[i]);
            writer.AddByte((byte)(groundVariation[i] | cliffVariation[i]));
            writer.AddByte((byte)(cliffTexture[i] | layerHeight[i]));
        }

        return writer.GetBuffer();
    }

    public static Terrain WarToJson(byte[] buffer)
    {
        var reader = new WarBinaryReader(buffer);
        var result = new Terrain();

        /*
         * Header
         */
        reader.ReadChars(4); // w3eHeader: W3E!
        int version = reader.ReadInt32();
        if (version != FileVersion)
        {
            throw new InvalidDataException(
                $"Unexpected war3map.w3e version: expected {FileVersion}, got {version}");
        }

        result.Tileset = reader.ReadChars(1);
        result.CustomTileset = reader.ReadInt32() == 1;

        /*
         * Tiles
         */
        int numTilePalettes = reader.ReadInt32();
        for (int i = 0; i < numTilePalettes; i++)
        {
            result.TilePalette.Add(reader.ReadFourCC());
        }

        /*
         * Cliffs
         */
        int numCliffTilePalettes = reader.ReadInt32();
        for (int i = 0; i < numCliffTilePalettes; i++)
        {
            result.CliffTilePalette.Add(reader.ReadFourCC());
        }

        /*
         * Map dimensions
         */
        int width = reader.ReadInt32() - 1;
        int height = reader.ReadInt32() - 1;
        float offsetX = reader.ReadFloat();
        float offsetY = reader.ReadFloat();
        result.Map = new TerrainMap
        {
            Width = width,
            Height = height,
            Offset = new TerrainOffset { X = offsetX, Y = offsetY }
        };

        /*
         * Map tiles
         */
        var groundHeight = new List<int>();
        var waterHeight = new List<int>();
        var boundaryFlag = new List<bool>();
        var flags = new List<int>();
        var groundTexture = new List<int>();
        var groundVariation = new List<int>();
        var cliffVariation = new List<int>();
        var cliffTexture = new List<int>();
        var layerHeight = new List<int>();

        while (!reader.AtEnd)
        {
            groundHeight.Add(reader.ReadUInt16());

            int waterHeightAndBoundary = reader.ReadUInt16();
            waterHeight.Add(waterHeightAndBoundary & 32767);
            boundaryFlag.Add((waterHeightAndBoundary & 0x4000) == 0x4000);

            int flagsAndGroundTexture = reader.ReadUInt16();
            flags.Add(flagsAndGroundTexture & 0b1111_1111_1100_0000); // upper 10 bits
            groundTexture.Add(flagsAndGroundTexture & 0b0000_0000_0011_1111); // lower 6 bits

            int groundAndCliffVariation = reader.ReadByte();
            groundVariation.Add(groundAndCliffVariation & 0b1111_1000); // upper 5 bits
            cliffVariation.Add(groundAndCliffVariation & 0b0000_0111); // lower 3 bits

            int cliffTextureAndLayerHeight = reader.ReadByte();
            cliffTexture.Add(cliffTextureAndLayerHeight & 0b1111_0000); // upper 4 bits
            layerHeight.Add(cliffTextureAndLayerHeight & 0b0000_1111); // lower 4 bits
        }

        // The map was read in "backwards" because wc3 maps have origin (0,0)
        // at the bottom left instead of top left as we desire. Flip the rows
        // vertically to fix this.
        int rowLength = result.Map.Width + 1;
        result.GroundHeight = ChunkReverseFlatten(groundHeight, rowLength);
        result.WaterHeight = ChunkReverseFlatten(waterHeight, rowLength);
        result.BoundaryFlag = ChunkReverseFlatten(boundaryFlag, rowLength);
        result.Flags = ChunkReverseFlatten(flags, rowLength);
        result.GroundTexture = ChunkReverseFlatten(groundTexture, rowLength);
        result.GroundVariation = ChunkReverseFlatten(groundVariation, rowLength);
        result.CliffVariation = ChunkReverseFlatten(cliffVariation, rowLength);
        result.CliffTexture = ChunkReverseFlatten(cliffTexture, rowLength);
        result.LayerHeight = ChunkReverseFlatten(layerHeight, rowLength);

        return result;
    }

    /// <summary>
    /// Splits <paramref name="flat"/> into rows of <paramref name="rowLength"/>, reverses the
    /// row order (to flip the map's vertical origin), and flattens the result back out.
    /// </summary>
    private static List<T> ChunkReverseFlatten<T>(List<T> flat, int rowLength)
    {
        var rows = new List<List<T>>();
        for (int i = 0; i < flat.Count; i += rowLength)
        {
            rows.Add(flat.GetRange(i, Math.Min(rowLength, flat.Count - i)));
        }

        rows.Reverse();

        var result = new List<T>(flat.Count);
        foreach (var row in rows)
        {
            result.AddRange(row);
        }

        return result;
    }
}
