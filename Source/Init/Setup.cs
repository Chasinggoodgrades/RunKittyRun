using WCSharp.Api;
using static WCSharp.Api.Common;

namespace Source.Init
{

    public static class Setup
    {

        private static float timeToChoose = 0.0f;
        private static timer gameModeTimer;

        public static void Initialize()
        {
            GetActivePlayers();
            Gamemode.Initialize();
            Safezone.Initialize();
            StartGameModeTimer();

        }

        private static void StartGameModeTimer()
        {
            gameModeTimer = CreateTimer();
            gameModeTimer.Start(1.0f, true, ChoosingGameMode);
        }

        private static void ChoosingGameMode()
        {
            timeToChoose++;
            if (timeToChoose == Globals.TIME_TO_PICK_GAMEMODE)
                Gamemode.SetGameMode(Globals.GAME_MODES[0]);
            if (Gamemode.IsGameModeChosen)
            {
                StartGame();
                gameModeTimer.Pause();
                gameModeTimer.Dispose();
            }
        }

        private static void StartGame()
        {
            FogEnable(false);
            FogMaskEnable(false);
            SetFloatGameState(GAME_STATE_TIME_OF_DAY, 12);
            SuspendTimeOfDay(true);
            CustomStatFrame.Init();
            Resources.Initialize();
            Multiboard.Initialize();
            Shops.Initialize(); 
            WolfArea.Initialize();
            SoundManager.Initialize();
            Kitty.Initialize();
            RelicManager.Initialize();
            ProtectionOfAncients.Initialize();
            PlayerLeaves.Initialize();
            FloatingNameTag.Initialize();
            GameTimer.Initialize();
            VictoryZone.Initialize();
            AffixFactory.Initialize();
            ItemSpawner.Initialize();
            RoundManager.Initialize();
        }

        private static void GetActivePlayers()
        {
            for (int i = 0; i < GetBJMaxPlayers(); i++)
            {
                if (GetPlayerSlotState(Player(i)) == playerslotstate.Playing)
                    Globals.ALL_PLAYERS.Add(Player(i));
            }
        }

    }
}
