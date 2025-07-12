using System;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class Gamemode
{
    public static player HostPlayer { get; private set; }
    public static string CurrentGameMode { get; private set; } = "";
    public static string CurrentGameModeType { get; private set; } = "";
    public static bool IsGameModeChosen { get; private set; } = false;
    public static int PlayersPerTeam { get; set; } = 0;
    public static int NumberOfRounds { get; private set; } = 5;

    public static void Initialize()
    {
        ChoosingGameMode();
    }

    private static void ChoosingGameMode()
    {
        HostPlayer = Globals.ALL_PLAYERS[0];
        HostOptions();
        HostPickingGamemode();
    }

    private static void HostOptions()
    {
        var gamemodes = Globals.GAME_MODES;
        if (!ADMINDISABLE.AdminsGame()) return;
        HostPlayer.DisplayTimedTextTo(Globals.TIME_TO_PICK_GAMEMODE, Colors.COLOR_GOLD + "=====================================" + Colors.COLOR_RESET);
        HostPlayer.DisplayTimedTextTo(Globals.TIME_TO_PICK_GAMEMODE, Colors.COLOR_GOLD + "Please choose a gamemode." + Colors.COLOR_RESET);

        // Standard Mode
        HostPlayer.DisplayTimedTextTo(Globals.TIME_TO_PICK_GAMEMODE,
            Colors.COLOR_YELLOW_ORANGE + gamemodes[0] + // Standard
            Colors.COLOR_GOLD + " (-s)" +
            Colors.COLOR_RESET);

        // Solo Modes
        HostPlayer.DisplayTimedTextTo(Globals.TIME_TO_PICK_GAMEMODE,
            Colors.COLOR_YELLOW_ORANGE + gamemodes[1] + // Solo
            Colors.COLOR_GOLD + " (-t solo <prog | race>)" +
            Colors.COLOR_RESET);

        // Team Modes
        HostPlayer.DisplayTimedTextTo(Globals.TIME_TO_PICK_GAMEMODE,
            Colors.COLOR_YELLOW_ORANGE + gamemodes[2] + // Team
            Colors.COLOR_GOLD + " (-t team <fp | freepick | r | random> <teamsize>)" +
            Colors.COLOR_RESET);

        HostPlayer.DisplayTimedTextTo(Globals.TIME_TO_PICK_GAMEMODE, Colors.COLOR_GOLD + "=====================================" + Colors.COLOR_RESET);
    }

    public static void SetGameMode(string mode, string modeType = "", int teamSize = Globals.DEFAULT_TEAM_SIZE)
    {
        try
        {
            CurrentGameMode = mode;
            CurrentGameModeType = modeType;
            IsGameModeChosen = true;
            PlayersPerTeam = teamSize;

            ClearTextMessages();
            NotifyGamemodeChosen();
            SetupChosenGamemode();
        }
        catch (Exception e)
        {
            Logger.Critical($"Gamemode: SetGameMode: {e.Message}");
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
            player.DisplayTimedTextTo(Globals.TIME_TO_PICK_GAMEMODE / 3.0f, Colors.COLOR_YELLOW_ORANGE + "Gamemode chosen: " + Colors.COLOR_GOLD + CurrentGameMode + " " + CurrentGameModeType);
        }
    }

    private static void SetupChosenGamemode()
    {
        if (CurrentGameMode == Globals.GAME_MODES[0])
        {
            Standard.Initialize();
        }
        else if (CurrentGameMode == Globals.GAME_MODES[1])
        {
            Solo.Initialize();
        }
        else if (CurrentGameMode == Globals.GAME_MODES[2])
        {
            Team.Initialize();
        }
    }
}
