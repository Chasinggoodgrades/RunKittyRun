using System.Collections.Generic;
using static WCSharp.Api.Common;
using WCSharp.Api;

/// <summary>
/// The model each Kitty skin is drawn with by the async effect. The effect is an effect, not a unit,
/// and a unit's model cannot be read at run time (it is object data), so it is listed here once:
/// skin unit type -> model path. A unit type that is not listed here (-skin hfoo) takes the Path in UnitData.Monsters
/// (the model file from the game's unit data) and, failing that, KittyAsyncEffect.StandInModel.
///
/// Fill the table in <see cref="Initialize"/>, or find the right path in game with the -asyncmodel
/// command (it sets the model of the skin you are wearing, until the game ends).
/// </summary>
public static class AsyncSkinModels
{
    private static readonly Dictionary<int, string> models = new Dictionary<int, string>();

    // unit type -> model path, from UnitData.Monsters (filled the first time it is needed)
    private static readonly Dictionary<int, string> monsterPaths = new Dictionary<int, string>();
    private static bool monsterPathsLoaded;

    public static void Initialize()
    {
        Register(Constants.UNIT_KITTY, "war3mapImported\\TyrandeWhisperwind.mdl");
        Register(Constants.UNIT_ANCIENT_KITTY, "war3mapImported\\PriestessoftheMoonAncientTigerV1.00.mdl");
        Register(Constants.UNIT_ASTRAL_KITTY, "war3mapImported\\PriestessOfZadeFinal.mdl");
        Register(Constants.UNIT_HIGHELF_KITTY, "war3mapImported\\SunKitty.mdl");
        Register(Constants.UNIT_HUNTRESS_KITTY, "units\\nightelf\\Huntress\\Huntress.mdl");
        Register(Constants.UNIT_SATYR_KITTY, "war3mapImported\\PriestessoftheNightmareSatyrV1.00.mdl");
        Register(Constants.UNIT_UNDEAD_KITTY, "war3mapImported\\DeathKitty.mdl");
        Register(Constants.UNIT_ZANDALARI_KITTY, "war3mapImported\\HeroZandalariStalker.mdl");
        Register(Constants.UNIT_PENGUIN, "units\\critters\\penguin\\penguin.mdl");
    }

    public static void Register(int skinUnitType, string modelPath)
    {
        models[skinUnitType] = modelPath;
    }

    public static string For(int skinUnitType)
    {
        // first what is listed above (the Kitty skins), then any unit of the game's data (-skin hfoo)
        if (models.TryGetValue(skinUnitType, out var path) && !string.IsNullOrEmpty(path)) return path;

        LoadMonsterPaths();

        if (monsterPaths.TryGetValue(skinUnitType, out var monsterPath)) return monsterPath;

        return KittyAsyncEffect.StandInModel;
    }

    private static void LoadMonsterPaths()
    {
        if (monsterPathsLoaded) return;
        monsterPathsLoaded = true;

        var monsters = UnitData.Monsters;

        for (int i = 0; i < monsters.Length; i++)
        {
            var monster = monsters[i];
            if (string.IsNullOrEmpty(monster.Path)) continue;

            int id = FourCC(monster.Id);
            if (!monsterPaths.ContainsKey(id)) monsterPaths[id] = monster.Path;
        }
    }
}
