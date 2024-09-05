using System;
using System.Collections.Generic;
using WCSharp.SaveLoad;

public class KittyData : Saveable
{
    public Dictionary<StatTypes, int> GameStats { get; set; } = new Dictionary<StatTypes, int>();
    public Dictionary<Awards, int> GameAwards { get; set; } = new Dictionary<Awards, int>();
    public Dictionary<RoundTimes, int> GameTimes { get; set; } = new Dictionary<RoundTimes, int>();
    public KittyData()
    {
        foreach (StatTypes type in Enum.GetValues(typeof(StatTypes)))
            GameStats[type] = 0;
        foreach (Awards award in Enum.GetValues(typeof(Awards)))
            GameAwards[award] = 0;
        foreach (RoundTimes round in Enum.GetValues(typeof(RoundTimes)))
            GameTimes[round] = 0;
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
public enum RoundTimes
{
    Round1Time,
    Round2Time,
    Round3Time,
    Round4Time,
    Round5Time,
}
public enum StatTypes
{
    Saves,
    SaveStreak,
    HighestSaveStreak,
    Deaths,
    Wins,
    WinStreak,
    NormalGames,
    HardGames,
    ImpossibleGames,
}

public enum Awards
{
    Cosmic_Wings,
    Divine_Wings
}
