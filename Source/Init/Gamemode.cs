using System;
using System.Collections.Generic;
using System.Drawing;
using WCSharp.Api;
using WCSharp.Events;
using WCSharp.Shared;
using WCSharp.Shared.Data;
using WCSharp.Sync;
using static WCSharp.Api.Common;



public static class Gamemode
{
    public static player HostPlayer { get; private set; }
    public static string CurrentGameMode { get; private set; } = "";
    public static string CurrentGameModeType { get; private set; } = "";
    public static bool IsGameModeChosen { get; private set; } = false;
    public static int PlayersPerTeam { get; private set; } = 0;


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
        // Gamemodes: Standard, Tournament (-s, -t)
        // If Standard, then all players will choose difficulty
        // If Tournament, host gets more options (Solo, Team) (-t solo) (-t -team -tc #)
        // If Team, pick team size
        var gamemodes = Globals.GAME_MODES;
        HostPlayer.DisplayTimedTextTo(Globals.TIME_TO_PICK_GAMEMODE, Color.COLOR_GOLD + "=====================================" + Color.COLOR_RESET);
        HostPlayer.DisplayTimedTextTo(Globals.TIME_TO_PICK_GAMEMODE, Color.COLOR_GOLD + "Please choose a gamemode." + Color.COLOR_RESET);

        // Standard Mode
        HostPlayer.DisplayTimedTextTo(Globals.TIME_TO_PICK_GAMEMODE,
            Color.COLOR_YELLOW_ORANGE + gamemodes[0] + // Standard
            Color.COLOR_GOLD + " (-s)" +
            Color.COLOR_RESET);

        // Solo Modes
        HostPlayer.DisplayTimedTextTo(Globals.TIME_TO_PICK_GAMEMODE,
            Color.COLOR_YELLOW_ORANGE + gamemodes[1] + // Solo
            Color.COLOR_GOLD + " (-t solo <prog | race>)" +
            Color.COLOR_RESET);

        // Team Modes
        HostPlayer.DisplayTimedTextTo(Globals.TIME_TO_PICK_GAMEMODE,
            Color.COLOR_YELLOW_ORANGE + gamemodes[2] + // Team
            Color.COLOR_GOLD + " (-t team <fp | freepick | r | random> <teamsize=3>)" +
            Color.COLOR_RESET);

        HostPlayer.DisplayTimedTextTo(Globals.TIME_TO_PICK_GAMEMODE, Color.COLOR_GOLD + "=====================================" + Color.COLOR_RESET);
    }

    public static void SetGameMode(string mode, string modeType = "", int teamSize = 0)
    {
        CurrentGameMode = mode;
        CurrentGameModeType = modeType;
        IsGameModeChosen = true;
        PlayersPerTeam = teamSize;

        NotifyGamemodeChosen();
        SetupChosenGamemode();
    }

    private static void HostPickingGamemode()
    {
        foreach(var player in Globals.ALL_PLAYERS)
        {
            if(player != HostPlayer)
            {
                player.DisplayTimedTextTo(Globals.TIME_TO_PICK_GAMEMODE, Color.COLOR_YELLOW_ORANGE + "Please wait for " + Color.PlayerNameColored(HostPlayer) + Color.COLOR_YELLOW_ORANGE + " to pick the gamemode.");
            }
        }
    }

    private static void NotifyGamemodeChosen()
    {
        foreach (var player in Globals.ALL_PLAYERS)
        {
            player.DisplayTimedTextTo(Globals.TIME_TO_PICK_GAMEMODE, Color.COLOR_YELLOW_ORANGE + "Gamemode chosen: " + Color.COLOR_GOLD + CurrentGameMode + " " + CurrentGameModeType);
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