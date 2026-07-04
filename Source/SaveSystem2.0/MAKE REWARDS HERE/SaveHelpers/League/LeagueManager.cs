using System;
using WCSharp.Api;
using static WCSharp.Api.Common;
public class LeagueManager
{
    public static LeagueManager Instance { get; private set; }
    public static readonly string CompiledSeasonID = "DoNotTouch"; // Set during compile time in Launcher/Program.cs
    public bool IsSeasonActive { get; set; } = false;

    private LeagueManager()
    {
        IsSeasonActive = !string.IsNullOrEmpty(CompiledSeasonID) && CompiledSeasonID != "DoNotTouch";
        CheckForOnlineOrLanGame();
    }

    public static void  Initialize()
    {
        if (Instance != null) return;
        Instance = new LeagueManager();
    }

    // In the event this causes desyncs.. We can use a CHEAT function and then evaluate resources. Cheats don't work in LAN or multiplayer. 
    private void CheckForOnlineOrLanGame()
    {
        if (!ReloadGameCachesFromDisk() || Source.Program.Debug)
        {
            Console.WriteLine("Online Game Detected, League Mode Enabled.");
            Utility.SimpleTimer(3.5f, () => AssignSeasonID());
            IsSeasonActive = true;

        }
        else
        {
            Console.WriteLine("League Stats Disabled in Single Player.");
            IsSeasonActive = false;
        }
    }

    private void AssignSeasonID()
    {
        foreach(var kitty in Globals.ALL_KITTIES_LIST)
        {
            var league = kitty.SaveData.LeagueSeasonData.SeasonID;
            if (league != CompiledSeasonID)
            {
                kitty.SaveData.LeagueSeasonData.ResetLeagueSeasonData();
            }
            kitty.SaveData.LeagueSeasonData.SeasonID = CompiledSeasonID;
        }
    }
}
