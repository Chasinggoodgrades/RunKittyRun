using System;
using WCSharp.Api;

public class LeagueManager
{
    public static LeagueManager Instance { get; private set; }
    public readonly string CompiledSeasonID = "PreSeason0"; // Set during compile time in Launcher/Program.cs
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

    private void CheckForOnlineOrLanGame()
    {
        var count = Globals.ALL_PLAYERS.Count;
        if (count < 2)
        {
            Console.WriteLine($"{Colors.COLOR_YELLOW}Not enough players to start a League game. League features disabled.{Colors.COLOR_RESET}");
            IsSeasonActive = false;
            return;
        }
        for (int i = 0; i < count; i++)
        {
            var player = Globals.ALL_PLAYERS[i];
            if (player == null) continue;
            if (player.Controller == mapcontrol.Computer)
            {
                Console.WriteLine($"{Colors.COLOR_YELLOW}Computer player detected. League features disabled.{Colors.COLOR_RESET}");
                IsSeasonActive = false;
                return;
            }
        }
    }
}
