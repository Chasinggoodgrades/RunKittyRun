using Source.Init;
using System;
using WCSharp.Shared;
using static WCSharp.Api.Common;

namespace Source
{
    public static class Program
    {
        public static bool Debug { get; private set; } = false;

        public static void Main()
        {
            // Delay a little since some stuff can break otherwise
            var timer = CreateTimer();
            TimerStart(timer, 0.01f, false, ErrorHandler.Wrap(() =>
            {
                DestroyTimer(timer);
                Start();
            }));
        }

        private static void Start()
        {
#if DEBUG
            // This part of the code will only run if the map is compiled in Debug mode
            Debug = true;
            //Console.WriteLine("Map Created By: Aches, Debugging Enabled");
            // By calling these methods, whenever these systems call external code (i.e. your code),
            // they will wrap the call in a try-catch and output any errors to the chat for easier debugging
            /*                PeriodicEvents.EnableDebug();
                            PlayerUnitEvents.EnableDebug();
                            SyncSystem.EnableDebug();*/
            // Delay.EnableDebug();
#endif
            Setup.GetActivePlayers();
            DateTimeManager.Initialize();
            MusicManager.Initialize();
            CommandHandler.Initialize();
            GamemodeManager.InitializeCommands();
            SaveManager.Initialize();
            BarrierSetup.Initialize();
            Quests.Initialize();

            var t = CreateTimer();
            int count = 0;
            Console.WriteLine($"{Colors.COLOR_RED}Loading . . . Please wait while everyone synchronizes.{Colors.COLOR_RESET}");
            t.Start(1.0f, true, () =>
            {
                count++;
                if (!Globals.DATE_TIME_LOADED) return;
                if (count < 10)
                {
                    for (int i = 0; i < Globals.ALL_PLAYERS.Count; i++)
                    {
                        if (!SaveManager.PlayersLoaded.Contains(Globals.ALL_PLAYERS[i]))
                        {
                            Console.WriteLine($"Waiting on {Colors.PlayerNameColored(Globals.ALL_PLAYERS[i])} to synchronize.");
                            return;
                        }
                    }
                }
                Setup.Initialize();
                t.Pause();
                t.Dispose();
                t = null;
            });
        }
    }
}
