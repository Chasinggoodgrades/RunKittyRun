using System.Collections.Generic;
using WCSharp.Api;

/*
SHOW PERSONAL BESTS FOR:

highest score in a game
highest KD in a game
and all other stats i'd say. so streak/     saves/deaths in 1 game / w/e other stats we got
*/

// TODO: Add a way to save personal bests to a file and load them when the game starts

public static class PersonalBestAwarder
{
    private static List<player> KibbleCollectionBeatenList = new List<player>();
    private static List<player> BeatenMostSavesList = new List<player>();
    private static List<player> SaveStreakBeatenList = new List<player>();

    /// <summary>
    /// Checks if the current round time is higher than the best time and updates it if so. Also notifies all players :).
    /// </summary>
    /// <param name="player"></param>
    public static void BeatRecordTime(player player)
    {
        var kittyStats = Globals.ALL_KITTIES[player].SaveData;
        var roundEnum = "";
        if (Gamemode.CurrentGameMode == "Standard") roundEnum = TimeSetter.GetRoundEnum();
        if (Gamemode.CurrentGameMode == Globals.GAME_MODES[1]) roundEnum = TimeSetter.GetSoloEnum();
        var time = (float)kittyStats.RoundTimes.GetType().GetProperty(roundEnum).GetValue(kittyStats.RoundTimes);
        var timeFormatted = Utility.ConvertFloatToTime(time);
        Utility.TimedTextToAllPlayers(7.0f, $"{Colors.PlayerNameColored(player)} has set a new personal best time of {Colors.COLOR_YELLOW}{timeFormatted}!|r");
    }

    /// <summary>
    /// Checks if your kibble collection is higher than your personal best and updates it if so. Also notifies all players.
    /// </summary>
    /// <param name="k"></param>
    public static void BeatKibbleCollection(Kitty k)
    {
        if (KibbleCollectionBeatenList.Contains(k.Player)) return;
        var currentKibble = k.CurrentStats.CollectedKibble;
        var bestKibble = k.SaveData.PersonalBests.KibbleCollected;
        if (bestKibble < 10) return; // avoid the spam for 1st timers.
        if (currentKibble > bestKibble)
        {
            k.SaveData.PersonalBests.KibbleCollected = currentKibble;
            Utility.TimedTextToAllPlayers(7.0f, $"{Colors.PlayerNameColored(k.Player)} has set a new personal best by collecting {Colors.COLOR_YELLOW}{currentKibble} kibbles!|r");
            KibbleCollectionBeatenList.Add(k.Player);
        }
    }

    /// <summary>
    /// Check if the current save count is higher than the best save count and update it if so. Also notify all players.
    /// </summary>
    /// <param name="k"></param>
    public static void BeatMostSavesInGame(Kitty k)
    {
        if (k.Player.Controller == mapcontrol.Computer) return;
        if (BeatenMostSavesList.Contains(k.Player)) return;
        var currentSaves = k.CurrentStats.TotalSaves;
        var bestSaves = k.SaveData.PersonalBests.Saves;
        if (bestSaves < 10) return; // avoid the spam for 1st timers.
        if (currentSaves > bestSaves)
        {
            k.SaveData.PersonalBests.Saves = currentSaves;
            Utility.TimedTextToAllPlayers(7.0f, $"{Colors.PlayerNameColored(k.Player)} has set a new personal best by saving {Colors.COLOR_YELLOW}{currentSaves} kitties|r in a single game.");
            BeatenMostSavesList.Add(k.Player);
        }
    }

    /// <summary>
    /// Check if the current save streak is higher than the best save streak and update it if so. Also notify all players.
    /// </summary>
    /// <param name="k"></param>
    public static void BeatenSaveStreak(Kitty k)
    {
        if (k.Player.Controller == mapcontrol.Computer) return;
        if (SaveStreakBeatenList.Contains(k.Player)) return;
        var currentStreak = k.SaveData.GameStats.SaveStreak;
        var bestStreak = k.SaveData.GameStats.HighestSaveStreak;
        if (bestStreak < 5) return; // avoid the spam for 1st timers.
        if (currentStreak > bestStreak)
        {
            k.SaveData.GameStats.HighestSaveStreak = currentStreak;
            Utility.TimedTextToAllPlayers(7.0f, $"{Colors.PlayerNameColored(k.Player)} has set a new personal best save streak of {Colors.COLOR_YELLOW}{currentStreak}!|r");
            SaveStreakBeatenList.Add(k.Player);
        }
    }

}
