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
    public static GameAwardsData GAME_AWARDS = new GameAwardsData();
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
        // Round                         // Lane ,  // # Wolves
        { 1, new Dictionary<int, int> { { 0, 20 }, { 1, 20 }, { 2, 20 }, { 3, 20 }, { 4, 14 }, { 5, 13 }, { 6, 13 }, { 7, 13 }, { 8, 10 }, { 9, 10 }, { 10, 10 }, { 11, 6 }, { 12, 6 }, { 13, 4 }, { 14, 4 }, { 15, 1 }, { 16, 1 } } },
        { 2, new Dictionary<int, int> { { 0, 28 }, { 1, 28 }, { 2, 28 }, { 3, 28 }, { 4, 19 }, { 5, 19 }, { 6, 18 }, { 7, 17 }, { 8, 13 }, { 9, 13 }, { 10, 12 }, { 11, 8 }, { 12, 8 }, { 13, 6 }, { 14, 5 }, { 15, 2 }, { 16, 2 } } },
        { 3, new Dictionary<int, int> { { 0, 34 }, { 1, 34 }, { 2, 33 }, { 3, 33 }, { 4, 24 }, { 5, 23 }, { 6, 21 }, { 7, 20 }, { 8, 15 }, { 9, 15 }, { 10, 14 }, { 11, 10 }, { 12, 10 }, { 13, 7 }, { 14, 6 }, { 15, 3 }, { 16, 3 } } },
        { 4, new Dictionary<int, int> { { 0, 40 }, { 1, 40 }, { 2, 38 }, { 3, 38 }, { 4, 28 }, { 5, 27 }, { 6, 24 }, { 7, 23 }, { 8, 17 }, { 9, 17 }, { 10, 16 }, { 11, 12 }, { 12, 12 }, { 13, 8 }, { 14, 7 }, { 15, 4 }, { 16, 4 } } },
        { 5, new Dictionary<int, int> { { 0, 46 }, { 1, 46 }, { 2, 44 }, { 3, 44 }, { 4, 32 }, { 5, 31 }, { 6, 27 }, { 7, 26 }, { 8, 19 }, { 9, 19 }, { 10, 18 }, { 11, 14 }, { 12, 14 }, { 13, 9 }, { 14, 8 }, { 15, 5 }, { 16, 5 } } }
    };

    /// <summary>
    /// Mock Data to Test Whatever lanes, and # of wolves as needed.
    /// </summary>
/*    public static Dictionary<int, Dictionary<int, int>> WolvesPerRound = new Dictionary<int, Dictionary<int, int>>
    {
        // Round                         // Lane ,  // # Wolves
        { 1, new Dictionary<int, int> { { 0, 5 }, { 1, 0 }, { 2, 0 }, { 3, 0 }, { 4, 0 }, { 5, 0 }, { 6, 0 }, { 7, 0 }, { 8, 0 }, { 9, 0 }, { 10, 0 }, { 11, 0 }, { 12, 0 }, { 13, 0 }, { 14, 0 }, { 15, 0 }, { 16, 0 } } },
        { 2, new Dictionary<int, int> { { 0, 5 }, { 1, 0 }, { 2, 0 }, { 3, 0 }, { 4, 0 }, { 5, 0 }, { 6, 0 }, { 7, 0 }, { 8, 0 }, { 9, 0 }, { 10, 0 }, { 11, 0 }, { 12, 0 }, { 13, 0 }, { 14, 0 }, { 15, 0 }, { 16, 0 } } },
        { 3, new Dictionary<int, int> { { 0, 5 }, { 1, 0 }, { 2, 0 }, { 3, 0 }, { 4, 0 }, { 5, 0 }, { 6, 0 }, { 7, 0 }, { 8, 0 }, { 9, 0 }, { 10, 0 }, { 11, 0 }, { 12, 0 }, { 13, 0 }, { 14, 0 }, { 15, 0 }, { 16, 0 } } },
        { 4, new Dictionary<int, int> { { 0, 5 }, { 1, 0 }, { 2, 0 }, { 3, 0 }, { 4, 0 }, { 5, 0 }, { 6, 0 }, { 7, 0 }, { 8, 0 }, { 9, 0 }, { 10, 0 }, { 11, 0 }, { 12, 0 }, { 13, 0 }, { 14, 0 }, { 15, 0 }, { 16, 0 } } },
        { 5, new Dictionary<int, int> { { 0, 5 }, { 1, 0 }, { 2, 0 }, { 3, 0 }, { 4, 0 }, { 5, 0 }, { 6, 0 }, { 7, 0 }, { 8, 0 }, { 9, 0 }, { 10, 0 }, { 11, 0 }, { 12, 0 }, { 13, 0 }, { 14, 0 }, { 15, 0 }, { 16, 0 } } }
    };*/


}
