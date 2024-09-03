using System;
using System.Collections.Generic;
using WCSharp.SaveLoad;
public class KittyData : Saveable
{
    public int Saves { get; set; } = 0;
    public int SaveStreak { get; set; } = 0;
    public int HighestSaveStreak { get; set; } = 0;
    public int Deaths { get; set; } = 0;
    public int Wins { get; set; } = 0;
    public int WinStreak { get; set; } = 0;
    public int NormalGames { get; set; } = 0;
    public int HardGames { get; set; } = 0;
    public int ImpossibleGames { get; set; } = 0;
    public int Round1Time { get; set; } = 600;
    public int Round2Time { get; set; } = 600;
    public int Round3Time { get; set; } = 600;
    public int Round4Time { get; set; } = 600;
    public int Round5Time { get; set; } = 600;
    public int Cosmic_Wings { get; set; } = 0;

}

public class SaveData : Saveable
{
    public Dictionary<KittyType, KittyData> Stats { get; set; }
}


public enum KittyType
{
    Kitty = 1,
}