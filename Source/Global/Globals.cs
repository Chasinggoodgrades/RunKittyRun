using System;
using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class Globals
{
    public const int MAX_TEAM_SIZE = 12;
    public const float TIME_TO_PICK_GAMEMODE = 20.0f;
    public const int DEFAULT_TEAM_SIZE = 3;
    public static int ROUND = 0;
    public static bool GAME_ACTIVE { get; set; } = false;
    public static float GAME_SECONDS = 0.0f;
    public static rect WORLD_BOUNDS = rect.CreateWorldBounds();
    public static int GAME_SEED = GetRandomInt(1, 900000);
    public static group TempGroup = group.Create();
    public static readonly string[] GAME_MODES = { "Standard", "Tournament Solo", "Tournament Team" };
    public static readonly string[] TEAM_MODES = { "Free Pick", "Random" };
    public static readonly string[] SOLO_MODES = { "Progression", "Race" };
    public static readonly string[] VIPLIST = { "QWNoZXMjMTgxNw==", "TG9jYWwgUGxheWVy", "Q2FpdCMxMjgwNQ==", "T21uaW9sb2d5IzExODUw", "U3RhbiMyMjM5OQ==", "WW9zaGltYXJ1IzIxOTc2" };
    public static List<player> VIPLISTUNFILTERED = new List<player>();

    public static readonly string[] CHAMPIONS =
        { "Aches#1817", "Fieryfox#21640", "Qoz#11803", "BranFlake64#1127", "BranFlake#1127",
        "Balmydrop#1737", "udo#11673", "MrGheed#1831", "Local Player", "Stan#22399",
        "Omniology#11850", "Danger#24279"};

    public static timer GAME_TIMER = timer.Create();
    public static List<player> ALL_PLAYERS = new List<player>();
    public static List<Safezone> SAFE_ZONES = new List<Safezone>();
    public static List<player> LockedCamera = new List<player>();
    public static timerdialog GAME_TIMER_DIALOG = CreateTimerDialog(GAME_TIMER);

    public static Dictionary<player, Kitty> ALL_KITTIES = new Dictionary<player, Kitty>();
    public static Dictionary<player, Circle> ALL_CIRCLES = new Dictionary<player, Circle>();
    public static Dictionary<unit, Wolf> ALL_WOLVES = new Dictionary<unit, Wolf>();

    public static Dictionary<player, PlayerUpgrades> PLAYER_UPGRADES = new Dictionary<player, PlayerUpgrades>();

    public static SaveManager SaveSystem;
    public static GameAwardsDataSorted GAME_AWARDS_SORTED { get; } = new GameAwardsDataSorted();
    public static RoundTimesData GAME_TIMES = new RoundTimesData();
    public static GameStatsData GAME_STATS = new GameStatsData();
    // public static GameTimesData SAVE_GAME_ROUND_DATA = new GameTimesData();

    public static Random RANDOM_GEN { get; } = new Random(GAME_SEED);
    public static Dictionary<int, Team> ALL_TEAMS { get; set; }
    public static Dictionary<player, Team> PLAYERS_TEAMS { get; set; }
    public static Dictionary<Team, string> TEAM_PROGRESS;

    public static Dictionary<int, Dictionary<int, int>> WolvesPerRound = new Dictionary<int, Dictionary<int, int>>
    {
        // Round                         // Lane ,  // Updated # Wolves (+5% for all lanes, first 6 + 5%)
        { 1, new Dictionary<int, int> { { 0, 25 }, { 1, 25 }, { 2, 25 }, { 3, 25 }, { 4, 17 }, { 5, 16 }, { 6, 16 }, { 7, 15 }, { 8, 12 }, { 9, 12 }, { 10, 12 }, { 11, 7 }, { 12, 7 }, { 13, 6 }, { 14, 6 }, { 15, 2 }, { 16, 2 } } },
        { 2, new Dictionary<int, int> { { 0, 34 }, { 1, 34 }, { 2, 34 }, { 3, 34 }, { 4, 23 }, { 5, 22 }, { 6, 20 }, { 7, 19 }, { 8, 15 }, { 9, 15 }, { 10, 14 }, { 11, 10 }, { 12, 10 }, { 13, 8 }, { 14, 7 }, { 15, 3 }, { 16, 3 } } },
        { 3, new Dictionary<int, int> { { 0, 39 }, { 1, 39 }, { 2, 38 }, { 3, 38 }, { 4, 27 }, { 5, 26 }, { 6, 24 }, { 7, 22 }, { 8, 17 }, { 9, 17 }, { 10, 16 }, { 11, 12 }, { 12, 12 }, { 13, 8 }, { 14, 8 }, { 15, 3 }, { 16, 3 } } },
        { 4, new Dictionary<int, int> { { 0, 48 }, { 1, 48 }, { 2, 48 }, { 3, 46 }, { 4, 32 }, { 5, 31 }, { 6, 27 }, { 7, 26 }, { 8, 20 }, { 9, 20 }, { 10, 18 }, { 11, 14 }, { 12, 14 }, { 13, 10 }, { 14, 9 }, { 15, 4 }, { 16, 4 } } },
        { 5, new Dictionary<int, int> { { 0, 57 }, { 1, 57 }, { 2, 57 }, { 3, 57 }, { 4, 37 }, { 5, 35 }, { 6, 30 }, { 7, 29 }, { 8, 21 }, { 9, 21 }, { 10, 20 }, { 11, 16 }, { 12, 16 }, { 13, 11 }, { 14, 10 }, { 15, 5 }, { 16, 5 } } }
    };


    /// <summary>
    /// Mock Data to Test Whatever lanes, and # of wolves as needed.
    /// </summary>
/*    public static Dictionary<int, Dictionary<int, int>> WolvesPerRound = new Dictionary<int, Dictionary<int, int>>
    {
        // Round                         // Lane ,  // # Wolves
        { 1, new Dictionary<int, int> { { 0, 3 }, { 1, 0 }, { 2, 0 }, { 3, 0 }, { 4, 0 }, { 5, 0 }, { 6, 0 }, { 7, 0 }, { 8, 0 }, { 9, 0 }, { 10, 0 }, { 11, 0 }, { 12, 0 }, { 13, 0 }, { 14, 0 }, { 15, 0 }, { 16, 0 } } },
        { 2, new Dictionary<int, int> { { 0, 5 }, { 1, 0 }, { 2, 0 }, { 3, 0 }, { 4, 0 }, { 5, 0 }, { 6, 0 }, { 7, 0 }, { 8, 0 }, { 9, 0 }, { 10, 0 }, { 11, 0 }, { 12, 0 }, { 13, 0 }, { 14, 0 }, { 15, 0 }, { 16, 0 } } },
        { 3, new Dictionary<int, int> { { 0, 5 }, { 1, 0 }, { 2, 0 }, { 3, 0 }, { 4, 0 }, { 5, 0 }, { 6, 0 }, { 7, 0 }, { 8, 0 }, { 9, 0 }, { 10, 0 }, { 11, 0 }, { 12, 0 }, { 13, 0 }, { 14, 0 }, { 15, 0 }, { 16, 0 } } },
        { 4, new Dictionary<int, int> { { 0, 5 }, { 1, 0 }, { 2, 0 }, { 3, 0 }, { 4, 0 }, { 5, 0 }, { 6, 0 }, { 7, 0 }, { 8, 0 }, { 9, 0 }, { 10, 0 }, { 11, 0 }, { 12, 0 }, { 13, 0 }, { 14, 0 }, { 15, 0 }, { 16, 0 } } },
        { 5, new Dictionary<int, int> { { 0, 5 }, { 1, 0 }, { 2, 0 }, { 3, 0 }, { 4, 0 }, { 5, 0 }, { 6, 0 }, { 7, 0 }, { 8, 0 }, { 9, 0 }, { 10, 0 }, { 11, 0 }, { 12, 0 }, { 13, 0 }, { 14, 0 }, { 15, 0 }, { 16, 0 } } }
    };*/
}
