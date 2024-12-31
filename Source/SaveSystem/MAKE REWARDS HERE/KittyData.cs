using System;
using System.Collections.Generic;

public class KittyData
{
    public string PlayerName { get; set; } = "";
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