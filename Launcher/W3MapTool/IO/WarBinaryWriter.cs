namespace Wc3MapTools.IO;

/// <summary>
/// Sequential little-endian writer that builds up a WC3 binary buffer.
/// A C# port of the subset of wc3maptranslator's internal "HexBuffer"
/// behavior that RegionsTranslator (and friends) rely on.
/// </summary>
public class WarBinaryWriter
{
    private readonly List<byte> _buffer = new();

    public void AddInt32(int value) => _buffer.AddRange(BitConverter.GetBytes(value));

    public void AddUInt16(int value) => _buffer.AddRange(BitConverter.GetBytes((ushort)value));

    public void AddFloat(float value) => _buffer.AddRange(BitConverter.GetBytes(value));

    public void AddByte(byte value) => _buffer.Add(value);

    /// <summary>Writes a 3-byte little-endian signed integer (e.g. the random-unit "level" field).</summary>
    public void AddInt24(int value)
    {
        _buffer.Add((byte)(value & 0xFF));
        _buffer.Add((byte)((value >> 8) & 0xFF));
        _buffer.Add((byte)((value >> 16) & 0xFF));
    }

    /// <summary>Writes the string's bytes followed by a 0x00 terminator.</summary>
    public void AddString(string? value)
    {
        _buffer.AddRange(WarBinaryReader.TextEncoding.GetBytes(value ?? string.Empty));
        _buffer.Add(0);
    }

    /// <summary>Writes raw characters with no terminator (e.g. a 4-char rawcode).</summary>
    public void AddChars(string? value)
    {
        _buffer.AddRange(WarBinaryReader.TextEncoding.GetBytes(value ?? string.Empty));
    }

    public byte[] GetBuffer() => _buffer.ToArray();
}
