import { PersonalBestAwarder } from 'src/Game/Podium/PersonalBestAwarder'
import { Gamemode } from 'src/Gamemodes/Gamemode'
import { GameMode } from 'src/Gamemodes/GameModeEnum'
import { Resources } from 'src/Init/Resources'
import { Challenges } from 'src/Rewards/Challenges/Challenges'
import { DeathlessChallenges } from 'src/Rewards/Challenges/DeathlessChallenges'
import { SoloMultiboard } from 'src/UI/Multiboard/SoloMultiboard'
import { Kitty } from './Kitty'

export class KittyStatsManager {
    private Kitty: Kitty

    public constructor(kitty: Kitty) {
        this.Kitty = kitty
    }

    /// <summary>
    /// Updates the resources of the savior kitty then calls to update their save stats data.
    /// </summary>
    /// <param name="savior"></param>
    public UpdateSaviorStats(savior: Kitty) {
        savior.Player.addGold(Resources.SaveGoldBonus(savior.CurrentStats.SaveStreak))
        savior.Unit.experience += Resources.SaveExperience
        SaveStatUpdate(savior)
    }

    /// <summary>
    /// This is called whenever the kitty dies, updating their death stats, resetting save streak, and deathless progress.
    /// </summary>
    public DeathStatUpdate() {
        DeathlessChallenges.ResetPlayerDeathless(Kitty)
        Kitty.CurrentStats.TotalDeaths += 1
        Kitty.CurrentStats.RoundDeaths += 1
        Kitty.CurrentStats.SaveStreak = 0
        Kitty.SaveData.GameStats.SaveStreak = 0

        if (Kitty.aiController.IsEnabled()) return

        SoloMultiboard.UpdateDeathCount(Kitty.Player)

        if (Gamemode.CurrentGameMode != GameMode.Standard) return

        Kitty.SaveData.GameStats.Deaths += 1
    }

    /// <summary>
    /// Updates the savior kitty's stats when they save another kitty. This includes updating their save streak, total saves, and round saves.
    /// </summary>
    /// <param name="savior"></param>
    public SaveStatUpdate(savior: Kitty) {
        if (Kitty.aiController.IsEnabled()) return

        savior.CurrentStats.TotalSaves += 1
        savior.CurrentStats.RoundSaves += 1
        savior.CurrentStats.SaveStreak += 1

        if (savior.CurrentStats.SaveStreak > savior.CurrentStats.MaxSaveStreak)
            savior.CurrentStats.MaxSaveStreak = savior.CurrentStats.SaveStreak

        if (Gamemode.CurrentGameMode != GameMode.Standard) return

        savior.SaveData.GameStats.Saves += 1
        savior.SaveData.GameStats.SaveStreak += 1
        PersonalBestAwarder.BeatMostSavesInGame(savior)
        PersonalBestAwarder.BeatenSaveStreak(savior)
        Challenges.PurpleLighting(savior)
        savior.YellowLightning.SaveIncrement()
    }
}
