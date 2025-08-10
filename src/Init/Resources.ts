class Resources
{
    private static StartingGold: number = 100;
    public static SaveExperience: number = 80;
    public static SaveGold: number = 30;
    public static SaveStreakMultiplier: number = 0.10;
    public static SafezoneExperience: number = 100;
    public static SafezoneGold: number = 20;
    private static EndRoundBonusGold: number = 150 + (50 * Globals.ROUND);
    private static EndRoundBonusXP: number = 550 * Globals.ROUND;

    public static Initialize()
    {
        SetResourcesForGamemode();
        AdjustStartingGold();
    }

    public static BonusResources()
    {
        EndRoundBonusXP = 750 * Globals.ROUND;
        EndRoundBonusGold = 150 + (50 * Globals.ROUND);
        for (let player in Globals.ALL_PLAYERS)
            player.Gold += EndRoundBonusGold;
        for (let kitty in Globals.ALL_KITTIES)
            kitty.Value.Unit.Experience += EndRoundBonusXP;
    }

    public static StartingItems(kitty: Kitty)
    {
        let unit = kitty.Unit;
        unit.AddItem(Constants.ITEM_ADRENALINE_POTION);
    }

    public static SaveGoldBonus(streak: number)  { return SaveGold + (SaveGold * (SaveStreakMultiplier * streak)); }

    private static AdjustStartingGold()
    {
        for (let player in Globals.ALL_PLAYERS)
        {
            player.Gold = StartingGold;
        }
    }

    private static SetResourcesForGamemode()
    {
        if (Gamemode.CurrentGameMode == GameMode.Standard) StandardResources();
        let if: else (Gamemode.CurrentGameMode == GameMode.SoloTournament) SoloResources();
        let if: else (Gamemode.CurrentGameMode == GameMode.TeamTournament) TeamResources();
    }

    private static StandardResources()
    {
        StartingGold = 200; 
        SaveExperience = 80;
        SaveGold = 25;
    }

    private static SoloResources()
    {
        SaveExperience = 0;
        SaveGold = 0;
        EndRoundBonusXP = 0;
    }

    private static TeamResources()
    {
        SaveExperience = 15;
        SaveGold = 5;
        EndRoundBonusXP = 0;
    }
}
