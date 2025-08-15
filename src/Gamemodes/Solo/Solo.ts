import { Kitty } from 'src/Game/Entities/Kitty/Kitty'
import { ItemSpawner } from 'src/Game/Items/ItemSpawner'
import { RoundManager } from 'src/Game/Rounds/RoundManager'
import { Globals } from 'src/Global/Globals'
import { Gamemode } from '../Gamemode'
import { GameMode } from '../GameModeEnum'
import { SoloDeathTimer } from './SoloDeathTimer'

export class Solo {
    public static Initialize() {
        ItemSpawner.NUMBER_OF_ITEMS = 8
    }

    public static ReviveKittySoloTournament(kitty: Kitty) {
        if (Gamemode.CurrentGameMode !== GameMode.SoloTournament || Gamemode.CurrentGameModeType !== 'Race') return // Solo Gamemode & Race GamemodeType.
        new SoloDeathTimer(kitty.Player)
    }

    public static RoundEndCheck() {
        if (Gamemode.CurrentGameModeType !== Globals.SOLO_MODES[0]) return // Progression mode

        for (let i: number = 0; i < Globals.ALL_PLAYERS.length; i++) {
            let kitty = Globals.ALL_KITTIES.get(Globals.ALL_PLAYERS[i])!
            if (kitty.isAlive()) return
        }
        RoundManager.RoundEnd()
    }
}
