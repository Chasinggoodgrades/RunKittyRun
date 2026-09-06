using System.Text;

namespace Wc3MapTools.IO;

/// <summary>
/// Sequential little-endian reader over a WC3 binary buffer.
/// A C# port of the subset of wc3maptranslator's internal "W3Buffer"
/// behavior that RegionsTranslator (and friends) rely on.
/// </summary>
public class WarBinaryReader
{
    private readonly byte[] _buffer;
    private int _position;

    /// <summary>
    /// Warcraft III text fields are stored in the Windows codepage the game was
    /// running under (usually Windows-1252), not UTF-8. Change this if your map
    /// uses a different codepage — e.g. a CJK client.
    /// </summary>
    public static Encoding TextEncoding { get; set; } = Encoding.GetEncoding(1252);

    public WarBinaryReader(byte[] buffer)
    {
        _buffer = buffer;
        _position = 0;
    }

    public int Position => _position;
    public bool AtEnd => _position >= _buffer.Length;

    public int ReadInt32()
    {
        int value = BitConverter.ToInt32(_buffer, _position);
        _position += 4;
        return value;
    }

    public int ReadUInt16()
    {
        ushort value = BitConverter.ToUInt16(_buffer, _position);
        _position += 2;
        return value;
    }

    public float ReadFloat()
    {
        float value = BitConverter.ToSingle(_buffer, _position);
        _position += 4;
        return value;
    }

    /// <summary>Reads a 3-byte little-endian signed integer (e.g. the random-unit "level" field).</summary>
    public int ReadInt24()
    {
        int value = _buffer[_position] | (_buffer[_position + 1] << 8) | (_buffer[_position + 2] << 16);
        _position += 3;

        // Sign-extend if the top bit of the 24-bit value is set.
        if ((value & 0x800000) != 0)
        {
            value |= unchecked((int)0xFF000000);
        }

        return value;
    }

    public byte ReadByte()
    {
        return _buffer[_position++];
    }

    /// <summary>Reads bytes up to (and consuming) the next 0x00 terminator.</summary>
    public string ReadString()
    {
        int start = _position;
        while (_buffer[_position] != 0)
        {
            _position++;
        }

        string result = TextEncoding.GetString(_buffer, start, _position - start);
        _position++; // consume the null terminator
        return result;
    }

    /// <summary>Reads a fixed 4-character rawcode (e.g. an ability/item id like "hfoo").</summary>
    public string ReadFourCC() => ReadChars(4, treatAllZeroAsEmpty: false);

    /// <summary>
    /// Reads a fixed-length run of raw characters (no terminator). Optional fields
    /// (like a region's weather effect) are written as all-zero bytes when unset;
    /// pass <paramref name="treatAllZeroAsEmpty"/> = true to turn that into "".
    /// </summary>
    public string ReadChars(int length, bool treatAllZeroAsEmpty = false)
    {
        bool allZero = true;
        for (int i = 0; i < length; i++)
        {
            if (_buffer[_position + i] != 0)
            {
                allZero = false;
                break;
            }
        }

        string result = TextEncoding.GetString(_buffer, _position, length).TrimEnd('\0');
        _position += length;

        return (treatAllZeroAsEmpty && allZero) ? string.Empty : result;
    }
}
