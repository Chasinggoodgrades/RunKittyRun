import { CurrentGameMode } from 'src/Gamemodes/CurrentGameMode'
import { GameMode } from 'src/Gamemodes/GameModeEnum'
import { Team } from 'src/Gamemodes/Teams/Team'
import { Globals } from 'src/Global/Globals'
import { Utility } from 'src/Utility/Utility'
import { Frame, Timer } from 'w3ts'

export class GameTimer {
    public static RoundTime: number[]
    public static RoundSpeedIncrement = 0.12
    private static GameTimeBar: Frame

    /// <summary>
    /// Sets up the game timer for the game lambdas the next function.
    /// </summary>
    public static Initialize = () => {
        Globals.GAME_TIMER_DIALOG.setTitle('Elapsed Game Time')
        GameTimer.GameTimeBar = Frame.fromName('ResourceBarSupplyText', 0)!
        GameTimer.RoundTime = []
        const t = Timer.create()
        t.start(GameTimer.RoundSpeedIncrement, true, GameTimer.StartGameTimer)
    }

    /// <summary>
    /// Ticks up the game timer every second while the game is active.
    /// </summary>
    private static StartGameTimer = () => {
        if (!Globals.GAME_ACTIVE) return

        Globals.GAME_SECONDS += GameTimer.RoundSpeedIncrement
        Globals.GAME_TIMER.start(Globals.GAME_SECONDS, false, () => {})
        Globals.GAME_TIMER.pause()

        GameTimer.RoundTime[Globals.ROUND] += GameTimer.RoundSpeedIncrement
        GameTimer.GameTimeBar.text = `${Utility.ConvertFloatToTimeInt(Globals.GAME_SECONDS)}`
        GameTimer.UpdatingTimes()
    }

    private static UpdatingTimes = () => {
        if (Globals.ROUND > Globals.NumberOfRounds) return
        GameTimer.UpdateIndividualTimes()
        GameTimer.UpdateTeamTimes()
    }

    private static UpdateIndividualTimes = () => {
        if (CurrentGameMode.active !== GameMode.SoloTournament) return
        for (let i = 0; i < Globals.ALL_KITTIES_LIST.length; i++) {
            const kitty = Globals.ALL_KITTIES_LIST[i]
            if (!kitty.Finished) kitty.TimeProg.IncrementRoundTime(Globals.ROUND)
        }
        //MultiboardUtil.RefreshMultiboards();
    }

    private static UpdateTeamTimes = () => {
        if (CurrentGameMode.active !== GameMode.TeamTournament) return
        for (let i = 0; i < Globals.ALL_TEAMS_LIST.length; i++) {
            const team = Globals.ALL_TEAMS_LIST[i]
            if (!team.Finished) {
                const teamTime = team.TeamTimes.get(Globals.ROUND)
                if (teamTime) {
                    team.TeamTimes.set(Globals.ROUND, teamTime + GameTimer.RoundSpeedIncrement)
                }
            }
        }
    }

    /// <summary>
    /// Returns a team's total time in seconds.
    /// </summary>
    /// <param name="team"></param>
    /// <returns></returns>
    public static TeamTotalTime = (team: Team) => {
        let totalTime = 0.0
        for (const [round, time] of team.TeamTimes) {
            totalTime += time
        }
        return totalTime
    }
}
