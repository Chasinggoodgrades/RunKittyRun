using System;
using System.Collections.Generic;
using System.Linq;
using WCSharp.Api;

public static class GameoverUtil
{
    public static void SetBestGameStats()
    {
        foreach (var kitty in Globals.ALL_KITTIES)
        {
            switch (Difficulty.DifficultyValue)
            {
                case (int)DifficultyLevel.Normal:
                    SetNormalGameStats(kitty.Value);
                    break;

                case (int)DifficultyLevel.Hard:
                    SetHardGameStats(kitty.Value);
                    break;

                case (int)DifficultyLevel.Impossible:
                    SetImpossibleGameStats(kitty.Value);
                    break;
                case (int)DifficultyLevel.Nightmare:
                    SetNightmareGameStats(kitty.Value);
                    break;
            }
        }
    }

    public static void SetColorData()
    {
        foreach (var kitty in Globals.ALL_KITTIES.Values)
        {
            Colors.PopulateColorsData(kitty); // make sure its populated
            Colors.UpdateColors(kitty); // 
            Colors.GetMostPlayedColor(kitty);
        }
    }

    public static void SetFriendData()
    {
        var friendDict = new Dictionary<string, int>();

        foreach (var kitty in Globals.ALL_KITTIES)
        {
            var friendsPlayedWith = kitty.Value.SaveData.FriendsData.FriendsPlayedWith;

            friendDict.Clear();

            // Splitting / Parsing the data of playerName:count pairs
            if (!string.IsNullOrWhiteSpace(friendsPlayedWith))
            {
                foreach (var entry in friendsPlayedWith.Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries))
                {
                    var parts = entry.Split(':');
                    if (parts.Length == 2 && int.TryParse(parts[1].Trim(), out int count))
                    {
                        friendDict[parts[0].Trim()] = count;
                    }
                }
            }

            // takes all in-game kitties, increments count if they're present in dictionary else set to 1
            foreach (var other in Globals.ALL_KITTIES)
            {
                if (other.Value == kitty.Value) continue;
                string friendName = other.Value.Player.Name; // Get their full battle tag

                if (friendDict.ContainsKey(friendName))
                {
                    friendDict[friendName]++;
                }
                else
                {
                    friendDict[friendName] = 1;
                }
            }

            // Yoshi said if this wasn't sorted she was gonna hurt me, SO HERE IT IS .. Order By DESC!!
            kitty.Value.SaveData.FriendsData.FriendsPlayedWith =
                string.Join(", ",
                    friendDict.OrderByDescending(kvp => kvp.Value)
                              .Select(kvp => $"{kvp.Key}:{kvp.Value}"));
        }
    }

    private static void SetNormalGameStats(Kitty kitty)
    {
        var stats = kitty.SaveData.BestGameTimes.NormalGameTime;
        if (Globals.GAME_TIMER.Remaining > stats.Time && stats.Time != 0) return;
        stats.Time = Globals.GAME_TIMER.Remaining;
        stats.Date = DateTimeManager.DateTime.ToString();
        stats.TeamMembers = GetTeamMembers();
    }

    private static void SetHardGameStats(Kitty kitty)
    {
        var stats = kitty.SaveData.BestGameTimes.HardGameTime;
        if (Globals.GAME_TIMER.Remaining > stats.Time && stats.Time != 0) return;
        stats.Time = Globals.GAME_TIMER.Remaining;
        stats.Date = DateTimeManager.DateTime.ToString();
        stats.TeamMembers = GetTeamMembers();
    }

    private static void SetImpossibleGameStats(Kitty kitty)
    {
        var stats = kitty.SaveData.BestGameTimes.ImpossibleGameTime;
        if (Globals.GAME_TIMER.Remaining > stats.Time && stats.Time != 0) return;
        stats.Time = Globals.GAME_TIMER.Remaining;
        stats.Date = DateTimeManager.DateTime.ToString();
        stats.TeamMembers = GetTeamMembers();
    }

    private static void SetNightmareGameStats(Kitty kitty)
    {
        var stats = kitty.SaveData.BestGameTimes.NightmareGameTime;
        if (Globals.GAME_TIMER.Remaining > stats.Time && stats.Time != 0) return;
        stats.Time = Globals.GAME_TIMER.Remaining;
        stats.Date = DateTimeManager.DateTime.ToString();
        stats.TeamMembers = GetTeamMembers();
    }

    private static string GetTeamMembers()
    {
        return string.Join(", ", Globals.ALL_PLAYERS.Where(player => player.Controller != mapcontrol.Computer).Select(player => player.Name));
    }
}
