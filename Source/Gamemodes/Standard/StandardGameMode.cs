using WCSharp.Api;

/// <summary>
/// IGameMode adapter for Standard mode. Delegates setup to the existing
/// Standard static class so nothing outside this file has to change —
/// Difficulty.cs still calls Standard.SetupProgressive()/SetupStandard()
/// exactly as before.
/// </summary>
public sealed class StandardGameMode : IGameMode
{
    public GameMode Id => GameMode.Standard;
    public static float ROUND_INTERMISSION { get; } = 10.0f;

    public void Initialize()
    {
        ShadowKitty.Initialize();
        Difficulty.Initialize();
        ProtectionOfAncients.Initialize();
        SpawnChampions.Initialize();
        RollerSkates.Initialize();
        EasterEggManager.LoadEasterEggs();
        Relic.RegisterRelicEnabler();
    }

    public bool CanTriggerVictory(unit enteringUnit) => true;

    public void OnVictoryZoneEntered(Kitty kitty)
    {
        if (Globals.ROUND == Gamemode.NumberOfRounds) Gameover.WinGame = true;
        RoundManager.RoundEnd();
    }

    public void OnPlayerLeft(player player)
    {
        // just regular playerleaves cleanup. nothin special here.
    }

    public void RefreshMultiboard()
    {
        if (!Difficulty.IsDifficultyChosen) return; // Init first.
        StandardMultiboard.UpdateStandardCurrentStatsMB();
        StandardMultiboard.UpdateOverallStatsMB();
        StandardMultiboard.UpdateBestTimesMB();
    }

    public void OnKittyDied(Kitty kitty)
    {
        TeamDeathless.DiedWithOrb(kitty);
        //ChainedTogether.LoseEvent(kitty.Name);
        SoundManager.PlayLastManStandingSound();
        Gameover.GameOver();
        MultiboardUtil.RefreshMultiboards();
    }
}
