import { Logger } from 'src/Events/Logger/Logger'
import { Globals } from 'src/Global/Globals'
import { ADMINDISABLE } from 'src/Init/ADMINDISABLE'
import { Colors } from 'src/Utility/Colors/Colors'
import { ColorUtils } from 'src/Utility/Colors/ColorUtils'
import { MapPlayer } from 'w3ts'
import { CurrentGameMode } from './CurrentGameMode'
import { GameMode } from './GameModeEnum'
import { Solo } from './Solo/Solo'
import { Standard } from './Standard/Standard'
import { Team } from './Teams/Team'

export class Gamemode {
    public static HostPlayer: MapPlayer
    public static IsGameModeChosen: boolean = false
    public static PlayersPerTeam = 0

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
            Colors.COLOR_GOLD + 'Please choose a gamemode.' + Colors.COLOR_RESET
        )

        // Standard Mode
        this.HostPlayer.DisplayTimedTextTo(
            Globals.TIME_TO_PICK_GAMEMODE,
            Colors.COLOR_YELLOW_ORANGE +
                GameMode[GameMode.Standard] + // Standard
                Colors.COLOR_GOLD +
                ' (-s)' +
                Colors.COLOR_RESET
        )

        // Solo Modes
        this.HostPlayer.DisplayTimedTextTo(
            Globals.TIME_TO_PICK_GAMEMODE,
            Colors.COLOR_YELLOW_ORANGE +
                GameMode[GameMode.SoloTournament] + // Solo
                Colors.COLOR_GOLD +
                ' (-solo: t <prog | race>)' +
                Colors.COLOR_RESET
        )

        // Team Modes
        this.HostPlayer.DisplayTimedTextTo(
            Globals.TIME_TO_PICK_GAMEMODE,
            Colors.COLOR_YELLOW_ORANGE +
                GameMode[GameMode.TeamTournament] + // Team
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
            Logger.Critical(`Error in Gamemode.SetGameMode: ${e}`)
        }
    }

    private static HostPickingGamemode() {
        let color = Colors.COLOR_YELLOW_ORANGE
        for (let player of Globals.ALL_PLAYERS) {
            let localplayer = GetLocalPlayer()
            if (localplayer !== this.HostPlayer.handle) {
                player.DisplayTimedTextTo(
                    Globals.TIME_TO_PICK_GAMEMODE,
                    `${color}Please wait for ${ColorUtils.PlayerNameColored(this.HostPlayer)}${color} to pick the gamemode. ${Colors.COLOR_RED}(Defaults to Standard in ${Globals.TIME_TO_PICK_GAMEMODE} seconds).|r`
                )
            }
        }
    }

    private static NotifyGamemodeChosen() {
        for (let player of Globals.ALL_PLAYERS) {
            player.DisplayTimedTextTo(
                Globals.TIME_TO_PICK_GAMEMODE / 3.0,
                Colors.COLOR_YELLOW_ORANGE +
                    'Gamemode chosen: ' +
                    Colors.COLOR_GOLD +
                    GameMode[CurrentGameMode.active] +
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
                Logger.Warning('Unknown gamemode selected, defaulting to Standard.')
                CurrentGameMode.active = GameMode.Standard
                Standard.Initialize()
                break
        }
    }
}
