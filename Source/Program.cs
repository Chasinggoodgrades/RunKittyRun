using System;
using System.Globalization;
using System.Linq.Expressions;
using Source.Init;
using WCSharp.Api;
using WCSharp.Events;
using WCSharp.SaveLoad;
using WCSharp.Shared;
using WCSharp.Sync;
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
			TimerStart(timer, 0.01f, false, () =>
			{
				DestroyTimer(timer);
				Start();
			});
		}

		private static void Start()
		{
			try
			{
#if DEBUG
				// This part of the code will only run if the map is compiled in Debug mode
				Debug = true;
				//Console.WriteLine("Map Created By: Aches, Debugging Enabled");
				// By calling these methods, whenever these systems call external code (i.e. your code),
				// they will wrap the call in a try-catch and output any errors to the chat for easier debugging
				PeriodicEvents.EnableDebug();
				PlayerUnitEvents.EnableDebug();
				SyncSystem.EnableDebug();
				Delay.EnableDebug();
#endif
				Setup.GetActivePlayers();
				MusicManager.Initialize();
				FrameManager.Initialize();
				SaveManager.Initialize();
				DateTimeManager.Initialize();
				Setup.Initialize();
				CommandHandler.Initialize();
				CommandManager.InitializeCommands();
				BarrierSetup.Initialize();

            }
            catch (Exception ex)
			{
				DisplayTextToPlayer(GetLocalPlayer(), 0, 0, ex.Message);
			}
		}
	}
}
