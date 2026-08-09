using WCSharp.Api;

/// <summary>
/// IGameMode adapter for Solo mode. Delegates setup to the existing Solo
/// static class so Kitty.cs can keep calling Solo.ReviveKittySoloTournament()
/// and Solo.RoundEndCheck() directly, unchanged.
/// </summary>
public sealed class SoloGameMode : IGameMode
{
    public GameMode Id => GameMode.Solo;

    public void Initialize() => Solo.Initialize();

    public bool CanTriggerVictory(unit enteringUnit) => true;

    public void OnVictoryZoneEntered(Kitty kitty)
    {
        kitty.Finished = true;
        RoundUtilities.MovePlayerToStart(kitty.Player);
        BarrierSetup.ActivateBarrier();
        RoundManager.RoundEndCheck();
    }

    public void OnPlayerLeft(player player)
    {
        // Solo has no per-mode cleanup on player leave.
    }

    public void RefreshMultiboard()
    {
        SoloMultiboard.UpdateOverallStatsMB();
        SoloMultiboard.UpdateBestTimesMB();
    }

    public void OnKittyDied(Kitty kitty)
    {
        Solo.ReviveKittySoloTournament(kitty);
        Solo.RoundEndCheck();
    }
}
