using Wc3MapTools.IO;
using Wc3MapTools.Models;

namespace Wc3MapTools.Translators;

/// <summary>
/// Converts between war3map.w3i (binary) and a JSON-friendly <see cref="MapInfo"/>.
/// Direct port of wc3maptranslator's InfoTranslator.ts.
/// </summary>
public static class InfoTranslator
{
    private const int FileVersion = 33;

    public static byte[] JsonToWar(MapInfo info)
    {
        var writer = new WarBinaryWriter();

        writer.AddInt32(FileVersion);
        writer.AddInt32(info.Saves);
        writer.AddInt32(info.EditorVersion);

        writer.AddInt32(info.GameVersion.Major);
        writer.AddInt32(info.GameVersion.Minor);
        writer.AddInt32(info.GameVersion.Patch);
        writer.AddInt32(info.GameVersion.Build);

        // Map information
        writer.AddString(info.Map.Name);
        writer.AddString(info.Map.Author);
        writer.AddString(info.Map.Description);
        writer.AddString(info.Map.RecommendedPlayers);

        // Camera bounds (8 floats total)
        for (int i = 0; i < 8; i++)
        {
            writer.AddFloat(info.Camera.Bounds.Count > i ? info.Camera.Bounds[i] : 0f);
        }

        // Camera complements (4 ints total)
        for (int i = 0; i < 4; i++)
        {
            writer.AddInt32(info.Camera.Complements.Count > i ? info.Camera.Complements[i] : 0);
        }

        // Playable area
        writer.AddInt32(info.Map.PlayableArea.Width);
        writer.AddInt32(info.Map.PlayableArea.Height);

        /*
         * Flags
         */
        int flags = 0;
        var mapFlags = info.Map.Flags; // can be left as defaults, all flags will default to false
        if (mapFlags.HideMinimapInPreview) flags |= 0x1; // hide minimap in preview screens
        if (mapFlags.ModifyAllyPriorities) flags |= 0x2; // modify ally priorities
        if (mapFlags.IsMeleeMap) flags |= 0x4; // melee map
        // 0x8 - unknown; playable map size was large and never reduced to medium (?)
        if (mapFlags.MaskedPartiallyVisible) flags |= 0x10; // masked area are partially visible
        if (mapFlags.FixedPlayerSetting) flags |= 0x20; // fixed player setting for custom forces
        if (mapFlags.UseCustomForces) flags |= 0x40; // use custom forces
        if (mapFlags.UseCustomTechtree) flags |= 0x80; // use custom techtree
        if (mapFlags.UseCustomAbilities) flags |= 0x100; // use custom abilities
        if (mapFlags.UseCustomUpgrades) flags |= 0x200; // use custom upgrades
        // 0x400 - unknown; map properties menu opened at least once since map creation (?)
        if (mapFlags.WaterWavesOnCliffShores) flags |= 0x800; // show water waves on cliff shores
        if (mapFlags.WaterWavesOnRollingShores) flags |= 0x1000; // show water waves on rolling shores
        if (mapFlags.UseTerrainFog) flags |= 0x2000; // Use Terrain Fog enabled
        // 0x4000: 1=unknown
        if (mapFlags.UseItemClassificationSystem) flags |= 0x8000;
        if (mapFlags.EnableWaterTinting) flags |= 0x10000;
        if (mapFlags.UseAccurateProbabilityForCalculations) flags |= 0x20000;
        if (mapFlags.UseCustomAbilitySkins) flags |= 0x40000;
        if (mapFlags.DisableDenyIcon) flags |= 0x80000;
        if (mapFlags.ForceDefaultCameraZoom) flags |= 0x100000;
        if (mapFlags.ForceMaxCameraZoom) flags |= 0x200000;
        if (mapFlags.ForceMinCameraZoom) flags |= 0x400000;

        // Unknown, but these seem to always be on, at least for default maps
        flags |= 0x8000;
        flags |= 0x4000;
        flags |= 0x400;
        writer.AddInt32(flags);

        // Map main ground type
        writer.AddChars(info.Map.MainTileType);

        // Loading screen
        writer.AddInt32(info.LoadingScreen.Background);
        writer.AddString(info.LoadingScreen.Path);
        writer.AddString(info.LoadingScreen.Text);
        writer.AddString(info.LoadingScreen.Title);
        writer.AddString(info.LoadingScreen.Subtitle);

        // Use game data set
        writer.AddInt32((int)info.GameDataSet);

        // Prologue
        writer.AddString(info.Prologue.Path);
        writer.AddString(info.Prologue.Text);
        writer.AddString(info.Prologue.Title);
        writer.AddString(info.Prologue.Subtitle);

        // Fog
        writer.AddInt32((int)info.Fog.Type);
        writer.AddFloat(info.Fog.StartHeight);
        writer.AddFloat(info.Fog.EndHeight);
        writer.AddFloat(info.Fog.Density);
        writer.AddByte((byte)info.Fog.Color[0]);
        writer.AddByte((byte)info.Fog.Color[1]);
        writer.AddByte((byte)info.Fog.Color[2]);
        writer.AddByte(255); // Fog alpha - World Editor removed this field, but the byte is still needed

        // If globalWeather is not set or is set to 'none', use 0 sentinel value, else add char[4]
        if (string.IsNullOrEmpty(info.GlobalWeather) || info.GlobalWeather.Equals("none", StringComparison.OrdinalIgnoreCase))
        {
            writer.AddInt32(0);
        }
        else
        {
            writer.AddChars(info.GlobalWeather); // char[4] - lookup table
        }
        writer.AddString(info.CustomSoundEnvironment ?? string.Empty);
        writer.AddChars(string.IsNullOrEmpty(info.CustomLightEnv) ? "L" : info.CustomLightEnv[..1]);

        // Custom water tinting
        writer.AddByte((byte)info.Water[0]);
        writer.AddByte((byte)info.Water[1]);
        writer.AddByte((byte)info.Water[2]);
        writer.AddByte(255); // Water alpha - World Editor removed this field, but the byte is still needed

        writer.AddInt32((int)info.ScriptLanguage);
        writer.AddInt32((int)info.SupportedModes);
        writer.AddInt32((int)info.GameDataVersion);

        writer.AddInt32(info.ForceDefaultCameraZoom);
        writer.AddInt32(info.ForceMaxCameraZoom);
        writer.AddInt32(info.ForceMinCameraZoom);

        var availablePlayerNums = new List<int>(info.Players.Count);
        foreach (var p in info.Players)
        {
            availablePlayerNums.Add(p.PlayerNum);
        }

        // Players
        writer.AddInt32(info.Players.Count);
        foreach (var player in info.Players)
        {
            writer.AddInt32(player.PlayerNum);
            writer.AddInt32((int)player.Type);
            writer.AddInt32((int)player.Race);
            writer.AddInt32(player.StartingPos.Fixed ? 1 : 0);
            writer.AddString(player.Name);
            writer.AddFloat(player.StartingPos.X);
            writer.AddFloat(player.StartingPos.Y);
            writer.AddInt32(ToPlayerBitfield(player.AllyLowPriorityFlags, availablePlayerNums));
            writer.AddInt32(ToPlayerBitfield(player.AllyHighPriorityFlags, availablePlayerNums));
            writer.AddInt32(ToPlayerBitfield(player.EnemyLowPriorityFlags, availablePlayerNums));
            writer.AddInt32(ToPlayerBitfield(player.EnemyHighPriorityFlags, availablePlayerNums));
        }

        // Forces
        writer.AddInt32(info.Forces.Count);
        // TODO: if forces is [], write special value of `force.players = -1`
        for (int i = 0; i < info.Forces.Count; i++)
        {
            var force = info.Forces[i];

            // Calculate flags
            int forceFlags = 0;
            if (force.Flags.Allied) forceFlags |= 0x1;
            if (force.Flags.AlliedVictory) forceFlags |= 0x2;
            // Skip 0x4
            if (force.Flags.ShareVision) forceFlags |= 0x8;
            if (force.Flags.ShareUnitControl) forceFlags |= 0x10;
            if (force.Flags.ShareAdvUnitControl) forceFlags |= 0x20;

            writer.AddInt32(forceFlags);

            // Players on force
            // The first force always contains "1" bits for all the players that don't exist (special case)
            // E.g. in a 4-player map w/ [Red, Blue, Teal, Purple], force 1 will "contain" Yellow, Orange, etc.
            int forcePlayerBitfield = ToPlayerBitfield(force.Players, availablePlayerNums);
            if (i == 0)
            {
                for (int playerNum = 0; playerNum <= 23; playerNum++)
                {
                    if (!availablePlayerNums.Contains(playerNum))
                    {
                        forcePlayerBitfield |= 1 << playerNum;
                    }
                }
            }
            writer.AddInt32(forcePlayerBitfield);

            writer.AddString(force.Name);
        }

        // Upgrades
        writer.AddInt32(info.Upgrades.Count);
        foreach (var upgrade in info.Upgrades)
        {
            writer.AddInt32(ToPlayerBitfield(upgrade.Players, availablePlayerNums));
            writer.AddChars(upgrade.Id);
            writer.AddInt32(upgrade.Level);
            writer.AddInt32((int)upgrade.Availability);
        }

        // Tech availability
        writer.AddInt32(info.Techtree.Count);
        foreach (var tech in info.Techtree)
        {
            writer.AddInt32(ToPlayerBitfield(tech.Players, availablePlayerNums));
            writer.AddChars(tech.Id);
        }

        // Random groups
        writer.AddInt32(info.RandomGroupTable.Count);
        foreach (var groupTable in info.RandomGroupTable)
        {
            writer.AddInt32(groupTable.Number);
            writer.AddString(groupTable.Name);
            writer.AddInt32(groupTable.Positions.Count);

            foreach (var position in groupTable.Positions)
            {
                writer.AddInt32((int)position);
            }

            writer.AddInt32(groupTable.Rows.Count);

            foreach (var row in groupTable.Rows)
            {
                writer.AddInt32(row.Chance);
                foreach (var entry in row.Entries)
                {
                    writer.AddChars(entry);
                }
            }
        }

        // Item table (random)
        writer.AddInt32(info.RandomItemTable.Count);
        foreach (var itemTable in info.RandomItemTable)
        {
            writer.AddInt32(itemTable.Number);
            writer.AddString(itemTable.Name);

            writer.AddInt32(itemTable.Sets.Count);
            foreach (var itemSet in itemTable.Sets)
            {
                writer.AddInt32(itemSet.Count);
                foreach (var item in itemSet)
                {
                    writer.AddInt32(item.Chance);
                    writer.AddChars(item.Id);
                }
            }
        }

        return writer.GetBuffer();
    }

