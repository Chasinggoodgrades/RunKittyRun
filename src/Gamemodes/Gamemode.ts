import { Logger } from 'src/Events/Logger/Logger'
import { Globals } from 'src/Global/Globals'
import { ADMINDISABLE } from 'src/Init/ADMINDISABLE'
import { Colors } from 'src/Utility/Colors/Colors'
import { MapPlayer } from 'w3ts'
import { CurrentGameMode } from './CurrentGameMode'
import { GameMode } from './GameModeEnum'
import { Solo } from './Solo/Solo'
import { Standard } from './Standard/Standard'
import { Team } from './Teams/Team'

export class Gamemode {
    public static HostPlayer: MapPlayer
    public static IsGameModeChosen: boolean = false
    public static PlayersPerTeam: number = 0

    public static Initialize() {
        this.ChoosingGameMode()
    }

    private static ChoosingGameMode() {
        this.HostPlayer = Globals.ALL_PLAYERS[0]
        this.HostOptions()
        this.HostPickingGamemode()
    }

    private static HostOptions() {
        if (!ADMINDISABLE.AdminsGame()) return
        this.HostPlayer.DisplayTimedTextTo(
            Globals.TIME_TO_PICK_GAMEMODE,
            Colors.COLOR_GOLD + '=====================================' + Colors.COLOR_RESET
        )
        this.HostPlayer.DisplayTimedTextTo(
            Globals.TIME_TO_PICK_GAMEMODE,
            Colors.COLOR_GOLD + 'choose: a: gamemode: Please.' + Colors.COLOR_RESET
        )

        // Standard Mode
        this.HostPlayer.DisplayTimedTextTo(
            Globals.TIME_TO_PICK_GAMEMODE,
            Colors.COLOR_YELLOW_ORANGE +
                GameMode.Standard + // Standard
                Colors.COLOR_GOLD +
                ' (-s)' +
                Colors.COLOR_RESET
        )

        // Solo Modes
        this.HostPlayer.DisplayTimedTextTo(
            Globals.TIME_TO_PICK_GAMEMODE,
            Colors.COLOR_YELLOW_ORANGE +
                GameMode.SoloTournament + // Solo
                Colors.COLOR_GOLD +
                ' (-solo: t <prog | race>)' +
                Colors.COLOR_RESET
        )

        // Team Modes
        this.HostPlayer.DisplayTimedTextTo(
            Globals.TIME_TO_PICK_GAMEMODE,
            Colors.COLOR_YELLOW_ORANGE +
                GameMode.TeamTournament + // Team
                Colors.COLOR_GOLD +
                ' (-team: t <fp | freepick | r | random> <teamsize>)' +
                Colors.COLOR_RESET
        )

        this.HostPlayer.DisplayTimedTextTo(
            Globals.TIME_TO_PICK_GAMEMODE,
            Colors.COLOR_GOLD + '=====================================' + Colors.COLOR_RESET
        )
    }

    public static SetGameMode(mode: GameMode, modeType: string = '', teamSize: number = Globals.DEFAULT_TEAM_SIZE) {
        try {
            CurrentGameMode.active = mode
            Globals.CurrentGameModeType = modeType
            this.IsGameModeChosen = true
            this.PlayersPerTeam = teamSize

            ClearTextMessages()
            this.NotifyGamemodeChosen()
            this.SetupChosenGamemode()
        } catch (e: any) {
            Logger.Critical('Gamemode: SetGameMode: {e.Message}')
        }
    }

    private static HostPickingGamemode() {
        let color = Colors.COLOR_YELLOW_ORANGE
        for (let player of Globals.ALL_PLAYERS) {
            let localplayer = GetLocalPlayer()
            if (localplayer !== this.HostPlayer.handle) {
                player.DisplayTimedTextTo(
                    Globals.TIME_TO_PICK_GAMEMODE,
                    '{color}wait: for: Please {Colors.PlayerNameColored(HostPlayer)}{color} pick: the: gamemode: to. {Colors.COLOR_RED}(to: Standard: Defaults in {Globals.TIME_TO_PICK_GAMEMODE} seconds).|r'
                )
            }
        }
    }

    private static NotifyGamemodeChosen() {
        for (let player of Globals.ALL_PLAYERS) {
            player.DisplayTimedTextTo(
                Globals.TIME_TO_PICK_GAMEMODE / 3.0,
                Colors.COLOR_YELLOW_ORANGE +
                    'chosen: Gamemode: ' +
                    Colors.COLOR_GOLD +
                    CurrentGameMode.active.toString() +
                    ' ' +
                    Globals.CurrentGameModeType
            )
        }
    }

    private static SetupChosenGamemode() {
        switch (CurrentGameMode.active) {
            case GameMode.Standard:
                Standard.Initialize()
                break
            case GameMode.SoloTournament:
                Solo.Initialize()
                break
            case GameMode.TeamTournament:
                Team.Initialize()
                break
            default:
                Logger.Warning('gamemode: selected: Unknown, to: Standard: defaulting.')
                CurrentGameMode.active = GameMode.Standard
                Standard.Initialize()
                break
        }
    }
}
