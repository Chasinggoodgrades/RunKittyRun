using System;
using System.Collections.Generic;
using WCSharp.SaveLoad;

public class KittyData : Saveable
{
    public Dictionary<StatTypes, int> GameStats { get; set; } = new Dictionary<StatTypes, int>();
    public Dictionary<Awards, int> GameAwards { get; set; } = new Dictionary<Awards, int>();
    public Dictionary<RoundTimes, int> GameTimes { get; set; } = new Dictionary<RoundTimes, int>();
    public Dictionary<SelectedData, int> SelectedData { get; set; } = new Dictionary<SelectedData, int>();
    public KittyData()
    {
        foreach (StatTypes type in Enum.GetValues(typeof(StatTypes)))
            GameStats[type] = 0;
        foreach (Awards award in Enum.GetValues(typeof(Awards)))
            GameAwards[award] = 0;
        foreach (RoundTimes round in Enum.GetValues(typeof(RoundTimes)))
            GameTimes[round] = 0;
        foreach (SelectedData data in Enum.GetValues(typeof(SelectedData)))
            SelectedData[data] = -1;
    }
}

public class SaveData : Saveable
{
    public Dictionary<KittyType, KittyData> Stats { get; set; } = new Dictionary<KittyType, KittyData>();
}

public enum KittyType
{
    Kitty = 1,
}
public enum SelectedData
{
    SelectedSkin,
    SelectedWings,
    SelectedAura,
    SelectedWindwalk,
    SelectedHat,
    SelectedTrail
}
public enum RoundTimes
{
    ROneNormal,
    RTwoNormal,
    RThreeNormal,
    RFourNormal,
    RFiveNormal,
    ROneHard,
    RTwoHard,
    RThreeHard,
    RFourHard,
    RFiveHard,
    ROneImpossible,
    RTwoImpossible,
    RThreeImpossible,
    RFourImpossible,
    RFiveImpossible,
    SoloRoundOne,
    SoloRoundTwo,
    SoloRoundThree,
    SoloRoundFour,
    SoloRoundFive,
}
public enum StatTypes
{
    Saves,
    SaveStreak,
    HighestSaveStreak,
    Deaths,
    Wins,
    WinStreak,
    HighestWinStreak,
    WinsNormal,
    WinsHard,
    WinsImpossible,
    NormalGames,
    HardGames,
    ImpossibleGames,
}

public enum Awards
{
    // Hats
    Bandana, // 0 
    Pirate_Hat,
    Chef_Hat,
    Tiki_Mask,
    Samurai_Helm,
    Santa_Hat,

    // Wings
    Phoenix_Wings,
    Fairy_Wings,
    Nightmare_Wings,
    Archangel_Wings,

    Void_Wings,
    Cosmic_Wings,
    Chaos_Wings,
    Pink_Wings,
    Nature_Wings,

    // Tendrils Wings
    Red_Tendrils,
    White_Tendrils,
    Divinity_Tendrils,
    Green_Tendrils,
    Patriotic_Tendrils,

    // Auras
    Special_Aura,
    Starlight_Aura,
    Mana_Aura,
    Spectacular_Aura,
    Butterfly_Aura,

    // Skins
    Undead_Kitty,
    Highelf_Kitty,
    Astral_Kitty,
    Satyr_Kitty,
    Ancient_Kitty,

    // Windwalks
    WW_Blood,
    WW_Blue,
    WW_Fire,
    WW_Necro,
    WW_Swift,

    // Fire
    Purple_Fire,
    Blue_Fire,
    Turquoise_Fire,
    Pink_Fire,
    White_Fire,

    // Nitros
    Nitro,
    Nitro_Blue,
    Nitro_Red,
    Nitro_Green,
    Nitro_Purple,
    Divine_Light,

    // Lightning
    Blue_Lightning,
    Red_Lightning,
    Purple_Lightning,
    Yellow_Lightning,
    Green_Lightning,

    //Deathless
    Deathless_1,
    Deathless_2,
    Deathless_3,
    Deathless_4,
    Deathless_5,
}
