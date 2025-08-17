import { CurrentGameMode } from 'src/Gamemodes/CurrentGameMode'
import { GameMode } from 'src/Gamemodes/GameModeEnum'
import { SoloMultiboard } from './Multiboard/SoloMultiboard'
import { StandardMultiboard } from './Multiboard/StandardMultiboard'
import { TeamsMultiboard } from './Multiboard/TeamsMultiboard'

export class MultiboardManager {
    public static Initialize = () => {
        MultiboardManager.SetupMultiboards()
    }

    private static SetupMultiboards = () => {
        switch (CurrentGameMode.active) {
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
