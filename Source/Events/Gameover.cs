using System;
using WCSharp.Api;

public static class Gameover
{
    public static bool WinGame { get; set; } = false;
    private static float EndingTimer { get; set; } = 90.0f;
    public static bool NoEnd { get; set; } = false;
    public static bool GameOver()
    {
        return WinningGame() || LosingGameCheck();
    }

    private static bool WinningGame()
    {
        if (!WinGame) return false;
        SendWinMessage();
        GameStats(true);
        GameoverUtil.SetBestGameStats();
        StandardWinChallenges();
        SaveGame();
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
    }

    private static void LosingGame()
    {
        Wolf.RemoveAllWolves();
        GameStats(false);
        SaveGame();
        NotifyEndingGame();
    }

    private static void SaveGame()
    {
        Utility.SimpleTimer(1.5f, () => SaveManager.SaveAll());
        Utility.SimpleTimer(2.5f, () => SaveManager.SaveAllDataToFile());
    }

    private static void EndGame()
    {
        foreach (var player in Globals.ALL_PLAYERS)
            Blizzard.CustomVictoryBJ(player, true, true);
    }

    private static bool LosingGameCheck()
    {
        if (Gamemode.CurrentGameMode != "Standard") return false;
        if (NoEnd) return false;
        foreach (var kitty in Globals.ALL_KITTIES)
            if (kitty.Value.Alive) return false;
        LosingGame();
        return true;
    }

    private static void SendWinMessage()
    {
        if (Gamemode.CurrentGameMode == "Standard")
            Console.WriteLine($"{Colors.COLOR_GREEN}Congratulations on winning the game on {Difficulty.DifficultyChosen}!{Colors.COLOR_RESET}");
        else
            Console.WriteLine($"{Colors.COLOR_GREEN}The game is over. Thank you for playing RKR on {Gamemode.CurrentGameMode}!{Colors.COLOR_RESET}");
    }

    /// <summary>
    /// True if the game is over and the kitties have won. False if they lost.
    /// </summary>
    /// <param name="win"></param>
    private static void GameStats(bool win)
    {
        foreach (var kitty in Globals.ALL_KITTIES)
        {
            IncrementGameStats(kitty.Value);
            if (win) IncrementWins(kitty.Value);
            IncrementWinStreak(kitty.Value, win);
        }
        AwardManager.AwardGameStatRewards();
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
        else stats.WinStreak = 0;
    }

    public static void NotifyEndingGame()
    {
        DiscordFrame.Initialize();
        Utility.TimedTextToAllPlayers(EndingTimer, $"{Colors.COLOR_YELLOW}The game will end in {EndingTimer} seconds.{Colors.COLOR_RESET}");
        Globals.GAME_ACTIVE = false;
        Utility.SimpleTimer(EndingTimer, EndGame);
    }
}