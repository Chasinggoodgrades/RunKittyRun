using Wc3MapTools.IO;
using Wc3MapTools.Models;

namespace Wc3MapTools.Translators;

/// <summary>
/// Converts between war3mapUnits.doo (binary) and a JSON-friendly list of
/// unit/item placements. Direct port of wc3maptranslator's UnitsTranslator.ts.
/// </summary>
public static class UnitsTranslator
{
    private const int FileVersion = 8;
    private const int SubVersion = 11;

    private const int TargetAcquisitionNormal = -1;

    private static readonly string[] UnitsWithZeroGold = { "sloc", "iDNR" };

    public static byte[] JsonToWar(List<Unit> units)
    {
        var writer = new WarBinaryWriter();

        /*
         * Header
         */
        writer.AddChars("W3do");
        writer.AddInt32(FileVersion);
        writer.AddInt32(SubVersion);

        /*
         * Body
         */
        writer.AddInt32(units.Count);
        foreach (var unit in units)
        {
            writer.AddChars(unit.Type);
            writer.AddInt32(unit.Variation ?? 0);
            writer.AddFloat(unit.Position[0]);
            writer.AddFloat(unit.Position[1]);
            writer.AddFloat(unit.Position[2]);
            writer.AddFloat(DegreesToRadians(unit.Rotation));

            // Scale x, y, z: has no effect
            writer.AddFloat(1);
            writer.AddFloat(1);
            writer.AddFloat(1);

            writer.AddChars(unit.SkinId ?? unit.Type);

            writer.AddByte(2); // Flags: presumably always "2"

            writer.AddInt32(unit.Player);

            writer.AddByte(0); // unknown
            writer.AddByte(0); // unknown

            writer.AddInt32(unit.Hitpoints ?? -1); // -1 = unmodified
            writer.AddInt32(unit.Mana ?? -1); // -1 = unmodified

            // Random item set: global
            writer.AddInt32((unit.RandomItemSetId.HasValue && unit.RandomItemSetId.Value >= 0) ? unit.RandomItemSetId.Value : -1);

            // Random item set: custom
            if (unit.CustomItemSets is { Count: > 0 } && (!unit.RandomItemSetId.HasValue || unit.RandomItemSetId.Value == -1))
            {
                writer.AddInt32(unit.CustomItemSets.Count);

                foreach (var itemSet in unit.CustomItemSets)
                {
                    writer.AddInt32(itemSet.Count);
                    foreach (var drop in itemSet)
                    {
                        writer.AddChars(drop.Id);
                        writer.AddInt32(drop.Chance);
                    }
                }
            }
            else
            {
                writer.AddInt32(0); // no dropped item sets
            }

            // Gold amount
            bool isZeroGoldUnit = Array.IndexOf(UnitsWithZeroGold, unit.Type) >= 0;
            writer.AddInt32(isZeroGoldUnit ? 0 : (unit.Gold ?? 12500));

            // Target acquisition
            writer.AddFloat(unit.TargetAcquisition ?? TargetAcquisitionNormal);

            // Hero attributes
            var hero = unit.Hero ?? new HeroAttributes { Level = 1, Str = 0, Agi = 0, Int = 0 };
            writer.AddInt32(hero.Level);
            writer.AddInt32(hero.Str);
            writer.AddInt32(hero.Agi);
            writer.AddInt32(hero.Int);

            // Inventory
            int inventoryCount = unit.Inventory?.Count ?? 0;
            writer.AddInt32(inventoryCount);
            if (inventoryCount > 0)
            {
                foreach (var item in unit.Inventory!)
                {
                    writer.AddInt32(item.Slot - 1); // zero-index item slot
                    writer.AddChars(item.Type);
                }
            }

            // Modified abilities
            int abilityCount = unit.Abilities?.Count ?? 0;
            writer.AddInt32(abilityCount);
            if (abilityCount > 0)
            {
                foreach (var ability in unit.Abilities!)
                {
                    writer.AddChars(ability.Ability);
                    writer.AddInt32(ability.Active ? 1 : 0);
                    writer.AddInt32(ability.Level);
                }
            }

            // Random flag
            bool isRandomPlaceholder = unit.Type is "uDNR" or "iDNR";
            if (!isRandomPlaceholder)
            {
                writer.AddInt32(0);
                writer.AddInt32(1);
            }
            else if (unit.RandomEntity is { } randomEntity)
            {
                if (randomEntity.Level.HasValue)
                {
                    writer.AddInt32(0);
                    writer.AddInt24(randomEntity.Level.Value);
                    writer.AddByte((byte)(unit.Type == "iDNR" ? (randomEntity.Class ?? 0) : 0));
                }
                else if (randomEntity.Group.HasValue)
                {
                    writer.AddInt32(1);
                    writer.AddInt32(randomEntity.Group.Value);
                    writer.AddInt32(randomEntity.Position ?? 0);
                }
                else if (randomEntity.UnitSet is { Count: > 0 })
                {
                    writer.AddInt32(2);
                    writer.AddInt32(randomEntity.UnitSet.Count);
                    foreach (var drop in randomEntity.UnitSet)
                    {
                        writer.AddChars(drop.Id);
                        writer.AddInt32(drop.Chance);
                    }
                }
            }

            writer.AddInt32(unit.Color ?? -1); // -1 defaults to owning player
            writer.AddInt32(unit.WaygateRegionId ?? -1);
            writer.AddInt32(unit.Id);
        }

        return writer.GetBuffer();
    }

