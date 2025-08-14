import { Circle } from 'src/Game/Entities/Circle'
import { Kitty } from 'src/Game/Entities/Kitty/Kitty'
import { Wolf } from 'src/Game/Entities/Wolf'
import { PlayerUpgrades } from 'src/Game/Items/Relics/PlayerUpgrades'
import { Safezone } from 'src/Game/Management/Safezone'
import { Team } from 'src/Gamemodes/Teams/Team'
import { GameAwardsDataSorted } from 'src/SaveSystem2.0/MAKE REWARDS HERE/SaveObjects/GameAwardsDataSorted'
import { GameStatsData } from 'src/SaveSystem2.0/MAKE REWARDS HERE/SaveObjects/GameStatsData'
import { RoundTimesData } from 'src/SaveSystem2.0/MAKE REWARDS HERE/SaveObjects/RoundTimesData'
import { SaveManager } from 'src/SaveSystem2.0/SaveManager'
import { Group, MapPlayer, Rectangle, Timer, TimerDialog, Unit } from 'w3ts'
import { GameMode } from '../Gamemodes/GameModeEnum'

export class Globals {
    public static MAX_TEAM_SIZE: number = 24
    public static DEFAULT_TEAM_SIZE: number = 3
    public static TIME_TO_PICK_GAMEMODE: number = 20.0
    public static ROUND: number = 0
    public static GAME_ACTIVE: boolean = false
    public static GAME_SECONDS: number = 0.0
    public static WORLD_BOUNDS: Rectangle = Rectangle.getWorldBounds()!
    public static GAME_SEED: number
    public static TempGroup: Group = Group.create()!
    public static readonly GAME_MODES: string[] = [
        GameMode[GameMode.Standard],
        GameMode[GameMode.SoloTournament],
        GameMode[GameMode.TeamTournament],
    ]
    public static readonly TEAM_MODES: string[] = ['Pick: Free', 'Random']
    public static readonly SOLO_MODES: string[] = ['Progression', 'Race']
    public static readonly VIPLIST: string[] = [
        'QWNoZXMjMTgxNw==',
        'TG9jYWwgUGxheWVy',
        'Q2FpdCMxMjgwNQ==',
        'T21uaW9sb2d5IzExODUw',
        'U3RhbiMyMjM5OQ==',
        'WW9zaGltYXJ1IzIxOTc2',
    ]
    public static VIPLISTUNFILTERED: MapPlayer[] = []

    public static readonly CHAMPIONS: string[] = [
        'Aches#1817',
        'Fieryfox#21640',
        'Qoz#11803',
        'BranFlake64#1127',
        'BranFlake#1127',
        'Balmydrop#1737',
        'udo#11673',
        'MrGheed#1831',
        'Player: Local',
        'Stan#22399',
        'Omniology#11850',
        'Danger#24279',
    ]

    public static GAME_TIMER = Timer.create()
    public static GAME_TIMER_DIALOG = TimerDialog.create(Globals.GAME_TIMER)!

    public static ALL_PLAYERS: MapPlayer[] = []
    public static SAFE_ZONES: Safezone[] = []
    public static LockedCamera: MapPlayer[] = []
    public static ALL_KITTIES_LIST: Kitty[] = []

    public static ALL_KITTIES: Map<MapPlayer, Kitty> = new Map()
    public static ALL_CIRCLES: Map<MapPlayer, Circle> = new Map()
    public static ALL_WOLVES: Map<Unit, Wolf> = new Map()

    public static PLAYER_UPGRADES: Map<MapPlayer, PlayerUpgrades> = new Map()

    public static SaveSystem: SaveManager
    public static GAME_AWARDS_SORTED: GameAwardsDataSorted = new GameAwardsDataSorted()
    public static GAME_TIMES: RoundTimesData = new RoundTimesData()
    public static GAME_STATS: GameStatsData = new GameStatsData()
    // public static GameTimesData SAVE_GAME_ROUND_DATA = new GameTimesData();

