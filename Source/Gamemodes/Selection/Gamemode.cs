using System;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class Gamemode
{
    public static player HostPlayer { get; private set; }

    /// <summary>
    /// The active gamemode instance. Prefer calling members on this
    /// (e.g. Gamemode.Current.OnVictoryZoneEntered(kitty)) over branching on
    /// CurrentGameMode wherever you're touching the code anyway.
    /// </summary>
    public static IGameMode Current { get; private set; }

    /// <summary>
    /// Proxies to Current.Id. Kept so the existing ~140 call sites that branch on
    /// this enum directly keep compiling and stay in sync during the migration
    /// to IGameMode; new code should prefer Gamemode.Current.
    /// </summary>
    public static GameMode CurrentGameMode => Current?.Id ?? GameMode.Standard;

    public static string CurrentGameModeType { get; private set; } = "";
    public static bool IsGameModeChosen { get; private set; } = false;
    public static int PlayersPerTeam { get; set; } = 0;
    public static int NumberOfRounds { get; set; } = 5;
    /// <summary>
    /// Whether teams should be automatically revived (at the team's lowest reached checkpoint) after all members die, instead of being eliminated.
    /// </summary>
    public static bool AutoReviveEnabled { get; private set; } = true;

    public static void SetAutoRevive(bool enabled)
    {
        AutoReviveEnabled = enabled;
    }

    public static void Initialize()
    {
        ChoosingGameMode();
    }

    private static void ChoosingGameMode()
    {
        HostPlayer = Globals.ALL_PLAYERS[0];
        HostPickingGamemode();

        GamemodeSelectionWizard.Begin(HostPlayer);
    }

    public static void SetGameMode(GameMode mode, string modeType = "", int teamSize = Globals.DEFAULT_TEAM_SIZE)
    {
        try
        {
            GamemodeSelectionWizard.CancelActive();

            CurrentGameModeType = modeType;
            IsGameModeChosen = true;
            PlayersPerTeam = teamSize;
            Current = CreateGameMode(mode, modeType);

            ClearTextMessages();
            NotifyGamemodeChosen();
            Current.Initialize();
        }
        catch (Exception e)
        {
            Logger.Critical($"Gamemode: SetGameMode: {e.Message}");
        }
    }

    private static IGameMode CreateGameMode(GameMode mode, string modeType)
    {
        switch (mode)
        {
            case GameMode.Standard:
                return new StandardGameMode();
            case GameMode.Solo:
                return new SoloGameMode();
            case GameMode.Team:
                return new TeamGameMode(modeType);
            default:
                Logger.Warning("Unknown gamemode selected, defaulting to Standard.");
                return new StandardGameMode();
        }
    }

    private static void HostPickingGamemode()
    {
        var color = Colors.COLOR_YELLOW_ORANGE;
        foreach (var player in Globals.ALL_PLAYERS)
        {
            var localplayer = player.LocalPlayer;
            if (localplayer != HostPlayer)
            {
                player.DisplayTimedTextTo(Globals.TIME_TO_PICK_GAMEMODE, $"{color}Please wait for {Colors.PlayerNameColored(HostPlayer)}{color} to pick the gamemode. {Colors.COLOR_RED}(Defaults to Standard in {Globals.TIME_TO_PICK_GAMEMODE} seconds).|r");
            }
        }
    }

    private static void NotifyGamemodeChosen()
    {
        foreach (var player in Globals.ALL_PLAYERS)
        {
            player.DisplayTimedTextTo(Globals.TIME_TO_PICK_GAMEMODE / 3.0f, Colors.COLOR_YELLOW_ORANGE + "Gamemode chosen: " + Colors.COLOR_GOLD + CurrentGameMode.ToString() + " " + CurrentGameModeType);
        }
    }
}