    public static List<Unit> WarToJson(byte[] buffer)
    {
        var reader = new WarBinaryReader(buffer);
        var result = new List<Unit>();

        reader.ReadChars(4); // File ID: W3do
        ExpectVersion(FileVersion, reader.ReadInt32());
        ExpectVersion(SubVersion, reader.ReadInt32());

        int numUnits = reader.ReadInt32();
        for (int i = 0; i < numUnits; i++)
        {
            var unit = new Unit();

            unit.Type = reader.ReadFourCC(); // (iDNR = random item, uDNR = random unit)

            int variation = reader.ReadInt32();
            if (variation != 0)
            {
                unit.Variation = variation;
            }

            unit.Position = new[] { reader.ReadFloat(), reader.ReadFloat(), reader.ReadFloat() };
            unit.Rotation = RadiansToDegrees(reader.ReadFloat());

            // Scale x, y, z: has no effect
            reader.ReadFloat();
            reader.ReadFloat();
            reader.ReadFloat();

            string skinId = reader.ReadFourCC();
            if (skinId != unit.Type)
            {
                unit.SkinId = skinId;
            }

            reader.ReadByte(); // Flags

            unit.Player = reader.ReadInt32();

            reader.ReadByte(); // unknown
            reader.ReadByte(); // unknown

            int hitpoints = reader.ReadInt32();
            int mana = reader.ReadInt32();
            if (hitpoints != -1)
            {
                unit.Hitpoints = hitpoints;
            }
            if (mana != -1)
            {
                unit.Mana = mana;
            }

            int randomItemSetPtr = reader.ReadInt32();
            int numberOfItemSets = reader.ReadInt32();
            if (randomItemSetPtr >= 0)
            {
                unit.RandomItemSetId = randomItemSetPtr;
            }
            else if (numberOfItemSets > 0)
            {
                unit.CustomItemSets = new List<List<ItemDropChance>>(numberOfItemSets);

                for (int j = 0; j < numberOfItemSets; j++)
                {
                    int numberOfItems = reader.ReadInt32();
                    var itemSet = new List<ItemDropChance>(numberOfItems);
                    for (int k = 0; k < numberOfItems; k++)
                    {
                        string itemId = reader.ReadFourCC();
                        int dropChance = reader.ReadInt32();
                        itemSet.Add(new ItemDropChance { Id = itemId, Chance = dropChance });
                    }
                    unit.CustomItemSets.Add(itemSet);
                }
            }

            int gold = reader.ReadInt32();
            if (unit.Type == "ngol")
            {
                unit.Gold = gold;
            }

            float targetAcquisition = reader.ReadFloat();
            if (targetAcquisition != TargetAcquisitionNormal)
            {
                unit.TargetAcquisition = targetAcquisition;
            }

            unit.Hero = new HeroAttributes
            {
                Level = reader.ReadInt32(), // non-hero units = 1
                Str = reader.ReadInt32(),
                Agi = reader.ReadInt32(),
                Int = reader.ReadInt32(),
            };

            int numItemsInventory = reader.ReadInt32();
            if (numItemsInventory > 0)
            {
                unit.Inventory = new List<InventoryItem>(numItemsInventory);
                for (int j = 0; j < numItemsInventory; j++)
                {
                    unit.Inventory.Add(new InventoryItem
                    {
                        Slot = reader.ReadInt32() + 1, // zero-based -> 1-6
                        Type = reader.ReadFourCC(),
                    });
                }
            }

            int numModifiedAbilities = reader.ReadInt32();
            if (numModifiedAbilities > 0)
            {
                unit.Abilities = new List<AbilityModification>(numModifiedAbilities);
                for (int j = 0; j < numModifiedAbilities; j++)
                {
                    unit.Abilities.Add(new AbilityModification
                    {
                        Ability = reader.ReadFourCC(),
                        Active = reader.ReadInt32() != 0,
                        Level = reader.ReadInt32(),
                    });
                }
            }

            int randFlag = reader.ReadInt32();
            if (randFlag == 0)
            {
                int level = reader.ReadInt24();
                int itemClass = reader.ReadByte();

                if (unit.Type is "uDNR" or "iDNR")
                {
                    unit.RandomEntity = new RandomEntity { Level = level, Class = itemClass };
                }
            }
            else if (randFlag == 1)
            {
                int group = reader.ReadInt32();
                int position = reader.ReadInt32();

                unit.RandomEntity = new RandomEntity { Group = group, Position = position };
            }
            else if (randFlag == 2)
            {
                int numDiffAvailUnits = reader.ReadInt32();
                var unitSet = new List<ItemDropChance>(numDiffAvailUnits);
                for (int k = 0; k < numDiffAvailUnits; k++)
                {
                    string id = reader.ReadFourCC();
                    int chance = reader.ReadInt32();
                    unitSet.Add(new ItemDropChance { Id = id, Chance = chance });
                }
                unit.RandomEntity = new RandomEntity { UnitSet = unitSet };
            }

            int color = reader.ReadInt32();
            if (color != -1)
            {
                unit.Color = color;
            }

            int waygateRegionId = reader.ReadInt32();
            if (waygateRegionId != -1)
            {
                unit.WaygateRegionId = waygateRegionId;
            }

            unit.Id = reader.ReadInt32();

            result.Add(unit);
        }

        return result;
    }

    private static void ExpectVersion(int expected, int actual)
    {
        if (expected != actual)
        {
            throw new InvalidDataException($"Unexpected war3mapUnits.doo version: expected {expected}, got {actual}");
        }
    }

    private static float DegreesToRadians(float degrees) => (float)(degrees * Math.PI / 180.0);

    private static float RadiansToDegrees(float radians) => (float)(radians * 180.0 / Math.PI);
}
