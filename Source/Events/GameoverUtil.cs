using System;
using System.Collections.Generic;
using System.Linq;
using WCSharp.Api;

public static class GameoverUtil
{
    public static void SetBestGameStats()
    {
        var difficulty = (DifficultyLevel)Difficulty.DifficultyValue;
        var gameTime = GetOverallGameTime();
        var teamMembers = GetTeamMembers();
        foreach (var kitty in Globals.ALL_KITTIES.Values)
        {
            StatManager.UpdateLifetimeBestGameTime(kitty, difficulty, gameTime, teamMembers);
            StatManager.UpdateLifetimeBestRoundTimes(kitty, difficulty, gameTime);
            StatManager.UpdateLeagueBestGameTime(kitty, difficulty, gameTime);
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

    private static string GetTeamMembers()
    {
        return string.Join(", ", Globals.ALL_PLAYERS.Where(player => player.Controller != mapcontrol.Computer).Select(player => player.Name));
    }

    /// <summary>
    /// Sums finished round times for the current game. Used as the overall game time.
    /// </summary>
    public static float GetOverallGameTime()
    {
        var total = 0.0f;
        for (int i = 1; i <= Gamemode.NumberOfRounds; i++)
            total += GameTimer.FinishedTimes[i];
        return total;
    }



}
