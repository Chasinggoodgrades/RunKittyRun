using System;
using WCSharp.Api;


/*
SHOW PERSONAL BESTS FOR:
kibble collected in a game
best times broken
most saves gotten in a game
highest save streak in a game
highest score in a game
highest KD in a game
most nitros in a game
and all other stats i'd say. so streak/     saves/deaths in 1 game / w/e other stats we got
*/

// TODO: Add a way to save personal bests to a file and load them when the game starts

public static class PersonalBestAwarder
{
    public static float TestOne = 0.0f;
    public static void BeatRecordTime(player player)
    {
        var kittyStats = Globals.ALL_KITTIES[player].SaveData;
        var roundEnum = TimeSetter.GetRoundEnum();
        var time = (float)kittyStats.RoundTimes.GetType().GetProperty(roundEnum).GetValue(kittyStats.RoundTimes);
        var timeFormatted = Utility.ConvertFloatToTime(time);
        Utility.TimedTextToAllPlayers(7.0f, $"{Colors.PlayerNameColored(player)} has set a new personal best time of {Colors.COLOR_YELLOW}{timeFormatted}!|r");
    }
}