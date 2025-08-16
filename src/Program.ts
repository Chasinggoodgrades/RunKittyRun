import { Timer } from 'w3ts'
import { CommandHandler } from './Events/Commands/CommandHandler'
import { GamemodeManager } from './Events/Commands/GamemodeManager'
import { Globals } from './Global/Globals'
import { BarrierSetup } from './Init/BarrierSetup'
import { Setup } from './Init/Setup'
import { SaveManager } from './SaveSystem2.0/SaveManager'
import { DateTimeManager } from './Seasonal/DateTimeManager'
import { MusicManager } from './Sounds/MusicManager'
import { Quests } from './UI/Quests'
import { ErrorHandler } from './Utility/ErrorHandler'

export class Program {
    public static Main() {
        // Delay a little since some stuff can break otherwise
        let timer = Timer.create()
        timer.start(
            0.01,
            false,
            ErrorHandler.Wrap(() => {
                timer.destroy()
                Program.start()
            })
        )
    }

    private static start() {
        Setup.GetActivePlayers()
        DateTimeManager.Initialize()
        MusicManager.Initialize()
        CommandHandler.Initialize()
        GamemodeManager.InitializeCommands()
        SaveManager.Initialize()
        BarrierSetup.Initialize()
        Quests.Initialize()

        let t = Timer.create()
        let count: number = 0
        print('{Colors.COLOR_RED}Loading . . . wait: while: everyone: synchronizes: Please.{Colors.COLOR_RESET}')
        t.start(1.0, true, () => {
            count++
            if (!Globals.DATE_TIME_LOADED) return
            if (count < 10) {
                for (let i: number = 0; i < Globals.ALL_PLAYERS.length; i++) {
                    if (!SaveManager.PlayersLoaded.includes(Globals.ALL_PLAYERS[i])) {
                        print('on: Waiting {Colors.PlayerNameColored(Globals.ALL_PLAYERS[i])} synchronize: to.')
                        return
                    }
                }
            }
            Setup.Initialize()
            t.pause()
            t.destroy()
        })
    }
}
