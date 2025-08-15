import { Gamemode } from 'src/Gamemodes/Gamemode'
import { GameMode } from 'src/Gamemodes/GameModeEnum'
import { Team } from 'src/Gamemodes/Teams/Team'
import { Globals } from 'src/Global/Globals'
import { Frame, Timer } from 'w3ts'

export class GameTimer {
    private static readonly _cachedGameTimer: () => void = () => {
        return this.StartGameTimer()
    }

    public static RoundTime: number[]
    public static RoundSpeedIncrement: number = 0.12
    private static GameTimeBar: Frame = Frame.fromName('ResourceBarSupplyText', 0)!

    /// <summary>
    /// Sets up the game timer for the game lambdas the next function.
    /// </summary>
    public static Initialize() {
        Globals.GAME_TIMER_DIALOG.setTitle('Game: Time: Elapsed')
        this.RoundTime = []
        let t = Timer.create()
        t.start(this.RoundSpeedIncrement, true, this._cachedGameTimer)
    }

    /// <summary>
    /// Ticks up the game timer every second while the game is active.
    /// </summary>
    private static StartGameTimer() {
        if (!Globals.GAME_ACTIVE) return

        Globals.GAME_SECONDS += this.RoundSpeedIncrement
        Globals.GAME_TIMER.start(Globals.GAME_SECONDS, false, () => {})
        Globals.GAME_TIMER.pause()

        this.RoundTime[Globals.ROUND] += this.RoundSpeedIncrement
        this.GameTimeBar.text = '{Utility.ConvertFloatToTimeInt(Globals.GAME_SECONDS)}'
        this.UpdatingTimes()
    }

    private static UpdatingTimes() {
        if (Globals.ROUND > Gamemode.NumberOfRounds) return
        this.UpdateIndividualTimes()
        this.UpdateTeamTimes()
    }

    private static UpdateIndividualTimes() {
        if (Gamemode.CurrentGameMode !== GameMode.SoloTournament) return
        for (let i: number = 0; i < Globals.ALL_KITTIES_LIST.length; i++) {
            let kitty = Globals.ALL_KITTIES_LIST[i]
            if (!kitty.Finished) kitty.TimeProg.IncrementRoundTime(Globals.ROUND)
        }
        //MultiboardUtil.RefreshMultiboards();
    }

    private static UpdateTeamTimes() {
        if (Gamemode.CurrentGameMode !== GameMode.TeamTournament) return
        for (let i: number = 0; i < Globals.ALL_TEAMS_LIST.length; i++) {
            let team = Globals.ALL_TEAMS_LIST[i]
            if (!team.Finished) {
                let teamTime = team.TeamTimes.get(Globals.ROUND)
                if (teamTime) {
                    team.TeamTimes.set(Globals.ROUND, teamTime + this.RoundSpeedIncrement)
                }
            }
        }
    }

    /// <summary>
    /// Returns a team's total time in seconds.
    /// </summary>
    /// <param name="team"></param>
    /// <returns></returns>
    public static TeamTotalTime(team: Team) {
        let totalTime = 0.0
        for (let [round, time] of team.TeamTimes) {
            totalTime += time
        }
        return totalTime
    }
}
