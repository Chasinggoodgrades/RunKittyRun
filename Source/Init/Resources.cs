using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

public static class Resources
{
    public static int StartingGold { get; set; } = 100;
    public static int SaveExperience { get; set; } = 80;
    public static int SaveGold { get; set; } = 25;
    public static int SafezoneExperience { get; set; } = 100;
    public static int SafezoneGold { get; set; } = 20;
    public static void Initialize()
    {
        SetResourcesForGamemode();
        AdjustStartingGold();
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
        SaveExperience = 80;
        SaveGold = 25;
    }

    private static void SoloResources()
    {
        SaveExperience = 0;
        SaveGold = 0;
    }

    private static void TeamResources()
    {
        SaveExperience = 15;
        SaveGold = 0;
    }
}
