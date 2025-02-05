using WCSharp.Api;
using System;

public static class Gameover
{
    public static bool WinGame { get; set; } = false;
    private static float EndingTimer { get; set; } = 90.0f;
    public static bool NoEnd { get; set; } = false;
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
        GameStats(true);
        StandardWinChallenges();
        Utility.SimpleTimer(0.5f, () => SaveManager.SaveAll());
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
        Challenges.FreezeAura();
        Challenges.PrismaticAura();
    }

    private static void LosingGame()
    {
        Wolf.RemoveAllWolves();
        GameStats(false);
        Utility.SimpleTimer(0.5f, () => SaveManager.SaveAll());
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
        if (NoEnd) return false;
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
            IncrementWinStreak(kitty, win);
        }
    }

    private static void IncrementGameStats(Kitty kitty)
    {
        if (Gamemode.CurrentGameMode != "Standard") return;
        var stats = kitty.SaveData.GameStats;
        switch (Difficulty.DifficultyValue)
        {
            case (int)DifficultyLevel.Normal:
                stats.NormalGames += 1;
                break;
            case (int)DifficultyLevel.Hard:
                stats.HardGames += 1;
                break;
            case (int)DifficultyLevel.Impossible:
                stats.ImpossibleGames += 1;
                break;
        }
    }

    private static void IncrementWins(Kitty kitty)
    {
        if (Gamemode.CurrentGameMode != "Standard") return;
        var stats = kitty.SaveData.GameStats;
        switch (Difficulty.DifficultyValue)
        {
            case (int)DifficultyLevel.Normal:
                stats.NormalWins += 1;
                break;
            case (int)DifficultyLevel.Hard:
                stats.HardWins += 1;
                break;
            case (int)DifficultyLevel.Impossible:
                stats.ImpossibleWins += 1;
                break;
        }
    }

    private static void IncrementWinStreak(Kitty kitty, bool win)
    {
        if (Gamemode.CurrentGameMode != "Standard") return;
        var stats = kitty.SaveData.GameStats;

        if (win)
        {
            stats.WinStreak += 1;
            if (stats.WinStreak > stats.HighestWinStreak)
                stats.HighestWinStreak = stats.WinStreak;
        }
        else
        {
            stats.WinStreak = 0;
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