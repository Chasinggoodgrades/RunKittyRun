using WCSharp.Api;

/// <summary>
/// Every gamemode implements this interface. This replaces the pattern of scattering
/// `if (Gamemode.CurrentGameMode == GameMode.X)` checks across the codebase —
/// call sites instead ask <see cref="Gamemode.Current"/> to do the mode-specific
/// thing, and each mode decides what that means for itself.
/// </summary>
public interface IGameMode
{
    /// <summary>
    /// The enum identity of this mode. Kept around for the call sites that still
    /// need to branch on it, UI text, and save-data tagging.
    /// </summary>
    GameMode Id { get; }

    /// <summary>
    /// One-time setup when this gamemode is chosen (spawns, triggers, systems).
    /// </summary>
    void Initialize();

    /// <summary>
    /// Whether <paramref name="enteringUnit"/> is allowed to trigger victory-zone
    /// actions right now. Standard/Solo: always true. Team: true only once every
    /// teammate is already inside the victory container.
    /// </summary>
    bool CanTriggerVictory(unit enteringUnit);

    /// <summary>
    /// Called once a kitty's unit has entered the victory area and passed
    /// <see cref="CanTriggerVictory"/>. Each mode decides what "finishing" means.
    /// </summary>
    void OnVictoryZoneEntered(Kitty kitty);

    /// <summary>
    /// Called when a player leaves the game, so the mode can clean up any of its
    /// own bookkeeping (e.g. Team removes them from their team).
    /// </summary>
    void OnPlayerLeft(player player);

    /// <summary>
    /// Refreshes whatever multiboard(s) this mode owns. Called from
    /// MultiboardUtil.RefreshMultiboards() and whenever mode-specific state changes.
    /// </summary>
    void RefreshMultiboard();

    /// <summary>
    /// Called whenever a kitty dies
    /// </summary>
    void OnKittyDied(Kitty kitty);
}
