using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

public static class Resources
{
    private static int StartingGold { get; set; } = 100;
    public static int SaveExperience { get; set; } = 80;
    public static int SaveGold { get; set; } = 25;
    public static int SafezoneExperience { get; set; } = 100;
    public static int SafezoneGold { get; set; } = 20;
    private static int EndRoundBonusGold { get; set; } = 150 + (50*Globals.ROUND);
    private static int EndRoundBonusXP { get; set; } = (550*Globals.ROUND);
    public static void Initialize()
    {
        SetResourcesForGamemode();
        AdjustStartingGold();
    }

    public static void BonusResources()
    {
        foreach(var player in Globals.ALL_PLAYERS)
            player.Gold += EndRoundBonusGold;
        foreach(var kitty in Globals.ALL_KITTIES.Values)
            kitty.Unit.Experience += EndRoundBonusXP;
    }
    public static void StartingItems(Kitty kitty)
    {
        var unit = kitty.Unit;
        if (Gamemode.CurrentGameMode == "Standard") unit.AddItem(Constants.ITEM_ADRENALINE_POTION);
    }

    private static void AdjustStartingGold()
    {
        foreach(var player in Globals.ALL_PLAYERS)
        {
            player.Gold = StartingGold;
        }
    }

    private static void SetResourcesForGamemode()
    {
        if(Gamemode.CurrentGameMode == Globals.GAME_MODES[0]) StandardResources();
        else if(Gamemode.CurrentGameMode == Globals.GAME_MODES[1]) SoloResources();
        else if(Gamemode.CurrentGameMode == Globals.GAME_MODES[2]) TeamResources();
    }

    private static void StandardResources()
    {
        StartingGold = 200;
        SaveExperience = 80;
        SaveGold = 25;
    }

    private static void SoloResources()
    {
        SaveExperience = 0;
        SaveGold = 0;
        EndRoundBonusXP = 0;
    }

    private static void TeamResources()
    {
        SaveExperience = 15;
        SaveGold = 5;
        EndRoundBonusXP = 0;
    }
}
