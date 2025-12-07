/*using System;
using System.Linq;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class GameRoundTimerSetter
{
    public static void SetRoundTime(player player)
    {
        string difficultyString = GetDifficultyProperty();
        string roundString = GetRoundDataProperty(difficultyString);

        var saveData = Globals.ALL_KITTIES[player].SaveData.BestGameTimes;

        var difficultyProperty = saveData.GetType().GetProperty(difficultyString);
        var difficultyData = difficultyProperty.GetValue(saveData);
        var roundProperty = difficultyData.GetType().GetProperty(roundString.Split('.').Last());
        var roundTimeValue = roundProperty.GetValue(difficultyData);

        Console.WriteLine($"Round Time for {difficultyString} - {Globals.ROUND}: {roundTimeValue}");
    }


    private static string GetDifficultyProperty()
    {
        switch (Difficulty.DifficultyValue)
        {
            case (int)DifficultyLevel.Normal:
                return nameof(Globals.SAVE_GAME_ROUND_DATA.NormalGameTime);
            case (int)DifficultyLevel.Hard:
                return nameof(Globals.SAVE_GAME_ROUND_DATA.HardGameTime);
            case (int)DifficultyLevel.Impossible:
                return nameof(Globals.SAVE_GAME_ROUND_DATA.ImpossibleGameTime);
            default:
                throw new ArgumentOutOfRangeException(nameof(Difficulty.DifficultyValue), "Invalid difficulty level");
        }
    }

    private static string GetRoundDataProperty(string propertyName)
    {
        switch (Globals.ROUND)
        {
            case 1:
                return $"{propertyName}.RoundOneTime";
            case 2:
                return $"{propertyName}.RoundTwoTime";
            case 3:
                return $"{propertyName}.RoundThreeTime";
            case 4:
                return $"{propertyName}.RoundFourTime";
            case 5:
                return $"{propertyName}.RoundFiveTime";
            default:
                throw new ArgumentOutOfRangeException(nameof(Globals.ROUND), "Invalid round number");
        }
    }
}
*/
