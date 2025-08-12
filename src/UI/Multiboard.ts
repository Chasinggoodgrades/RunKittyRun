import { GameMode } from 'src/Gamemodes/GameModeEnum'

export class MultiboardManager {
    public static Initialize() {
        MultiboardManager.SetupMultiboards()
    }

    private static SetupMultiboards() {
        switch (Gamemode.CurrentGameMode) {
            case GameMode.Standard:
                StandardMultiboard.Initialize()
                break

            case GameMode.SoloTournament:
                SoloMultiboard.Initialize()
                break

            case GameMode.TeamTournament:
                TeamsMultiboard.Initialize()
                break
        }
    }
}
