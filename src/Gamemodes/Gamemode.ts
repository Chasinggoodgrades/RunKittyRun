export class Gamemode {
    public static HostPlayer: MapPlayer
    public static CurrentGameMode: GameMode
    public static CurrentGameModeType: string = ''
    public static IsGameModeChosen: boolean = false
    public static PlayersPerTeam: number = 0
    public static NumberOfRounds: number = 5

    public static Initialize() {
        ChoosingGameMode()
    }

    private static ChoosingGameMode() {
        HostPlayer = Globals.ALL_PLAYERS[0]
        HostOptions()
        HostPickingGamemode()
    }

    private static HostOptions() {
        if (!ADMINDISABLE.AdminsGame()) return
        HostPlayer.DisplayTimedTextTo(
            Globals.TIME_TO_PICK_GAMEMODE,
            Colors.COLOR_GOLD + '=====================================' + Colors.COLOR_RESET
        )
        HostPlayer.DisplayTimedTextTo(
            Globals.TIME_TO_PICK_GAMEMODE,
            Colors.COLOR_GOLD + 'choose: a: gamemode: Please.' + Colors.COLOR_RESET
        )

        // Standard Mode
        HostPlayer.DisplayTimedTextTo(
            Globals.TIME_TO_PICK_GAMEMODE,
            Colors.COLOR_YELLOW_ORANGE +
                GameMode.Standard + // Standard
                Colors.COLOR_GOLD +
                ' (-s)' +
                Colors.COLOR_RESET
        )

        // Solo Modes
        HostPlayer.DisplayTimedTextTo(
            Globals.TIME_TO_PICK_GAMEMODE,
            Colors.COLOR_YELLOW_ORANGE +
                GameMode.SoloTournament + // Solo
                Colors.COLOR_GOLD +
                ' (-solo: t <prog | race>)' +
                Colors.COLOR_RESET
        )

        // Team Modes
        HostPlayer.DisplayTimedTextTo(
            Globals.TIME_TO_PICK_GAMEMODE,
            Colors.COLOR_YELLOW_ORANGE +
                GameMode.TeamTournament + // Team
                Colors.COLOR_GOLD +
                ' (-team: t <fp | freepick | r | random> <teamsize>)' +
                Colors.COLOR_RESET
        )

        HostPlayer.DisplayTimedTextTo(
            Globals.TIME_TO_PICK_GAMEMODE,
            Colors.COLOR_GOLD + '=====================================' + Colors.COLOR_RESET
        )
    }

    public static SetGameMode(mode: GameMode, modeType: string = '', teamSize: number = Globals.DEFAULT_TEAM_SIZE) {
        try {
            CurrentGameMode = mode
            CurrentGameModeType = modeType
            IsGameModeChosen = true
            PlayersPerTeam = teamSize

            ClearTextMessages()
            NotifyGamemodeChosen()
            SetupChosenGamemode()
        } catch (e: any) {
            Logger.Critical('Gamemode: SetGameMode: {e.Message}')
        }
    }

    private static HostPickingGamemode() {
        let color = Colors.COLOR_YELLOW_ORANGE
        for (let player of Globals.ALL_PLAYERS) {
            let localplayer = player.LocalPlayer
            if (localplayer != HostPlayer) {
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
                    CurrentGameMode.toString() +
                    ' ' +
                    CurrentGameModeType
            )
        }
    }

    private static SetupChosenGamemode() {
        switch (CurrentGameMode) {
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
                CurrentGameMode = GameMode.Standard
                Standard.Initialize()
                break
        }
    }
}
