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
    public static readonly string[] VIPLIST = { "QWNoZXMjMTgxNw==", "TG9jYWwgUGxheWVy", "Q2FpdCMxMjgwNQ==", "T21uaW9sb2d5IzExODUw", "U3RhbiMyMjM5OQ==" };
    public static readonly string[] CHAMPIONS =
        { "Aches#1817", "Fieryfox#21640", "Qoz#11803", "BranFlake64#1127", "BranFlake#1127",
        "Balmydrop#1737", "udo#11673", "MrGheed#1831", "Local Player", "Stan#22399",
        "Omniology#11850", "Danger#24279"};
    public static Dictionary<unit, Wolf> ALL_WOLVES = new Dictionary<unit, Wolf>();
    public static timer GAME_TIMER = timer.Create();
    public static List<player> ALL_PLAYERS = new List<player>();
    public static List<Safezone> SAFE_ZONES = new List<Safezone>();
    public static List<player> LockedCamera = new List<player>();
    public static timerdialog GAME_TIMER_DIALOG = CreateTimerDialog(GAME_TIMER);
    public static Dictionary<player, Kitty> ALL_KITTIES = new Dictionary<player, Kitty>();
    public static Dictionary<player, Circle> ALL_CIRCLES = new Dictionary<player, Circle>();
    public static Dictionary<player, int> PLAYERS_CURRENT_SAFEZONE { get; set; } = new Dictionary<player, int>();
    public static Dictionary<player, PlayerUpgrades> PLAYER_UPGRADES = new Dictionary<player, PlayerUpgrades>();
    public static SaveManager SaveSystem;
    public static GameAwardsDataSorted GAME_AWARDS_SORTED { get; } = new GameAwardsDataSorted();
    public static RoundTimesData GAME_TIMES = new RoundTimesData();
    public static GameStatsData GAME_STATS = new GameStatsData();

    public static Random RANDOM_GEN { get; } = new Random(GAME_SEED);
    public static Dictionary<int, Team> ALL_TEAMS;
    public static Dictionary<player, Team> PLAYERS_TEAMS;
    public static Dictionary<Team, string> TEAM_PROGRESS;
    public static Dictionary<player, float> PLAYER_PROGRESS;
    public static Dictionary<int, Dictionary<int, int>> WolvesPerRound = new Dictionary<int, Dictionary<int, int>>
    {
        // Round                         // Lane ,  // # Wolves (10% for first 6 lanes, 5% for others)
        { 1, new Dictionary<int, int> { { 0, 24 }, { 1, 24 }, { 2, 24 }, { 3, 24 }, { 4, 16 }, { 5, 15 }, { 6, 15 }, { 7, 14 }, { 8, 11 }, { 9, 11 }, { 10, 11 }, { 11, 7 }, { 12, 7 }, { 13, 5 }, { 14, 5 }, { 15, 1 }, { 16, 1 } } },
        { 2, new Dictionary<int, int> { { 0, 32 }, { 1, 32 }, { 2, 32 }, { 3, 32 }, { 4, 22 }, { 5, 21 }, { 6, 19 }, { 7, 18 }, { 8, 14 }, { 9, 14 }, { 10, 13 }, { 11, 9 }, { 12, 9 }, { 13, 7 }, { 14, 6 }, { 15, 3 }, { 16, 3 } } },
        { 3, new Dictionary<int, int> { { 0, 37 }, { 1, 37 }, { 2, 36 }, { 3, 36 }, { 4, 26 }, { 5, 25 }, { 6, 22 }, { 7, 21 }, { 8, 16 }, { 9, 16 }, { 10, 15 }, { 11, 11 }, { 12, 11 }, { 13, 8 }, { 14, 7 }, { 15, 3 }, { 16, 3 } } },
        { 4, new Dictionary<int, int> { { 0, 46 }, { 1, 46 }, { 2, 46 }, { 3, 44 }, { 4, 31 }, { 5, 30 }, { 6, 25 }, { 7, 24 }, { 8, 18 }, { 9, 18 }, { 10, 17 }, { 11, 13 }, { 12, 13 }, { 13, 9 }, { 14, 8 }, { 15, 4 }, { 16, 4 } } },
        { 5, new Dictionary<int, int> { { 0, 54 }, { 1, 54 }, { 2, 54 }, { 3, 54 }, { 4, 35 }, { 5, 34 }, { 6, 28 }, { 7, 27 }, { 8, 20 }, { 9, 20 }, { 10, 19 }, { 11, 15 }, { 12, 15 }, { 13, 10 }, { 14, 9 }, { 15, 5 }, { 16, 5 } } }
    };

    /// <summary>
    /// Mock Data to Test Whatever lanes, and # of wolves as needed.
    /// </summary>
/*    public static Dictionary<int, Dictionary<int, int>> WolvesPerRound = new Dictionary<int, Dictionary<int, int>>
    {
        // Round                         // Lane ,  // # Wolves
        { 1, new Dictionary<int, int> { { 0, 2 }, { 1, 0 }, { 2, 0 }, { 3, 0 }, { 4, 0 }, { 5, 0 }, { 6, 0 }, { 7, 0 }, { 8, 0 }, { 9, 0 }, { 10, 0 }, { 11, 0 }, { 12, 0 }, { 13, 0 }, { 14, 0 }, { 15, 0 }, { 16, 0 } } },
        { 2, new Dictionary<int, int> { { 0, 5 }, { 1, 0 }, { 2, 0 }, { 3, 0 }, { 4, 0 }, { 5, 0 }, { 6, 0 }, { 7, 0 }, { 8, 0 }, { 9, 0 }, { 10, 0 }, { 11, 0 }, { 12, 0 }, { 13, 0 }, { 14, 0 }, { 15, 0 }, { 16, 0 } } },
        { 3, new Dictionary<int, int> { { 0, 5 }, { 1, 0 }, { 2, 0 }, { 3, 0 }, { 4, 0 }, { 5, 0 }, { 6, 0 }, { 7, 0 }, { 8, 0 }, { 9, 0 }, { 10, 0 }, { 11, 0 }, { 12, 0 }, { 13, 0 }, { 14, 0 }, { 15, 0 }, { 16, 0 } } },
        { 4, new Dictionary<int, int> { { 0, 5 }, { 1, 0 }, { 2, 0 }, { 3, 0 }, { 4, 0 }, { 5, 0 }, { 6, 0 }, { 7, 0 }, { 8, 0 }, { 9, 0 }, { 10, 0 }, { 11, 0 }, { 12, 0 }, { 13, 0 }, { 14, 0 }, { 15, 0 }, { 16, 0 } } },
        { 5, new Dictionary<int, int> { { 0, 5 }, { 1, 0 }, { 2, 0 }, { 3, 0 }, { 4, 0 }, { 5, 0 }, { 6, 0 }, { 7, 0 }, { 8, 0 }, { 9, 0 }, { 10, 0 }, { 11, 0 }, { 12, 0 }, { 13, 0 }, { 14, 0 }, { 15, 0 }, { 16, 0 } } }
    };*/


}
