//using Wc3MapTools.IO;
//using Wc3MapTools.Models;

//namespace Wc3MapTools.Translators;

//public static class PathingTranslator
//{
//    private const int FileVersion = 0;

//    /// <summary>Number of pathing cells per terrain tile edge.</summary>
//    public const int CellsPerTile = 4;

//    [Flags]
//    public enum PathingFlags : byte
//    {
//        None = 0,
//        Unwalkable = 0x02,
//        Unflyable = 0x04,
//        Unbuildable = 0x08,
//    }

//    public static PathingMap WarToJson(byte[] buffer)
//    {
//        var reader = new WarBinaryReader(buffer);

//        reader.ReadChars(4); // fileId: MP3W
//        int version = reader.ReadInt32();
//        if (version != FileVersion)
//        {
//            throw new InvalidDataException(
//                $"Unexpected war3map.wpm version: expected {FileVersion}, got {version}");
//        }

//        int width = reader.ReadInt32();
//        int height = reader.ReadInt32();

//        var rawCells = new byte[width * height];
//        for (int i = 0; i < rawCells.Length; i++)
//        {
//            rawCells[i] = reader.ReadByte();
//        }

//        // Like war3map.w3e, rows are stored bottom-to-top on disk. Flip them so
//        // index 0 is the northernmost row, matching Terrain's mask layout.
//        var cells = new byte[rawCells.Length];
//        for (int row = 0; row < height; row++)
//        {
//            int srcRow = height - 1 - row;
//            Array.Copy(rawCells, srcRow * width, cells, row * width, width);
//        }

//        return new PathingMap { Width = width, Height = height, Cells = cells };
//    }

//    /// <summary>True when the ground at (col, row) is walkable and in-bounds.</summary>
//    public static bool IsWalkable(PathingMap map, int col, int row)
//    {
//        if (col < 0 || col >= map.Width || row < 0 || row >= map.Height)
//        {
//            return false;
//        }

//        byte flags = map.Cells[(row * map.Width) + col];
//        return (flags & (byte)PathingFlags.Unwalkable) == 0;
//    }
//}
