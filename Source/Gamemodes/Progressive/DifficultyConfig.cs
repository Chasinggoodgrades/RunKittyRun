public static class DifficultyConfig
{
    public static bool IsProgressive => Difficulty.DifficultyValue == (int)DifficultyLevel.Progressive;

    public static int GetVirtualRound(int progressiveRound)
    {
        if (!IsProgressive) return progressiveRound;
        
        return progressiveRound switch
        {
            1 => 3,
            2 => 4,
            3 => 5,
            _ => progressiveRound
        };
    }

    public static DifficultyLevel GetVirtualDifficulty(int progressiveRound)
    {
        if (!IsProgressive) return (DifficultyLevel)Difficulty.DifficultyValue;
        
        return progressiveRound switch
        {
            1 => DifficultyLevel.Normal,
            2 => DifficultyLevel.Hard,
            3 => DifficultyLevel.Impossible,
            _ => DifficultyLevel.Normal
        };
    }

    public static int GetVirtualDifficultyValue(int progressiveRound)
    {
        if (!IsProgressive) return Difficulty.DifficultyValue;
        
        return (int)GetVirtualDifficulty(progressiveRound);
    }

    public static int GetEffectiveDifficultyValue()
    {
        if (!IsProgressive) return Difficulty.DifficultyValue;
        return GetVirtualDifficultyValue(Globals.ROUND);
    }

    public static bool IsVirtualRound(int actualRound, int virtualRound)
    {
        if (!IsProgressive) return Globals.ROUND == actualRound;
        return GetVirtualRound(Globals.ROUND) == virtualRound;
    }

    public static bool IsVirtualDifficulty(DifficultyLevel difficulty)
    {
        if (!IsProgressive) return Difficulty.DifficultyValue >= (int)difficulty;
        return GetVirtualDifficultyValue(Globals.ROUND) >= (int)difficulty;
    }

    public static bool MeetsDifficultyRequirement(DifficultyLevel requiredDifficulty)
    {
        return IsVirtualDifficulty(requiredDifficulty);
    }
}
