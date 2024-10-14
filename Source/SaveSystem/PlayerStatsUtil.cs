using WCSharp.Api;

public static class PlayerStatsUtil
{
    public static int GetPlayerGames(unit u)
    {
        var currentDiff = Difficulty.DifficultyValue;
        var kittyData = Globals.ALL_KITTIES[u.Owner].SaveData.GameStats;
        switch (currentDiff)
        {
            case (int)DifficultyLevel.Normal:
                return kittyData[StatTypes.NormalGames];
            case (int)DifficultyLevel.Hard:
                return kittyData[StatTypes.HardGames];
            case (int)DifficultyLevel.Impossible:
                return kittyData[StatTypes.ImpossibleGames];
            default:
                return 0;
        }
    }
}