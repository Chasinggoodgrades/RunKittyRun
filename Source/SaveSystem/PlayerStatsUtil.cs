using WCSharp.Api;

public static class PlayerStatsUtil
{
    /// <summary>
    /// Returns the total number of games played by the player regardless of difficulty.
    /// </summary>
    /// <param name="u"></param>
    /// <returns></returns>
    public static int GetPlayerGames(unit u)
    {
        var currentDiff = Difficulty.DifficultyValue;
        var kittyData = Globals.ALL_KITTIES[u.Owner].SaveData.GameStats;
        switch (currentDiff)
        {
            case (int)DifficultyLevel.Normal:
                return kittyData.NormalGames;
            case (int)DifficultyLevel.Hard:
                return kittyData.HardGames;
            case (int)DifficultyLevel.Impossible:
                return kittyData.ImpossibleGames;
            default:
                return 0;
        }
    }
}