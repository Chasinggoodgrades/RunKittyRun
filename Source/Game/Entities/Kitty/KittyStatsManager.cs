public class KittyStatsManager
{
    private Kitty Kitty { get; set; }
    public KittyStatsManager(Kitty kitty)
    {
        this.Kitty = kitty;
    }

    public void UpdateSaviorStats(Kitty savior)
    {
        savior.Player.Gold += Resources.SaveGoldBonus(savior.CurrentStats.SaveStreak);
        savior.Unit.Experience += Resources.SaveExperience;
        SaveStatUpdate(savior);
    }

    public void DeathStatUpdate()
    {
        DeathlessChallenges.ResetPlayerDeathless(Kitty);
        Kitty.CurrentStats.TotalDeaths += 1;
        Kitty.CurrentStats.RoundDeaths += 1;
        Kitty.CurrentStats.SaveStreak = 0;
        Kitty.SaveData.GameStats.SaveStreak = 0;

        if (Kitty.aiController.IsEnabled()) return;

        SoloMultiboard.UpdateDeathCount(Kitty.Player);

        if (Gamemode.CurrentGameMode != "Standard") return;

        Kitty.SaveData.GameStats.Deaths += 1;
    }

    public void SaveStatUpdate(Kitty savior)
    {
        if (Kitty.aiController.IsEnabled()) return;

        savior.CurrentStats.TotalSaves += 1;
        savior.CurrentStats.RoundSaves += 1;
        savior.CurrentStats.SaveStreak += 1;

        if (savior.CurrentStats.SaveStreak > savior.CurrentStats.MaxSaveStreak)
            savior.CurrentStats.MaxSaveStreak = savior.CurrentStats.SaveStreak;

        if (Gamemode.CurrentGameMode != "Standard") return;

        savior.SaveData.GameStats.Saves += 1;
        savior.SaveData.GameStats.SaveStreak += 1;
        PersonalBestAwarder.BeatMostSavesInGame(savior);
        PersonalBestAwarder.BeatenSaveStreak(savior);
        Challenges.PurpleLighting(savior);
        savior.YellowLightning.SaveIncrement();
    }
}