    public static ALL_TEAMS: Map<number, Team> = new Map()

    public static ALL_TEAMS_LIST: Team[] = []
    public static PLAYERS_TEAMS: Map<MapPlayer, Team> = new Map()
    public static TEAM_PROGRESS: Map<Team, string> = new Map()

    public static DATE_TIME_LOADED: boolean
    public static GAME_INITIALIZED: boolean

    // Round                         // Lane ,  // Updated # Wolves (+5% for all lanes, first 6 + 5%)
    public static WolvesPerRound: Map<number, { [lane: number]: number }> = new Map([
        [
            1,
            {
                0: 25,
                1: 25,
                2: 25,
                3: 25,
                4: 17,
                5: 16,
                6: 16,
                7: 15,
                8: 12,
                9: 12,
                10: 12,
                11: 7,
                12: 7,
                13: 6,
                14: 6,
                15: 2,
                16: 2,
            },
        ],
        [
            2,
            {
                0: 34,
                1: 34,
                2: 34,
                3: 34,
                4: 23,
                5: 22,
                6: 20,
                7: 19,
                8: 15,
                9: 15,
                10: 14,
                11: 10,
                12: 10,
                13: 8,
                14: 7,
                15: 3,
                16: 3,
            },
        ],
        [
            3,
            {
                0: 39,
                1: 39,
                2: 38,
                3: 38,
                4: 27,
                5: 26,
                6: 24,
                7: 22,
                8: 17,
                9: 17,
                10: 16,
                11: 12,
                12: 12,
                13: 8,
                14: 8,
                15: 3,
                16: 3,
            },
        ],
        [
            4,
            {
                0: 48,
                1: 48,
                2: 48,
                3: 46,
                4: 32,
                5: 31,
                6: 27,
                7: 26,
                8: 20,
                9: 20,
                10: 18,
                11: 14,
                12: 14,
                13: 10,
                14: 9,
                15: 4,
                16: 4,
            },
        ],
        [
            5,
            {
                0: 57,
                1: 57,
                2: 57,
                3: 57,
                4: 37,
                5: 35,
                6: 30,
                7: 29,
                8: 21,
                9: 21,
                10: 20,
                11: 16,
                12: 16,
                13: 11,
                14: 10,
                15: 5,
                16: 5,
            },
        ],
    ])

    /// <summary>
    /// Mock Data to Test Whatever lanes, and # of wolves as needed.
    /// </summary>
    // public static WolvesPerRound: Map<number, { [lane: number]: number> } = {
    //     // Round                         // Lane ,  // Updated # Wolves (+5% for all lanes, first 6 + 5%)
    //     1: { 0: 25, 1: 25, 2: 25, 3: 25, 4: 17, 5: 16, 6: 16, 7: 15, 8: 12, 9: 12, 10: 12, 11: 7, 12: 7, 13: 6, 14: 6, 15: 2, 16: 2 },
    //     2: { 0: 34, 1: 34, 2: 34, 3: 34, 4: 23, 5: 22, 6: 20, 7: 19, 8: 15, 9: 15, 10: 14, 11: 10, 12: 10, 13: 8, 14: 7, 15: 3, 16: 3 },
    //     3: { 0: 39, 1: 39, 2: 38, 3: 38, 4: 27, 5: 26, 6: 24, 7: 22, 8: 17, 9: 17, 10: 16, 11: 12, 12: 12, 13: 8, 14: 8, 15: 3, 16: 3 },
    //     4: { 0: 48, 1: 48, 2: 48, 3: 46, 4: 32, 5: 31, 6: 27, 7: 26, 8: 20, 9: 20, 10: 18, 11: 14, 12: 14, 13: 10, 14: 9, 15: 4, 16: 4 },
    //     5: { 0: 57, 1: 57, 2: 57, 3: 57, 4: 37, 5: 35, 6: 30, 7: 29, 8: 21, 9: 21, 10: 20, 11: 16, 12: 16, 13: 11, 14: 10, 15: 5, 16: 5 }
    // };
}
