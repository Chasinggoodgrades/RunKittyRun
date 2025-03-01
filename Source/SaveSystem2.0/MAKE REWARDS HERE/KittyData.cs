﻿using System;
using System.Collections.Generic;

public class KittyData
{
    public string PlayerName { get; set; } = "";
    public string Date { get; set; } = "";
    public GameStatsData GameStats { get; set; }
    public GameAwardsData GameAwards { get; set; }
    public GameSelectedData SelectedData { get; set; }
    public RoundTimesData RoundTimes { get; set; }
    public GameAwardsDataSorted GameAwardsSorted { get; set; }
    public GameTimesData BestGameTimes { get; set; }
    public KittyData()
    {
        GameStats = new GameStatsData();
        GameAwards = new GameAwardsData();
        SelectedData = new GameSelectedData();
        RoundTimes = new RoundTimesData();
        GameAwardsSorted = new GameAwardsDataSorted();
        BestGameTimes = new GameTimesData();
    }
}