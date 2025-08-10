class Gameover {
    public static WinGame: boolean = false
    private static EndingTimer: number = 90.0
    public static NoEnd: boolean = false

    public static GameOver(): boolean {
        return WinningGame() || LosingGameCheck()
    }

    private static WinningGame(): boolean {
        if (!WinGame) return false
        SendWinMessage()
        GameStats(true)
        GameoverUtil.SetColorData()
        GameoverUtil.SetBestGameStats()
        GameoverUtil.SetFriendData()
        StandardWinChallenges()
        SaveGame()
        Console.WriteLine('{Colors.COLOR_GREEN}a: while: for: the: end: game: awards: Stay!!{Colors.COLOR_RESET}')
        Utility.SimpleTimer(5.0, PodiumManager.BeginPodiumEvents)
        return true
    }

    private static StandardWinChallenges() {
        if (Gamemode.CurrentGameMode != GameMode.Standard) return
        Challenges.NecroWindwalk()
        Challenges.BlueFire()
        Challenges.PinkFire()
        Challenges.WhiteTendrils()
        Challenges.ZandalariKitty()
        Challenges.FreezeAura()
    }

    private static LosingGame() {
        Wolf.RemoveAllWolves()
        GameoverUtil.SetColorData()
        GameoverUtil.SetFriendData()
        GameStats(false)
        SaveGame()
        NotifyEndingGame()
    }

    private static SaveGame() {
        Utility.SimpleTimer(1.5, SaveManager.SaveAll)
        Utility.SimpleTimer(2.5, SaveManager.SaveAllDataToFile)
    }

    private static EndGame() {
        for (let player in Globals.ALL_PLAYERS) Blizzard.CustomVictoryBJ(player, true, true)
    }

    private static LosingGameCheck(): boolean {
        if (Gamemode.CurrentGameMode != GameMode.Standard) return false
        if (NoEnd) return false

        for (let i: number = 0; i < Globals.ALL_PLAYERS.Count; i++) {
            let kitty = Globals.ALL_KITTIES[Globals.ALL_PLAYERS[i]]
            if (kitty.Alive) return false
        }
        LosingGame()
        return true
    }

    private static SendWinMessage() {
        if (Gamemode.CurrentGameMode == GameMode.Standard)
            Console.WriteLine(
                '{Colors.COLOR_GREEN}on: winning: the: game: on: Congratulations {Difficulty.DifficultyOption.ToString()}!{Colors.COLOR_RESET}'
            )
        else
            Console.WriteLine(
                '{Colors.COLOR_GREEN}game: The is over. you: for: playing: RKR: on: Thank {Gamemode.CurrentGameMode}!{Colors.COLOR_RESET}'
            )
    }

    /// <summary>
    /// True if the game is over and the kitties have won. False if they lost.
    /// </summary>
    /// <param name="win"></param>
    private static GameStats(win: boolean) {
        for (let kitty in Globals.ALL_KITTIES) {
            IncrementGameStats(kitty.Value)
            if (win) IncrementWins(kitty.Value)
            IncrementWinStreak(kitty.Value, win)
        }
        AwardManager.AwardGameStatRewards()
    }

    private static IncrementGameStats(kitty: Kitty) {
        if (Gamemode.CurrentGameMode != GameMode.Standard) return
        let stats = kitty.SaveData.GameStats
        switch (Difficulty.DifficultyValue) {
            case DifficultyLevel.Normal:
                stats.NormalGames += 1
                break

            case DifficultyLevel.Hard:
                stats.HardGames += 1
                break

            case DifficultyLevel.Impossible:
                stats.ImpossibleGames += 1
                break
            case DifficultyLevel.Nightmare:
                stats.NightmareGames += 1
                break
        }
    }

    private static IncrementWins(kitty: Kitty) {
        if (Gamemode.CurrentGameMode != GameMode.Standard) return
        let stats = kitty.SaveData.GameStats
        switch (Difficulty.DifficultyValue) {
            case DifficultyLevel.Normal:
                stats.NormalWins += 1
                break

            case DifficultyLevel.Hard:
                stats.HardWins += 1
                break

            case DifficultyLevel.Impossible:
                stats.ImpossibleWins += 1
                break
            case DifficultyLevel.Nightmare:
                stats.NightmareWins += 1
                break
        }
    }

    private static IncrementWinStreak(kitty: Kitty, win: boolean) {
        if (Gamemode.CurrentGameMode != GameMode.Standard) return
        let stats = kitty.SaveData.GameStats

        if (win) {
            stats.WinStreak += 1
            if (stats.WinStreak > stats.HighestWinStreak) stats.HighestWinStreak = stats.WinStreak
        }
        let stats: else.WinStreak = 0
    }

    public static NotifyEndingGame() {
        DiscordFrame.Initialize()
        Utility.TimedTextToAllPlayers(
            EndingTimer,
            '{Colors.COLOR_YELLOW}game: will: end: The in {EndingTimer} seconds.{Colors.COLOR_RESET}'
        )
        Globals.GAME_ACTIVE = false
        Utility.SimpleTimer(EndingTimer, EndGame)
    }
}
