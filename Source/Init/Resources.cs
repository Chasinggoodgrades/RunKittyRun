using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

public static class Resources
{
    public static int StartingGold { get; set; } = 100;
    public static int SaveExperience { get; set; } = 80;
    public static int SafezoneExperience { get; set; } = 95;
    public static int SafezoneGold { get; set; } = 20;
    public static void Initialize()
    {
        AdjustStartingGold();
    }

    private static void AdjustStartingGold()
    {
        foreach(var player in Globals.ALL_PLAYERS)
        {
            player.Gold = StartingGold;
        }
    }

    private static void ExperienceTable()
    {

    }

    private static void AddShopItems()
    {

    }
}
