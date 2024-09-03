using WCSharp.Api;
using static WCSharp.Api.Common;
public static class RewardChecker
{


    private static void RewardCheckGameStats(player player)
    {
        var kitty = Globals.ALL_KITTIES[player];
        var stats = kitty.SaveData;
        var saves = stats.Saves;
        var saveStreak = stats.SaveStreak;
        var games = stats.NormalGames + stats.HardGames + stats.ImpossibleGames;
        var wins = stats.Wins;
        var winStreak = stats.WinStreak;
    }

    /// <summary>
    /// Checks if the player has reached a certain save / savestreak threshold.
    /// Use <typeparamref name="Kitty"/> or <typeparamref name="player"/>. 
    /// </summary>
    /// <typeparam name="T"></typeparam>
    /// <param name="player"></param>
    public static void RewardCheckSaves<T>(T player)
    {
        if(player is player)
        {
            var kitty = Globals.ALL_KITTIES[player as player];
            var stats = kitty.SaveData;
            var saves = stats.Saves;
            var saveStreak = stats.SaveStreak;
        }
        else if(player is Kitty)
        {
            var kitty = player as Kitty;
            var stats = kitty.SaveData;
            var saves = stats.Saves;
            var saveStreak = stats.SaveStreak;
        }
    }

}