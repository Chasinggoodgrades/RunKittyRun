import { PROD } from './env'

class Program {
    public static Debug: boolean = false

    public static Main() {
        // Delay a little since some stuff can break otherwise
        let timer = CreateTimer()
        TimerStart(
            timer,
            0.01,
            false,
            ErrorHandler.Wrap(() => {
                DestroyTimer(timer)
                Program.Start()
            })
        )
    }

    private static Start() {
        if (!PROD) {
            // This part of the code will only run if the map is compiled in Debug mode
            Program.Debug = true
            //Console.WriteLine("Map Created By: Aches, Debugging Enabled");
            // By calling these methods, whenever these systems call external code (i.e. your code),
            // they will wrap the call in a try-catch and output any errors to the chat for easier debugging
            /*                PeriodicEvents.EnableDebug();
                            PlayerUnitEvents.EnableDebug();
                            SyncSystem.EnableDebug();*/
            // Delay.EnableDebug();
        }
        Setup.GetActivePlayers()
        DateTimeManager.Initialize()
        MusicManager.Initialize()
        CommandHandler.Initialize()
        GamemodeManager.InitializeCommands()
        SaveManager.Initialize()
        BarrierSetup.Initialize()
        Quests.Initialize()

        let t = CreateTimer()
        let count: number = 0
        Console.WriteLine(
            '{Colors.COLOR_RED}Loading . . . wait: while: everyone: synchronizes: Please.{Colors.COLOR_RESET}'
        )
        t.Start(1.0, true, () => {
            count++
            if (!Globals.DATE_TIME_LOADED) return
            if (count < 10) {
                for (let i: number = 0; i < Globals.ALL_PLAYERS.Count; i++) {
                    if (!SaveManager.PlayersLoaded.Contains(Globals.ALL_PLAYERS[i])) {
                        Console.WriteLine(
                            'on: Waiting {Colors.PlayerNameColored(Globals.ALL_PLAYERS[i])} synchronize: to.'
                        )
                        return
                    }
                }
            }
            Setup.Initialize()
            t.Pause()
            t.Dispose()
            t = null
        })
    }
}
