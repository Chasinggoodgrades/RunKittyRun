import { Logger } from 'src/Events/Logger/Logger'
import { RoundManager } from 'src/Game/Rounds/RoundManager'
import { Globals } from 'src/Global/Globals'
import { GameSeed } from 'src/Init/GameSeed'
import { Colors } from 'src/Utility/Colors/Colors'
import { MapPlayer } from 'w3ts'
import { Gamemode } from '../Gamemode'
import { Team } from './Team'

export class TeamHandler {
    public static FreepickEnabled: boolean = false

    public static Handler(Player: MapPlayer, TeamNumber: number, adminForced: boolean = false) {
        if (
            Globals.CurrentGameModeType === Globals.TEAM_MODES[0] &&
            (adminForced || (!RoundManager.GAME_STARTED && this.FreepickEnabled))
        ) {
            this.FreepickHandler(Player, TeamNumber, adminForced)
        } else {
            Player.DisplayTextTo(
                `${Colors.COLOR_YELLOW_ORANGE}The -team command is not available for this gamemode or the time to pick has expired.${Colors.COLOR_RESET}`
            )
        }
    }

    private static FreepickHandler(Player: MapPlayer, TeamNumber: number, adminForced: boolean) {
        if (this.CanPlayerJoinTeam(Player, TeamNumber)) {
            this.ApplyPlayerToTeam(Player, TeamNumber)
        }
    }

    private static ApplyPlayerToTeam(Player: MapPlayer, TeamNumber: number) {
        const team = Globals.ALL_TEAMS.get(TeamNumber)
        if (team) {
            team.AddMember(Player)
            Player.DisplayTextTo(
                `${Colors.COLOR_YELLOW_ORANGE}You have joined team ${team.TeamColor}${Colors.COLOR_RESET}`
            )
        }
    }

    /// <summary>
    /// Throws all players who are currently not on a team into a random team. Prioritizing already made teams before creating new ones.
    /// </summary>
    public static RandomHandler() {
        this.FreepickEnabled = false
        let shuffled = GameSeed.Shuffle(Globals.ALL_PLAYERS, Globals.GAME_SEED)
        let teamNumber = 1
        try {
            for (let i: number = 0; i < shuffled.length; i++) {
                let player = shuffled[i]

                let currentTeam = Globals.PLAYERS_TEAMS.get(player)
                if (currentTeam) {
                    continue
                }
                let addedToExistingTeam: boolean = false

                // Attempt to add player to an existing team
                for (let j: number = 0; j < Globals.ALL_TEAMS_LIST.length; j++) {
                    let team = Globals.ALL_TEAMS_LIST[j]
                    if (team.Teammembers.length < Gamemode.PlayersPerTeam) {
                        team.AddMember(player)
                        addedToExistingTeam = true
                        break
                    }
                }

                if (!addedToExistingTeam) {
                    // Create new teams as needed
                    while (
                        Globals.ALL_TEAMS.has(teamNumber) &&
                        Globals.ALL_TEAMS.get(teamNumber)!.Teammembers.length >= Gamemode.PlayersPerTeam
                    ) {
                        teamNumber++
                    }

                    // Check if the team exists, if not create it
                    let team = Globals.ALL_TEAMS.get(teamNumber)
                    if (!team) {
                        team = new Team(teamNumber)
                    }

                    // Add the player to the new team
                    team.AddMember(player)
                }
            }
        } catch (e: any) {
            Logger.Critical(`Error in TeamHandler.RandomHandler: ${e}`)
        }
    }

    private static CanPlayerJoinTeam(Player: MapPlayer, TeamNumber: number) {
        if (TeamNumber > 24) {
            Player.DisplayTextTo(`${Colors.COLOR_YELLOW_ORANGE}Usage: -team 1-24${Colors.COLOR_RESET}`)
            return false
        }

        // If the team exists, we're going to check if full or if that player is already on the team
        let team = Globals.ALL_TEAMS.get(TeamNumber)
        if (team) {
            // If Team is full, return.
            if (team.Teammembers.length >= Gamemode.PlayersPerTeam) {
                Player.DisplayTextTo(`${team.TeamColor}${Colors.COLOR_YELLOW_ORANGE} is full.${Colors.COLOR_RESET}`)
                return false
            }
            // If player is on the team they're trying to join.. Return.
            let currentTeam = Globals.PLAYERS_TEAMS.get(Player)
            if (currentTeam) {
                if (currentTeam.TeamID === TeamNumber) {
                    Player.DisplayTextTo(
                        `${Colors.COLOR_YELLOW_ORANGE}You are already on ${team.TeamColor}${Colors.COLOR_RESET}`
                    )
                    return false
                }

                // If not the same team.. Remove them so they're ready to join another.
                this.RemoveFromCurrentTeam(Player)
            }
        }
        // If team doesnt exist, we're going to remove the player from current team and create that new team.
        else {
            this.RemoveFromCurrentTeam(Player)
            new Team(TeamNumber)
        }
        return true
    }

    private static RemoveFromCurrentTeam(Player: MapPlayer) {
        let team = Globals.PLAYERS_TEAMS.get(Player)
        if (team) {
            team.RemoveMember(Player)
        }
    }
}
