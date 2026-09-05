using Wc3MapTools.IO;
using Wc3MapTools.Models;

namespace Wc3MapTools.Translators;

/// <summary>
/// Converts between object-data binary files (war3map.w3u/w3t/w3b/w3d/w3a/w3h/w3q,
/// plus war3mapSkin.w3b for destructables) and a JSON-friendly modification table.
/// Direct port of wc3maptranslator's ObjectsTranslator.ts.
/// </summary>
public static class ObjectsTranslator
{
    private const int FileVersion = 3;

    // Destructables now have two files, war3map.w3b and war3mapSkin.w3b.
    // Fields in the units/destructablemetadata.slk file with netsafe = 1
    // are placed in the new war3mapSkin.w3b file.
    private static readonly string[] DestructableSkinFields =
    {
        "bnam", "bsuf", "bfil", "blit",
        "btxi", "btxf", "buch", "bvar",
        "bfxr", "bsel", "bmis", "bmas",
        "bcpr", "bmap", "bmar", "bptx",
        "bptd", "bdsn", "bsnd", "bshd",
        "bsmm", "bmmr", "bmmg", "bmmb",
        "bumm", "bvcr", "bvcg", "bvcb",
        "bgsc", "bgpm",
    };

    public static (byte[] Buffer, byte[]? BufferSkin) JsonToWar(ObjectDataType type, ObjectModificationTable json)
    {
        var outBufferToWar = new WarBinaryWriter();
        var outBufferSkin = new WarBinaryWriter();

        outBufferToWar.AddInt32(FileVersion);
        outBufferSkin.AddInt32(FileVersion);

        bool usingSkinFile = false;

        if (type == ObjectDataType.Destructables)
        {
            SplitDestructableTable(json, out var regular, out var skin);

            WriteTable(type, outBufferToWar, regular.Original, isOriginalTable: true);
            WriteTable(type, outBufferToWar, regular.Custom, isOriginalTable: false);

            usingSkinFile = skin.Original.Count > 0 || skin.Custom.Count > 0;
            WriteTable(type, outBufferSkin, skin.Original, isOriginalTable: true);
            WriteTable(type, outBufferSkin, skin.Custom, isOriginalTable: false);
        }
        else
        {
            WriteTable(type, outBufferToWar, json.Original, isOriginalTable: true);
            WriteTable(type, outBufferToWar, json.Custom, isOriginalTable: false);
        }

        return (outBufferToWar.GetBuffer(), usingSkinFile ? outBufferSkin.GetBuffer() : null);
    }

    public static ObjectModificationTable WarToJson(ObjectDataType type, byte[] buffer, byte[]? bufferSkin = null)
    {
        var result = new ObjectModificationTable();

        ReadFile(type, buffer, result);
        if (bufferSkin is not null)
        {
            ReadFile(type, bufferSkin, result);
        }

        return result;
    }

    private static void ReadFile(ObjectDataType type, byte[] buffer, ObjectModificationTable result)
    {
        var reader = new WarBinaryReader(buffer);

        int version = reader.ReadInt32();
        if (version != FileVersion)
        {
            throw new InvalidDataException($"Unexpected object data version: expected {FileVersion}, got {version}");
        }

        ReadTable(type, reader, result.Original, isOriginalTable: true);
        ReadTable(type, reader, result.Custom, isOriginalTable: false);
    }

    private static bool NeedsLevelColumn(ObjectDataType type) =>
        type is ObjectDataType.Doodads or ObjectDataType.Abilities or ObjectDataType.Upgrades;

    private static void WriteTable(ObjectDataType type, WarBinaryWriter writer, List<ObjectRecord> records, bool isOriginalTable)
    {
        writer.AddInt32(records.Count);

        foreach (var record in records)
        {
            string originalId;
            string customId;

            int colonIndex = record.ObjectId.IndexOf(':');
            if (colonIndex >= 0)
            {
                customId = record.ObjectId.Substring(0, colonIndex);
                originalId = record.ObjectId.Substring(colonIndex + 1);
            }
            else
            {
                originalId = record.ObjectId;
                customId = string.Empty;
            }

            WriteObject(type, writer, originalId, customId, record.Modifications);
        }
    }

    private static void WriteObject(ObjectDataType type, WarBinaryWriter writer, string originalId, string customId, List<Modification> modifications)
    {
        writer.AddChars(originalId);
        if (!string.IsNullOrEmpty(customId))
        {
            writer.AddChars(customId);
        }
        else
        {
            writer.AddByte(0);
            writer.AddByte(0);
            writer.AddByte(0);
            writer.AddByte(0);
        }

        writer.AddInt32(1);
        writer.AddInt32(0);
        writer.AddInt32(modifications.Count);

        bool isCustom = !string.IsNullOrEmpty(customId);
        foreach (var modification in modifications)
        {
            WriteModification(type, writer, modification, isCustom, originalId);
        }
    }

