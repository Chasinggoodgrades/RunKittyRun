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
    public static int GAME_SEED { get; set; }
    public static List<Kitty> TempKittyList { get; } = new List<Kitty>();
    public static readonly GameMode[] GAME_MODES = { GameMode.Standard, GameMode.Solo, GameMode.Team };
    public static readonly string[] TEAM_MODES = { "Free Pick", "Random" };
    public static readonly string[] SOLO_MODES = { "Progression", "Race" };
    public static readonly string[] DeveloperList = { "QWNoZXMjMTgxNw==", "TG9jYWwgUGxheWVy", "U3RhbiMyMjM5OQ==", "WW9zaGltYXJ1IzIxOTc2" };
    public static readonly string[] AdminList = { "Q2FpdCMxMjgwNQ==", "T21uaW9sb2d5IzExODUw", "Rmllcnlmb3gjMjE2NDA=", "S2Fub24yODkjMTU5Mw==" };
    public static readonly string[] VipList = { "Q2FydG1hbiMyMzMxNQ==", "S3ltcCMyNDUw", "TXJHaGVlZCMxODMx",
        "aG9mZiMxMTQwNA==", "SmFtZXNGcmFuY28jMTE3MTk=", "TmF0aGFuc2VycG8jMjQ2MQ==",
        "QmFsbXlkcm9wIzE3Mzc=", "QnJhbkZsYWtlNjQjMTEyNw==", "Tm9vYmVybWFuIzExNTc5", "TmF6ZSMxMTI2OQ==", "T3JiaXQjMTc1MQ==" };
    public static List<player> DEVELOPER_LIST = new List<player>();
    public static List<player> ADMIN_LIST = new List<player>();
    public static List<player> VIP_LIST = new List<player>();

    public static readonly string[] CHAMPIONS =
        { "Aches#1817", "Fieryfox#21640", "Qoz#11803", "BranFlake64#1127", "BranFlake#1127",
        "Balmydrop#1737", "udo#11673", "MrGheed#1831", "Local Player", "Stan#22399",
        "Omniology#11850", "Danger#24279", "nomordarkwar#2525"};

    public static timer GAME_TIMER = timer.Create();
    public static timerdialog GAME_TIMER_DIALOG = CreateTimerDialog(GAME_TIMER);

    public static List<player> ALL_PLAYERS { get; set; } = new List<player>();
    public static List<Safezone> SAFE_ZONES { get; set; } = new List<Safezone>();
    public static List<player> LockedCamera { get; set; } = new List<player>();
    public static List<Kitty> ALL_KITTIES_LIST { get; set; } = new List<Kitty>();


    public static Dictionary<player, Kitty> ALL_KITTIES { get; set; } = new Dictionary<player, Kitty>();
    public static Dictionary<player, Circle> ALL_CIRCLES { get; set; } = new Dictionary<player, Circle>();
    public static Dictionary<unit, Wolf> ALL_WOLVES { get; set; } = new Dictionary<unit, Wolf>();
    public static List<Wolf> ALL_WOLVES_LIST { get; set; } = new List<Wolf>();

    public static Dictionary<player, PlayerUpgrades> PLAYER_UPGRADES { get; set; } = new Dictionary<player, PlayerUpgrades>();

    public static SaveManager SaveSystem { get; set; }
    public static GameAwardsDataSorted GAME_AWARDS_SORTED { get; } = new GameAwardsDataSorted();
    public static RoundTimesData GAME_TIMES { get; set; } = new RoundTimesData();
    public static GameStatsData GAME_STATS { get; set; } = new GameStatsData();
    // public static GameTimesData SAVE_GAME_ROUND_DATA = new GameTimesData();

    /// <summary>
    /// Seeded Random GEN for things that need to be based on the game seed, such as affixes or save system reasons.
    /// </summary>
    public static Random RANDOM_GEN { get; set; }
    /// <summary>
    /// Unseeded Random GEN for things that need to be more random and not based on the game seed. (Tournament saver)
    /// </summary>
    public static Random RANDOM_GEN_02 { get; set; }
    public static bool DATE_TIME_LOADED { get; set; }
    public static bool GAME_INITIALIZED { get; set; }

}
