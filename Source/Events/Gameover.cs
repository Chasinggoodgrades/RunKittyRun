using static WCSharp.Api.Common;
using WCSharp.Api;
using System;
public static class Gameover
{
    public static bool WinGame { get; set; } = false;
    private static float EndingTimer { get; set; } = 90.0f;
    public static bool GameOver()
    {
        if(WinningGame()) return true;
        if (LosingGameCheck()) return true;
        return false;
    }

    private static bool WinningGame()
    {
        if(!WinGame) return false;
        SendWinMessage();
        StandardWinChallenges();
        GameStats(true);
        SaveManager.SaveAll();
        Console.WriteLine($"{Colors.COLOR_GREEN}Stay a while for the end game awards!!");
        Utility.SimpleTimer(5.0f, PodiumManager.BeginPodiumEvents);
        return true;
    }

    private static void StandardWinChallenges()
    {
        if (Gamemode.CurrentGameMode != "Standard") return;
        Challenges.NecroWindwalk();
        Challenges.BlueFire();
        Challenges.PinkFire();
        Challenges.WhiteTendrils();
        Challenges.ZandalariKitty();
    }

    private static void LosingGame()
    {
        Wolf.RemoveAllWolves();
        GameStats(false);
        SaveManager.SaveAll();
        NotifyEndingGame();
    }

    private static void EndGame()
    {
        foreach(var player in Globals.ALL_PLAYERS)
            player.Remove(playergameresult.Victory);
    }

    private static bool LosingGameCheck()
    {
        if (Gamemode.CurrentGameMode != "Standard") return false; 
        foreach (var kitty in Globals.ALL_KITTIES.Values)
            if (kitty.Alive) return false;
        LosingGame();
        return true;
    }

    private static void SendWinMessage()
    {
        if(Gamemode.CurrentGameMode == "Standard")
            Console.WriteLine($"{Colors.COLOR_GREEN}Congratulations on winning the game on {Difficulty.DifficultyChosen}!{Colors.COLOR_RESET}");
        else
            Console.WriteLine($"{Colors.COLOR_GREEN}The game is over. Thank you for RKR on {Gamemode.CurrentGameMode}!{Colors.COLOR_RESET}");
    }

    /// <summary>
    /// True if the game is over and the kitties have won. False if they lost.
    /// </summary>
    /// <param name="win"></param>
    private static void GameStats(bool win)
    {
        foreach(var kitty in Globals.ALL_KITTIES.Values)
        {
            IncrementGameStats(kitty);
            if(win) IncrementWins(kitty);
        }
    }

    private static void IncrementGameStats(Kitty kitty)
    {
        var stats = kitty.SaveData.GameStats;
        switch (Difficulty.DifficultyValue)
        {
            case (int)DifficultyLevel.Normal:
                stats[StatTypes.NormalGames] += 1;
                break;
            case (int)DifficultyLevel.Hard:
                stats[StatTypes.HardGames] += 1;
                break;
            case (int)DifficultyLevel.Impossible:
                stats[StatTypes.ImpossibleGames] += 1;
                break;
        }
    }

    private static void IncrementWins(Kitty kitty)
    {
        var stats = kitty.SaveData.GameStats;
        switch (Difficulty.DifficultyValue)
        {
            case (int)DifficultyLevel.Normal:
                stats[StatTypes.NormalWins] += 1;
                break;
            case (int)DifficultyLevel.Hard:
                stats[StatTypes.HardWins] += 1;
                break;
            case (int)DifficultyLevel.Impossible:
                stats[StatTypes.ImpossibleWins] += 1;
                break;
        }
    }

    public static void NotifyEndingGame()
    {
        DiscordFrame.Initialize();
        Utility.TimedTextToAllPlayers(EndingTimer, $"{Colors.COLOR_YELLOW}The game will end in {EndingTimer} seconds.{Colors.COLOR_RESET}");
        Globals.GAME_ACTIVE = false;
        Utility.SimpleTimer(EndingTimer, EndGame);
    }
}