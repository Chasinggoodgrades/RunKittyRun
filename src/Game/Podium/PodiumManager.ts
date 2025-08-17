import { CurrentGameMode } from 'src/Gamemodes/CurrentGameMode'
import { GameMode } from 'src/Gamemodes/GameModeEnum'
import { SoloPodium } from './SoloPodium'
import { StandardPodium } from './StandardPodium'
import { TeamPodium } from './TeamPodium'

export class PodiumManager {
    public static BeginPodiumEvents = () => {
        switch (CurrentGameMode.active) {
            case GameMode.Standard:
                StandardPodium.BeginPodiumActions()
                break

            case GameMode.SoloTournament:
                SoloPodium.BeginPodiumActions()
                break

            case GameMode.TeamTournament:
                TeamPodium.BeginPodiumActions()
                break
        }
    }
}
