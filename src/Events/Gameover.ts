import { Kitty } from 'src/Game/Entities/Kitty/Kitty'
import { Wolf } from 'src/Game/Entities/Wolf'
import { PodiumManager } from 'src/Game/Podium/PodiumManager'
import { PodiumUtil } from 'src/Game/Podium/PodiumUtil'
import { CurrentGameMode } from 'src/Gamemodes/CurrentGameMode'
import { GameMode } from 'src/Gamemodes/GameModeEnum'
import { Globals } from 'src/Global/Globals'
import { Difficulty } from 'src/Init/Difficulty/Difficulty'
import { DifficultyLevel } from 'src/Init/Difficulty/DifficultyOption'
import { Challenges } from 'src/Rewards/Challenges/Challenges'
import { AwardManager } from 'src/Rewards/Rewards/AwardManager'
import { SaveManager } from 'src/SaveSystem2.0/SaveManager'
import { Colors } from 'src/Utility/Colors/Colors'
import { Utility } from 'src/Utility/Utility'
import { GameoverUtil } from './GameoverUtil'

export class Gameover {
    public static NoEnd: boolean = false

    public static GameOver(): boolean {
        return Gameover.WinningGame() || Gameover.LosingGameCheck()
    }

    private static WinningGame(): boolean {
        if (!Globals.WinGame) return false
        Gameover.SendWinMessage()
        Gameover.GameStats(true)
        GameoverUtil.SetColorData()
        GameoverUtil.SetBestGameStats()
        GameoverUtil.SetFriendData()
        Gameover.StandardWinChallenges()
        Gameover.SaveGame()
        print(`${Colors.COLOR_GREEN}Stay a while for the end game awards!!${Colors.COLOR_RESET}`)
        Utility.SimpleTimer(5.0, PodiumManager.BeginPodiumEvents)
        return true
    }

    private static StandardWinChallenges = () => {
        if (CurrentGameMode.active !== GameMode.Standard) return
        Challenges.NecroWindwalk()
        Challenges.BlueFire()
        Challenges.PinkFire()
        Challenges.WhiteTendrils()
        Challenges.ZandalariKitty()
        Challenges.FreezeAura()
    }

    private static LosingGame = () => {
        Wolf.RemoveAllWolves()
        GameoverUtil.SetColorData()
        GameoverUtil.SetFriendData()
        Gameover.GameStats(false)
        Gameover.SaveGame()
        PodiumUtil.NotifyEndingGame()
    }

    private static SaveGame = () => {
        Utility.SimpleTimer(1.5, SaveManager.SaveAll)
        Utility.SimpleTimer(2.5, SaveManager.SaveAllDataToFile)
    }

    private static EndGame = () => {
        for (const player of Globals.ALL_PLAYERS) CustomVictoryBJ(player.handle, true, true)
    }

    private static LosingGameCheck(): boolean {
        if (CurrentGameMode.active !== GameMode.Standard) return false
        if (Gameover.NoEnd) return false

        for (let i = 0; i < Globals.ALL_PLAYERS.length; i++) {
            const kitty = Globals.ALL_KITTIES.get(Globals.ALL_PLAYERS[i])!
            if (kitty.isAlive()) return false
        }
        Gameover.LosingGame()
        return true
    }

    private static SendWinMessage = () => {
        if (CurrentGameMode.active === GameMode.Standard)
            print(
                `${Colors.COLOR_GREEN}Congratulations on winning the game on ${Difficulty.DifficultyOption.toString()}!${Colors.COLOR_RESET}`
            )
        else
            print(
                `${Colors.COLOR_GREEN}The game is over. Thank you for playing RKR on ${CurrentGameMode.active}!${Colors.COLOR_RESET}`
            )
    }

    /// <summary>
    /// True if the game is over and the kitties have won. False if they lost.
    /// </summary>
    /// <param name="win"></param>
    private static GameStats = (win: boolean) => {
        for (const [_, kitty] of Globals.ALL_KITTIES) {
            Gameover.IncrementGameStats(kitty)
            if (win) Gameover.IncrementWins(kitty)
            Gameover.IncrementWinStreak(kitty, win)
        }
        AwardManager.AwardGameStatRewards()
    }

    private static IncrementGameStats = (kitty: Kitty) => {
        if (CurrentGameMode.active !== GameMode.Standard) return
        const stats = kitty.SaveData.GameStats
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

    private static IncrementWins = (kitty: Kitty) => {
        if (CurrentGameMode.active !== GameMode.Standard) return
        const stats = kitty.SaveData.GameStats
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

    private static IncrementWinStreak = (kitty: Kitty, win: boolean) => {
        if (CurrentGameMode.active !== GameMode.Standard) return
        const stats = kitty.SaveData.GameStats

        if (win) {
            stats.WinStreak += 1
            if (stats.WinStreak > stats.HighestWinStreak) stats.HighestWinStreak = stats.WinStreak
        } else stats.WinStreak = 0
    }
}
