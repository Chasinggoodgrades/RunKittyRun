using System;
using System.Collections.Generic;

public class KittyData
{
    public string PlayerName { get; set; } = "";
    public GameStatsData GameStats { get; set; }
    public GameAwardsData GameAwards { get; set; }
    public GameSelectedData SelectedData { get; set; }
    public RoundTimesData RoundTimes { get; set; }
    public GameAwardsDataSorted GameAwardsSorted { get; set; }
    //public GameTimesData GameTimes { get; set; }
    public KittyData()
    {
        GameStats = new GameStatsData();
        GameAwards = new GameAwardsData();
        SelectedData = new GameSelectedData();
        RoundTimes = new RoundTimesData();
        GameAwardsSorted = new GameAwardsDataSorted();
        //GameTimes = new GameTimesData();
    }
}