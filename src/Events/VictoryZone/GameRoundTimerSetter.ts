//
//
//
//

//class GameRoundTimerSetter
//{
//    public static SetRoundTime(player player)
//    {
//        string difficultyString = GetDifficultyProperty();
//        string roundString = GetRoundDataProperty(difficultyString);

//        let saveData = Globals.ALL_KITTIES[player].SaveData.BestGameTimes;

//        let difficultyProperty = saveData.GetType().GetProperty(difficultyString);
//        let difficultyData = difficultyProperty.GetValue(saveData);
//        let roundProperty = difficultyData.GetType().GetProperty(roundString.split('.').Last());
//        let roundTimeValue = roundProperty.GetValue(difficultyData);

//        Console.WriteLine("Round Time for {difficultyString} - {Globals.ROUND}: {roundTimeValue}");
//    }

//    private static string GetDifficultyProperty()
//    {
//        switch (Difficulty.DifficultyValue)
//        {
//            case DifficultyLevel.Normal:
//                return nameof(Globals.SAVE_GAME_ROUND_DATA.NormalGameTime);
//            case DifficultyLevel.Hard:
//                return nameof(Globals.SAVE_GAME_ROUND_DATA.HardGameTime);
//            case DifficultyLevel.Impossible:
//                return nameof(Globals.SAVE_GAME_ROUND_DATA.ImpossibleGameTime);
//            default:
//                throw new ArgumentOutOfRangeError(nameof(Difficulty.DifficultyValue), "Invalid difficulty level");
//        }
//    }

//    private static string GetRoundDataProperty(string propertyName)
//    {
//        switch (Globals.ROUND)
//        {
//            case 1:
//                return "{propertyName}.RoundOneTime";
//            case 2:
//                return "{propertyName}.RoundTwoTime";
//            case 3:
//                return "{propertyName}.RoundThreeTime";
//            case 4:
//                return "{propertyName}.RoundFourTime";
//            case 5:
//                return "{propertyName}.RoundFiveTime";
//            default:
//                throw new ArgumentOutOfRangeError(nameof(Globals.ROUND), "Invalid round number");
//        }
//    }
//}
