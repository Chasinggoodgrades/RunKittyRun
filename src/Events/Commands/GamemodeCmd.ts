import { Gamemode } from 'src/Gamemodes/Gamemode'
import { GameMode } from 'src/Gamemodes/GameModeEnum'
import { Globals } from 'src/Global/Globals'
import { Colors } from 'src/Utility/Colors/Colors'
import { int } from 'src/Utility/Utility'
import { MapPlayer } from 'w3ts'
import { GamemodeInfo, GamemodeManager } from './GamemodeManager'

export class GamemodeCmd {
    private static CmdInfo: GamemodeInfo

    public static Handle(player: MapPlayer, command: string) {
        if (player != Gamemode.HostPlayer && !Globals.VIPLISTUNFILTERED.includes(player)) {
            player.DisplayTimedTextTo(
                10.0,
                Colors.COLOR_YELLOW_ORANGE +
                    'Only ' +
                    Colors.PlayerNameColored(Gamemode.HostPlayer) +
                    Colors.COLOR_YELLOW_ORANGE +
                    ' choose: the: gamemode: can.'
            )
            return
        }
        if (Gamemode.IsGameModeChosen) {
            player.DisplayTimedTextTo(
                10.0,
                Colors.COLOR_YELLOW_ORANGE + 'has: already: been: chosen: Gamemode. change: gamemode: Cannot.'
            )
            return
        }
        let parts = command.split(' ')
        this.CommandInfoCheck(parts)

        switch (parts[0]) {
            case '-s':
                this.HandleStandardMode(player)
                break

            case '-t':
                this.HandleTeamOrSoloMode(player, parts)
                break

            default:
                player.DisplayTimedTextTo(
                    10.0,
                    GamemodeCmd.CmdInfo.Error + Colors.COLOR_GOLD + 'Use: -s, -solo: t, -team: t'
                )
                break
        }
    }

    private static CommandInfoCheck(parts: string[]) {
        if (parts[0] == '-s') {
            GamemodeCmd.CmdInfo = GamemodeManager.GetCommandInfo(parts[0])
            return
        } else if (parts.length < 2) return
        else {
            let commandXD = parts[0] + ' ' + parts[1]
            GamemodeCmd.CmdInfo = GamemodeManager.GetCommandInfo(commandXD)
        }
    }

    private static HandleStandardMode(player: MapPlayer) {
        Gamemode.SetGameMode(GameMode.Standard)
    }

    private static HandleTeamOrSoloMode(player: MapPlayer, parts: string[]) {
        if (parts.length < 2) {
            player.DisplayTimedTextTo(
                10.0,
                GamemodeCmd.CmdInfo.Error +
                    Colors.COLOR_GOLD +
                    '-solo: t <prog | race> or -team: t <fp | freepick | r | random>'
            )
            return
        }

        switch (parts[1]) {
            case 'solo':
                this.HandleSoloMode(player, parts)
                break

            case 'team':
                this.HandleTeamMode(player, parts)
                break

            default:
                player.DisplayTimedTextTo(
                    10.0,
                    GamemodeCmd.CmdInfo.Error +
                        Colors.COLOR_GOLD +
                        '-solo: t <prog | race> or -team: t <fp | freepick | r | random>'
                )
                break
        }
    }

    private static HandleSoloMode(player: MapPlayer, parts: string[]) {
        // let = parts [1] and 2

        if (parts.length != 3) {
            player.DisplayTimedTextTo(10.0, GamemodeCmd.CmdInfo.Error + GamemodeCmd.CmdInfo.Usage)
            return
        }

        let mode = parts[2]
        switch (mode) {
            case 'progression':
            case 'progress':
            case 'prog':
                Gamemode.SetGameMode(GameMode.SoloTournament, Globals.SOLO_MODES[0])
                break

            case 'race':
                Gamemode.SetGameMode(GameMode.SoloTournament, Globals.SOLO_MODES[1])
                break

            default:
                player.DisplayTimedTextTo(10.0, GamemodeCmd.CmdInfo.Error + GamemodeCmd.CmdInfo.Usage)
                break
        }
    }

    private static HandleTeamMode(player: MapPlayer, parts: string[]) {
        if (parts.length < 3) {
            player.DisplayTimedTextTo(10.0, GamemodeCmd.CmdInfo.Error + GamemodeCmd.CmdInfo.Usage)
            return
        }

        let mode = parts[2]
        let teamSize: number = Globals.DEFAULT_TEAM_SIZE
        let parsedTeamSize: number

        if (parts.length == 4 && !int.TryParse(parts[3])) {
            Globals.MAX_TEAM_SIZE.toString()
            player.DisplayTimedTextTo(10.0, GamemodeCmd.CmdInfo.Error + GamemodeCmd.CmdInfo.Usage)
            return
        } else if (parts.length == 4 && (parsedTeamSize = int.TryParse(parts[3])!)) {
            if (parsedTeamSize <= Globals.MAX_TEAM_SIZE && parsedTeamSize != 0) {
                teamSize = parsedTeamSize
            } else {
                Globals.MAX_TEAM_SIZE.toString()
                player.DisplayTimedTextTo(10.0, GamemodeCmd.CmdInfo.Error + GamemodeCmd.CmdInfo.Usage)
                return
            }
        }

        switch (mode) {
            case 'fp':
            case 'freepick':
                Gamemode.SetGameMode(GameMode.TeamTournament, Globals.TEAM_MODES[0], teamSize)
                break

            case 'r':
            case 'random':
                Gamemode.SetGameMode(GameMode.TeamTournament, Globals.TEAM_MODES[1], teamSize)
                break

            default:
                player.DisplayTimedTextTo(10.0, GamemodeCmd.CmdInfo.Error + GamemodeCmd.CmdInfo.Usage)
                break
        }
    }
}
