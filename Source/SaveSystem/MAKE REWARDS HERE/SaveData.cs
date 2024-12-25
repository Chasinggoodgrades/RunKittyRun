using System;
using System.Collections.Generic;
using WCSharp.SaveLoad;

public class KittyData : Saveable
{
    public GameStatsData GameStats { get; set; }
    public GameAwardsData GameAwards { get; set; }
    public GameSelectedData SelectedData { get; set; }
    public GameTimesData RoundTimes { get; set; }
    public KittyData()
    {
        GameStats = new GameStatsData();
        GameAwards = new GameAwardsData();
        SelectedData = new GameSelectedData();
        RoundTimes = new GameTimesData();
    }
}

public class SaveData : Saveable
{
    public KittyData Stats { get; set; } = new KittyData();
}