    public static MapInfo WarToJson(byte[] buffer)
    {
        var result = new MapInfo
        {
            Map =
            {
                PlayableArea = new PlayableMapArea { Width = 64, Height = 64 },
                Flags = new MapFlags
                {
                    HideMinimapInPreview = false, // 0x1: 1=hide minimap in preview screens
                    ModifyAllyPriorities = true, // 0x2: 1=modify ally priorities
                    IsMeleeMap = false, // 0x4: 1=melee map
                    // 0x8: 1=playable map size was large and has never been reduced to medium (?)
                    MaskedPartiallyVisible = false, // 0x10: 1=masked area are partially visible
                    FixedPlayerSetting = false, // 0x20: 1=fixed player setting for custom forces
                    UseCustomForces = false, // 0x40: 1=use custom forces
                    UseCustomTechtree = false, // 0x80: 1=use custom techtree
                    UseCustomAbilities = false, // 0x100: 1=use custom abilities
                    UseCustomUpgrades = false, // 0x200: 1=use custom upgrades
                    // 0x400: 1=map properties menu opened at least once since map creation (?)
                    WaterWavesOnCliffShores = false, // 0x800: 1=show water waves on cliff shores
                    WaterWavesOnRollingShores = false, // 0x1000: 1=show water waves on rolling shores
                    UseTerrainFog = false, // 0x2000
                    UseItemClassificationSystem = false, // 0x8000: 1=use item classification system
                    EnableWaterTinting = false, // 0x10000
                    UseAccurateProbabilityForCalculations = false, // 0x20000
                    UseCustomAbilitySkins = false, // 0x40000
                    DisableDenyIcon = false, // 0x80000
                    ForceDefaultCameraZoom = false, // 0x100000
                    ForceMaxCameraZoom = false, // 0x200000
                    ForceMinCameraZoom = false, // 0x400000
                },
            },
            Fog = new MapFog { Type = FogType.Linear, StartHeight = 0, EndHeight = 0, Density = 0, Color = new[] { 0, 0, 0 } },
            GameDataVersion = GameDataVersion.TFT,
            GameDataSet = GameDataSet.Default,
            ScriptLanguage = ScriptLanguage.JASS,
            SupportedModes = SupportedModes.Both,
        };

        var reader = new WarBinaryReader(buffer);

        ExpectVersion(FileVersion, reader.ReadInt32()); // File version

        result.Saves = reader.ReadInt32();
        result.EditorVersion = reader.ReadInt32();

        result.GameVersion = new GameVersion
        {
            Major = reader.ReadInt32(),
            Minor = reader.ReadInt32(),
            Patch = reader.ReadInt32(),
            Build = reader.ReadInt32(),
        };

        result.Map.Name = reader.ReadString();
        result.Map.Author = reader.ReadString();
        result.Map.Description = reader.ReadString();
        result.Map.RecommendedPlayers = reader.ReadString();

        result.Camera.Bounds = new List<float>
        {
            reader.ReadFloat(), reader.ReadFloat(), reader.ReadFloat(), reader.ReadFloat(),
            reader.ReadFloat(), reader.ReadFloat(), reader.ReadFloat(), reader.ReadFloat(),
        };

        result.Camera.Complements = new List<int>
        {
            reader.ReadInt32(), reader.ReadInt32(), reader.ReadInt32(), reader.ReadInt32(),
        };

        result.Map.PlayableArea = new PlayableMapArea
        {
            Width = reader.ReadInt32(),
            Height = reader.ReadInt32(),
        };

        int flags = reader.ReadInt32();
        result.Map.Flags = new MapFlags
        {
            HideMinimapInPreview = (flags & 0x1) != 0,
            ModifyAllyPriorities = (flags & 0x2) != 0,
            IsMeleeMap = (flags & 0x4) != 0,
            // skip 0x8
            MaskedPartiallyVisible = (flags & 0x10) != 0,
            FixedPlayerSetting = (flags & 0x20) != 0,
            UseCustomForces = (flags & 0x40) != 0,
            UseCustomTechtree = (flags & 0x80) != 0,
            UseCustomAbilities = (flags & 0x100) != 0,
            UseCustomUpgrades = (flags & 0x200) != 0,
            // skip 0x400
            WaterWavesOnCliffShores = (flags & 0x800) != 0,
            WaterWavesOnRollingShores = (flags & 0x1000) != 0,
            UseTerrainFog = (flags & 0x2000) != 0,
            // skip 0x4000
            UseItemClassificationSystem = (flags & 0x8000) != 0,
            EnableWaterTinting = (flags & 0x10000) != 0,
            UseAccurateProbabilityForCalculations = (flags & 0x20000) != 0,
            UseCustomAbilitySkins = (flags & 0x40000) != 0,
            DisableDenyIcon = (flags & 0x80000) != 0,
            ForceDefaultCameraZoom = (flags & 0x100000) != 0,
            ForceMaxCameraZoom = (flags & 0x200000) != 0,
            ForceMinCameraZoom = (flags & 0x400000) != 0,
        };

        result.Map.MainTileType = reader.ReadChars(4);

        result.LoadingScreen.Background = reader.ReadInt32();
        result.LoadingScreen.Path = reader.ReadString();
        result.LoadingScreen.Text = reader.ReadString();
        result.LoadingScreen.Title = reader.ReadString();
        result.LoadingScreen.Subtitle = reader.ReadString();

        result.GameDataSet = (GameDataSet)reader.ReadInt32();

        result.Prologue = new Prologue
        {
            Path = reader.ReadString(),
            Text = reader.ReadString(),
            Title = reader.ReadString(),
            Subtitle = reader.ReadString(),
        };

        result.Fog = new MapFog
        {
            Type = (FogType)reader.ReadInt32(),
            StartHeight = reader.ReadFloat(),
            EndHeight = reader.ReadFloat(),
            Density = reader.ReadFloat(),
            Color = new[] { (int)reader.ReadByte(), (int)reader.ReadByte(), (int)reader.ReadByte() }, // R G B
        };
        reader.ReadByte(); // consume the fog.color alpha byte (World Editor removed field, but byte is still there)

        result.GlobalWeather = reader.ReadChars(4, treatAllZeroAsEmpty: true);
        result.CustomSoundEnvironment = reader.ReadString();
        result.CustomLightEnv = reader.ReadChars(1);
        result.Water = new[] { (int)reader.ReadByte(), (int)reader.ReadByte(), (int)reader.ReadByte() }; // R G B
        reader.ReadByte(); // consume water color alpha byte (World Editor removed field, but byte is still there)

        result.ScriptLanguage = (ScriptLanguage)reader.ReadInt32();
        result.SupportedModes = (SupportedModes)reader.ReadInt32();
        result.GameDataVersion = (GameDataVersion)reader.ReadInt32();

        result.ForceDefaultCameraZoom = reader.ReadInt32();
        result.ForceMaxCameraZoom = reader.ReadInt32();
        result.ForceMinCameraZoom = reader.ReadInt32();

        // Struct: players
        int numPlayers = reader.ReadInt32();
        for (int i = 0; i < numPlayers; i++)
        {
            int playerNum = reader.ReadInt32();
            var type = (PlayerType)reader.ReadInt32();
            var race = (PlayerRace)reader.ReadInt32();

            bool isFixedStartPosition = reader.ReadInt32() == 1;

            string name = reader.ReadString();
            var startingPos = new PlayerStartingPosition
            {
                X = reader.ReadFloat(),
                Y = reader.ReadFloat(),
                Fixed = isFixedStartPosition,
            };

            var allyLowPriorityFlags = FromPlayerBitfield(reader.ReadInt32(), null);
            var allyHighPriorityFlags = FromPlayerBitfield(reader.ReadInt32(), null);
            var enemyLowPriorityFlags = FromPlayerBitfield(reader.ReadInt32(), null);
            var enemyHighPriorityFlags = FromPlayerBitfield(reader.ReadInt32(), null);

            result.Players.Add(new MapPlayer
            {
                Name = name,
                StartingPos = startingPos,
                PlayerNum = playerNum,
                Type = type,
                Race = race,
                AllyLowPriorityFlags = allyLowPriorityFlags,
                AllyHighPriorityFlags = allyHighPriorityFlags,
                EnemyLowPriorityFlags = enemyLowPriorityFlags,
                EnemyHighPriorityFlags = enemyHighPriorityFlags,
            });
        }

        var availablePlayerNums = new List<int>(result.Players.Count);
        foreach (var p in result.Players)
        {
            availablePlayerNums.Add(p.PlayerNum);
        }

        // Struct: forces
        int numForces = reader.ReadInt32();
        // TODO: handle case when custom forces is off (players = -1)
        for (int i = 0; i < numForces; i++)
        {
            int forceFlag = reader.ReadInt32();
            var forceFlags = new ForceFlags
            {
                Allied = (forceFlag & 0x1) != 0,
                AlliedVictory = (forceFlag & 0x2) != 0,
                // skip 0x4
                ShareVision = (forceFlag & 0x8) != 0,
                ShareUnitControl = (forceFlag & 0x10) != 0,
                ShareAdvUnitControl = (forceFlag & 0x20) != 0,
            };
            var players = FromPlayerBitfield(reader.ReadInt32(), availablePlayerNums);
            string name = reader.ReadString();

            result.Forces.Add(new MapForce { Name = name, Flags = forceFlags, Players = players });
        }

        // Struct: upgrade availability
        int numUpgrades = reader.ReadInt32();
        for (int i = 0; i < numUpgrades; i++)
        {
            var players = FromPlayerBitfield(reader.ReadInt32(), availablePlayerNums);
            string id = reader.ReadFourCC(); // see UpgradeData.slk
            int level = reader.ReadInt32(); // Level of upgrade being modified, 0-based index
            var availability = (UpgradeAvailability)reader.ReadInt32();

            result.Upgrades.Add(new MapUpgrade { Id = id, Players = players, Level = level, Availability = availability });
        }

        // Struct: tech availability
        int numTech = reader.ReadInt32();
        for (int i = 0; i < numTech; i++)
        {
            var players = FromPlayerBitfield(reader.ReadInt32(), availablePlayerNums);
            string id = reader.ReadFourCC();

            result.Techtree.Add(new MapTechtree { Players = players, Id = id });
        }

        // Struct: random group table
        int numGroupTables = reader.ReadInt32();
        for (int i = 0; i < numGroupTables; i++)
        {
            var group = new RandomGroupTable
            {
                Number = reader.ReadInt32(),
                Name = reader.ReadString(),
            };

            int numPositions = reader.ReadInt32();
            for (int p = 0; p < numPositions; p++)
            {
                group.Positions.Add((RandomGroupType)reader.ReadInt32());
            }

            int numRows = reader.ReadInt32();
            for (int j = 0; j < numRows; j++)
            {
                int chance = reader.ReadInt32();

                var entries = new List<string>(numPositions);
                for (int p = 0; p < numPositions; p++)
                {
                    entries.Add(reader.ReadFourCC()); // id of unit/building/item
                }

                group.Rows.Add(new RandomGroupRow { Chance = chance, Entries = entries });
            }

            result.RandomGroupTable.Add(group);
        }

        // Struct: random item table
        int numItemTable = reader.ReadInt32();
        for (int i = 0; i < numItemTable; i++)
        {
            int number = reader.ReadInt32();
            string name = reader.ReadString();
            var sets = new List<List<ItemDropChance>>();

            int itemSetsCurrentTable = reader.ReadInt32(); // Number of sets in item table
            for (int j = 0; j < itemSetsCurrentTable; j++)
            {
                int itemsInItemSet = reader.ReadInt32(); // Number of items in set
                var itemSet = new List<ItemDropChance>(itemsInItemSet);
                for (int k = 0; k < itemsInItemSet; k++)
                {
                    int chance = reader.ReadInt32(); // Percentual chance
                    string itemId = reader.ReadFourCC(); // Item id (as in ItemData.slk)

                    itemSet.Add(new ItemDropChance { Chance = chance, Id = itemId });
                }

                sets.Add(itemSet);
            }

            result.RandomItemTable.Add(new RandomItemTable { Name = name, Number = number, Sets = sets });
        }

        return result;
    }

    private static void ExpectVersion(int expected, int actual)
    {
        if (expected != actual)
        {
            throw new InvalidDataException($"Unexpected war3map.w3i version: expected {expected}, got {actual}");
        }
    }

    private static int ToPlayerBitfield(List<int> players, List<int> availablePlayerNums)
    {
        int bitfield = 0;
        foreach (int playerNum in players)
        {
            if (availablePlayerNums.Contains(playerNum))
            {
                bitfield |= 1 << playerNum;
            }
        }
        return bitfield;
    }

    private static List<int> FromPlayerBitfield(int bitfield, List<int>? availablePlayerNums)
    {
        var players = new List<int>();
        for (int playerNum = 0; playerNum <= 23; playerNum++)
        {
            if ((bitfield & (1 << playerNum)) == 0)
            {
                continue;
            }

            if (availablePlayerNums == null || availablePlayerNums.Contains(playerNum))
            {
                players.Add(playerNum);
            }
        }
        return players;
    }
}
