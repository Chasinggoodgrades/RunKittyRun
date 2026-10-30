using System.Collections.Generic;
using WCSharp.Api;

/// <summary>
/// The model each Kitty skin is drawn with by the async effect. The effect is an effect, not a unit,
/// and a unit's model cannot be read at run time (it is object data), so it is listed here once:
/// skin unit type -> model path. A skin that is not listed is drawn with KittyAsyncEffect.StandInModel.
///
/// Fill the table in <see cref="Initialize"/>, or find the right path in game with the -asyncmodel
/// command (it sets the model of the skin you are wearing, until the game ends).
/// </summary>
public static class AsyncSkinModels
{
    private static readonly Dictionary<int, string> models = new Dictionary<int, string>();

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
        if (models.TryGetValue(skinUnitType, out var path) && !string.IsNullOrEmpty(path)) return path;

        return KittyAsyncEffect.StandInModel;
    }
}
