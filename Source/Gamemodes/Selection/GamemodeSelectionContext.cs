/// <summary>
/// Mutable state accumulated as the host works through the gamemode
/// selection dialogs. A single instance flows through one selection
/// "session", from the first menu in <see cref="GamemodeSelectionWizard"/>
/// through to the final call into <see cref="Gamemode.SetGameMode"/>.
/// </summary>
public sealed class GamemodeSelectionContext
{
    public GameMode Mode { get; set; }
    public string ModeType { get; set; } = "";
    public string Region { get; set; }
    public int TeamSize { get; set; } = Globals.DEFAULT_TEAM_SIZE;
    public bool AutoRevive { get; set; }
}
