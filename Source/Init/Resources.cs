public static class Resources
{
    public static int StartingGold { get; set; } = 100;
    public static int SaveExperience { get; set; } = 80;
    public static int SaveGold { get; set; } = 30;
    public static float SaveStreakMultiplier { get; set; } = 0.10f;
    public static int SafezoneExperience { get; set; } = 100;
    public static int SafezoneGold { get; set; } = 20;

    private static int CalculateEndRoundBonusGold()
    {
        return 150 + (50 * Globals.ROUND);
    }

    private static int CalculateEndRoundBonusXP()
    {
        var baseXP = 750 * Globals.ROUND; // 7500 total xp for r1,r2,r3,r4
        
        if (Difficulty.DifficultyValue == (int)DifficultyLevel.Progressive)
        {
            return (int)(baseXP * 3.34f); // 7515 total xp for r1 and r2
        }
        
        if (Gamemode.CurrentGameMode == GameMode.Solo || 
            Gamemode.CurrentGameMode == GameMode.Team)
        {
            return baseXP;
        }
        
        return baseXP;
    }

    public static void Initialize()
    {
        SetResourcesForGamemode();
        if (Gamemode.CurrentGameMode == GameMode.Standard) return;
        AdjustStartingGold();
    }

    public static void BonusResources()
    {
        var bonusGold = CalculateEndRoundBonusGold();
        var bonusXP = CalculateEndRoundBonusXP();
        
        foreach (var player in Globals.ALL_PLAYERS)
            player.Gold += bonusGold;
        foreach (var kitty in Globals.ALL_KITTIES_LIST)
            kitty.Unit.Experience += bonusXP;
    }

    public static void StartingItems(Kitty kitty)
    {
        var unit = kitty.Unit;
        unit.AddItem(Constants.ITEM_ADRENALINE_POTION);
    }

    public static int SaveGoldBonus(int streak) => SaveGold + (int)(SaveGold * (SaveStreakMultiplier * streak));

    private static void AdjustStartingGold()
    {
        foreach (var player in Globals.ALL_PLAYERS)
        {
            player.Gold = StartingGold;
        }
    }

    private static void SetResourcesForGamemode()
    {
        if (Gamemode.CurrentGameMode == GameMode.Standard) StandardResources();
        else if (Gamemode.CurrentGameMode == GameMode.Solo) SoloResources();
        else if (Gamemode.CurrentGameMode == GameMode.Team) TeamResources();
    }

    /// <summary>
    /// Progressive mode since it's a faster mode will have more resources to compensate for faster pace. 
    /// </summary>
    private static void StandardResources()
    {
        var timer = ObjectPool<AchesTimers>.GetEmptyObject();

        timer.Timer.Start(0.25f, true, () =>
        {

            if (!Difficulty.IsDifficultyChosen) return;

            if (Difficulty.DifficultyValue == (int)DifficultyLevel.Progressive)
            {
                StartingGold = 350;
                SaveExperience = 95;
                SaveGold = 40;
                SafezoneExperience = 167; // 7014 total xp for 3 rounds
            }
            else
            {
                StartingGold = 200;
                SaveExperience = 80;
                SaveGold = 25;
                SafezoneExperience = 100; // 7000 total xp for 5 rounds
            }
            AdjustStartingGold();

            timer?.Pause();
            timer?.Dispose();
        });
    }

    private static void SoloResources()
    {
        SaveExperience = 0;
        SaveGold = 0;
        SafezoneExperience = 100;
    }

    private static void TeamResources()
    {
        StartingGold = 200;
        SaveExperience = 55;
        SaveGold = 15;
        SafezoneExperience = 100;
    }
}
