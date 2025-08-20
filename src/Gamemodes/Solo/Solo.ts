import { Kitty } from 'src/Game/Entities/Kitty/Kitty'
import { ItemSpawner } from 'src/Game/Items/ItemSpawner'
import { Globals } from 'src/Global/Globals'
import { CurrentGameMode } from '../CurrentGameMode'
import { GameMode } from '../GameModeEnum'
import { SoloDeathTimer } from './SoloDeathTimer'

export class Solo {
    public static Initialize = () => {
        ItemSpawner.NUMBER_OF_ITEMS = 8
    }

    public static ReviveKittySoloTournament = (kitty: Kitty) => {
        if (CurrentGameMode.active !== GameMode.SoloTournament || Globals.CurrentGameModeType !== 'Race') return // Solo Gamemode & Race GamemodeType.
        new SoloDeathTimer(kitty.Player)
    }
}