    private static void WriteModification(ObjectDataType type, WarBinaryWriter writer, Modification modification, bool isCustom, string originalId)
    {
        writer.AddChars(modification.Id);
        writer.AddInt32((int)modification.Type);

        if (NeedsLevelColumn(type))
        {
            writer.AddInt32(modification.Level ?? 0);
            writer.AddInt32(modification.Column ?? 0);
        }

        switch (modification.Type)
        {
            case ModificationValueType.Int:
                writer.AddInt32(modification.ValueInt ?? 0);
                break;
            case ModificationValueType.Real:
            case ModificationValueType.Unreal:
                writer.AddFloat(modification.ValueFloat ?? 0);
                break;
            case ModificationValueType.String:
                writer.AddString(modification.ValueString ?? string.Empty);
                break;
        }

        if (!isCustom)
        {
            // Original objects are ended with their base id (e.g. hfoo)
            writer.AddChars(originalId);
        }
        else
        {
            // Custom objects are ended with 0000 bytes
            writer.AddByte(0);
            writer.AddByte(0);
            writer.AddByte(0);
            writer.AddByte(0);
        }
    }

    private static void ReadTable(ObjectDataType type, WarBinaryReader reader, List<ObjectRecord> records, bool isOriginalTable)
    {
        int numTableModifications = reader.ReadInt32();

        for (int i = 0; i < numTableModifications; i++)
        {
            string originalId = reader.ReadFourCC();
            string customId = reader.ReadChars(4, treatAllZeroAsEmpty: true);
            reader.ReadInt32();
            reader.ReadInt32();
            int modificationCount = reader.ReadInt32();

            var modifications = new List<Modification>(modificationCount);
            for (int j = 0; j < modificationCount; j++)
            {
                modifications.Add(ReadModification(type, reader));
            }

            string idInTable = isOriginalTable ? originalId : $"{customId}:{originalId}";

            // Add modifications to an existing record (rather than replacing it)
            // so the destructable skin file's fields don't overwrite the regular ones.
            var existing = records.Find(r => r.ObjectId == idInTable);
            if (existing is null)
            {
                existing = new ObjectRecord { ObjectId = idInTable };
                records.Add(existing);
            }
            existing.Modifications.AddRange(modifications);
        }
    }

    private static Modification ReadModification(ObjectDataType type, WarBinaryReader reader)
    {
        string id = reader.ReadFourCC();
        var valueType = (ModificationValueType)reader.ReadInt32();

        int? level = null;
        int? column = null;
        if (NeedsLevelColumn(type))
        {
            level = reader.ReadInt32();
            column = reader.ReadInt32();
        }

        var modification = new Modification
        {
            Id = id,
            Type = valueType,
            Level = level,
            Column = column,
        };

        switch (valueType)
        {
            case ModificationValueType.Int:
                modification.ValueInt = reader.ReadInt32();
                break;
            case ModificationValueType.Real:
            case ModificationValueType.Unreal:
                modification.ValueFloat = reader.ReadFloat();
                break;
            case ModificationValueType.String:
                modification.ValueString = reader.ReadString();
                break;
        }

        reader.ReadFourCC(); // original fields end with object ID, custom fields end with (00 00 00 00)

        return modification;
    }

    private static void SplitDestructableTable(ObjectModificationTable input, out ObjectModificationTable regular, out ObjectModificationTable skin)
    {
        regular = new ObjectModificationTable();
        skin = new ObjectModificationTable();

        SplitDestructableRecords(input.Original, regular.Original, skin.Original);
        SplitDestructableRecords(input.Custom, regular.Custom, skin.Custom);
    }

    private static void SplitDestructableRecords(List<ObjectRecord> source, List<ObjectRecord> regularOut, List<ObjectRecord> skinOut)
    {
        foreach (var record in source)
        {
            var regularFields = new List<Modification>();
            var skinFields = new List<Modification>();

            foreach (var modification in record.Modifications)
            {
                if (Array.IndexOf(DestructableSkinFields, modification.Id) >= 0)
                {
                    skinFields.Add(modification);
                }
                else
                {
                    regularFields.Add(modification);
                }
            }

            if (regularFields.Count > 0)
            {
                regularOut.Add(new ObjectRecord { ObjectId = record.ObjectId, Modifications = regularFields });
            }
            if (skinFields.Count > 0)
            {
                skinOut.Add(new ObjectRecord { ObjectId = record.ObjectId, Modifications = skinFields });
            }
        }
    }
}
