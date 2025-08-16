import { CurrentGameMode } from 'src/Gamemodes/CurrentGameMode'
import { GameMode } from 'src/Gamemodes/GameModeEnum'
import { FandF } from './F&F/FandF'
import { CrystalOfFire } from './Fieryfox/CrystalOfFire'
import { MissingShoe } from './Fieryfox/MissingShoe'
import { NoKittyLeftBehind } from './NoKittyLeftBehind'
import { UrnSoul } from './UrnSoul'

export class EasterEggManager {
    public static LoadEasterEggs() {
        if (CurrentGameMode.active !== GameMode.Standard) return
        MissingShoe.Initialize()
        NoKittyLeftBehind.Initialize()
        FandF.Initialize()
        CrystalOfFire.Initialize()
        UrnSoul.Initialize()
    }
}
