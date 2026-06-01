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
        GameoverUtil.SetColorData();
        GameoverUtil.SetBestGameStats();
        GameoverUtil.SetFriendData();
        StandardWinChallenges();
        SaveGame();
        Console.WriteLine($"{Colors.COLOR_GREEN}Stay a while for the end game awards!!{Colors.COLOR_RESET}");
        Utility.SimpleTimer(5.0f, PodiumManager.BeginPodiumEvents);
        return true;
    }

    private static void StandardWinChallenges()
    {
        if (Gamemode.CurrentGameMode != GameMode.Standard) return;
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
        GameoverUtil.SetColorData();
        GameoverUtil.SetFriendData();
        GameStats(false);
        SaveGame();
        NotifyEndingGame();
    }

    private static void SaveGame()
    {
        Utility.SimpleTimer(1.5f, SaveManager.SaveAll);
        Utility.SimpleTimer(2.5f, SaveManager.SaveAllDataToFile);
    }

    private static void EndGame()
    {
        foreach (var player in Globals.ALL_PLAYERS)
            Blizzard.CustomVictoryBJ(player, true, true);
    }

    private static bool LosingGameCheck()
    {
        if (Gamemode.CurrentGameMode != GameMode.Standard) return false;
        if (NoEnd) return false;

        for(int i = 0; i < Globals.ALL_PLAYERS.Count; i++)
        {
            var kitty = Globals.ALL_KITTIES[Globals.ALL_PLAYERS[i]];
            if (kitty.Alive) return false;
        }
        LosingGame();
        return true;
    }

    private static void SendWinMessage()
    {
        if (Gamemode.CurrentGameMode == GameMode.Standard)
            Console.WriteLine($"{Colors.COLOR_GREEN}Congratulations on winning the game on {Difficulty.DifficultyOption.ToString()}!{Colors.COLOR_RESET}");
        else
            Console.WriteLine($"{Colors.COLOR_GREEN}The game is over. Thank you for playing RKR on {Gamemode.CurrentGameMode}!{Colors.COLOR_RESET}");
    }

    /// <summary>
    /// True if the game is over and the kitties have won. False if they lost.
    /// </summary>
    /// <param name="win"></param>
    private static void GameStats(bool win)
    {
        var difficulty = (DifficultyLevel)Difficulty.DifficultyValue;
        foreach (var kitty in Globals.ALL_KITTIES)
        {
            if (win) StatManager.IncrementWin(kitty.Value, difficulty);
            StatManager.IncrementWinStreak(kitty.Value, win);
        }
        AwardManager.AwardGameStatRewards();
    }

    public static void NotifyEndingGame()
    {
        DiscordFrame.Initialize();
        Utility.TimedTextToAllPlayers(EndingTimer, $"{Colors.COLOR_YELLOW}The game will end in {EndingTimer} seconds.{Colors.COLOR_RESET}");
        Globals.GAME_ACTIVE = false;
        Utility.SimpleTimer(EndingTimer, EndGame);
    }
}
