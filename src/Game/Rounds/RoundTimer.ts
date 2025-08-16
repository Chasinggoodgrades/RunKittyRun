import { Logger } from 'src/Events/Logger/Logger'
import { CurrentGameMode } from 'src/Gamemodes/CurrentGameMode'
import { GameMode } from 'src/Gamemodes/GameModeEnum'
import { Globals } from 'src/Global/Globals'
import { Colors } from 'src/Utility/Colors/Colors'
import { ErrorHandler } from 'src/Utility/ErrorHandler'
import { Utility } from 'src/Utility/Utility'
import { Timer, TimerDialog } from 'w3ts'
import { RoundManager } from './RoundManager'

export class RoundTimer {
    public static ROUND_ENDTIMES: number[] = []
    public static StartRoundTimer = Timer.create()
    public static EndRoundTimer = Timer.create()
    public static RoundTimerDialog = TimerDialog.create(RoundTimer.StartRoundTimer)!
    private static EndRoundTimerDialog = TimerDialog.create(RoundTimer.EndRoundTimer)!
    private static CountdownTimer = Timer.create()

    public static InitEndRoundTimer() {
        try {
            if (CurrentGameMode.active === GameMode.Standard) return
            RoundTimer.SetEndRoundTimes()
            RoundTimer.EndRoundTimerDialog.setTitle('Round Time Remaining')
            RoundTimer.EndRoundTimerDialogs()
        } catch (e: any) {
            Logger.Warning(`InitEndRoundTimer ${e}`)
            throw e
        }
    }

    public static EndRoundTimerDialogs() {
        Globals.GAME_TIMER_DIALOG.display = false
        RoundTimer.EndRoundTimerDialog.display = false
        RoundTimer.RoundTimerDialog.setTitle('Starts in:')
        RoundTimer.RoundTimerDialog.display = true
    }

    public static StartEndRoundTimer() {
        if (CurrentGameMode.active === GameMode.Standard) return
        RoundTimer.EndRoundTimerDialog.display = true
        RoundTimer.EndRoundTimer.start(
            RoundTimer.ROUND_ENDTIMES[Globals.ROUND - 1],
            false,
            ErrorHandler.Wrap(() => RoundManager.RoundEnd())
        )
    }

    public static CountDown() {
        if (RoundTimer.StartRoundTimer.remaining > 0) {
            RoundTimer.CountdownTimer.start(
                1.0,
                false,
                ErrorHandler.Wrap(() => {
                    let RoundStartingString: string = `${Colors.COLOR_YELLOW_ORANGE}Round |r${Colors.COLOR_GREEN}${Globals.ROUND}|r${Colors.COLOR_YELLOW_ORANGE} begin: will in |r${Colors.COLOR_RED}${Math.round(RoundTimer.StartRoundTimer.remaining)}|r${Colors.COLOR_YELLOW_ORANGE} seconds.|r`
                    if (RoundTimer.StartRoundTimer.remaining % 5 <= 0.1 && RoundTimer.StartRoundTimer.remaining > 5)
                        Utility.TimedTextToAllPlayers(5.0, RoundStartingString)
                    if (RoundTimer.StartRoundTimer.remaining <= 5 && RoundTimer.StartRoundTimer.remaining > 0)
                        Utility.TimedTextToAllPlayers(1.0, RoundStartingString)
                    RoundTimer.CountDown()
                })
            )
        }
    }

    private static SetEndRoundTimes() {
        if (CurrentGameMode.active === GameMode.TeamTournament) {
            // Team
            RoundTimer.ROUND_ENDTIMES.push(720.0)
            RoundTimer.ROUND_ENDTIMES.push(720.0)
            RoundTimer.ROUND_ENDTIMES.push(1020.0)
            RoundTimer.ROUND_ENDTIMES.push(1500.0)
            RoundTimer.ROUND_ENDTIMES.push(1500.0)
        } else if (CurrentGameMode.active === GameMode.SoloTournament) {
            // Solo
            RoundTimer.ROUND_ENDTIMES.push(420.0)
            RoundTimer.ROUND_ENDTIMES.push(420.0)
            RoundTimer.ROUND_ENDTIMES.push(420.0)
            RoundTimer.ROUND_ENDTIMES.push(600.0)
            RoundTimer.ROUND_ENDTIMES.push(600.0)
        }
    }
}
