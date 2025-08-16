import { SpawnChampions } from 'src/Game/Entities/Champions/SpawnChampions'
import { ShadowKitty } from 'src/Game/Entities/ShadowKitty'
import { Relic } from 'src/Game/Items/Relics/Relic'
import { RollerSkates } from 'src/Game/Items/RollerSkates'
import { ProtectionOfAncients } from 'src/Game/ProtectionOfAncients'
import { RoundManager } from 'src/Game/Rounds/RoundManager'
import { Difficulty } from 'src/Init/Difficulty/Difficulty'
import { EasterEggManager } from 'src/Rewards/EasterEggs/EasterEggManager'
import { AntiblockWand } from 'src/SpecialEffects/AntiblockWand'
import { Windwalk } from 'src/SpecialEffects/Windwalk'
import { PROD } from 'src/env'

export class Standard {
    private static ROUND_INTERMISSION: number = 10.0

    public static Initialize() {
        RoundManager.ROUND_INTERMISSION = !PROD ? 0.0 : this.ROUND_INTERMISSION
        ShadowKitty.Initialize()
        Difficulty.Initialize()
        Windwalk.Initialize()
        ProtectionOfAncients.Initialize()
        SpawnChampions.Initialize()
        RollerSkates.Initialize()
        EasterEggManager.LoadEasterEggs()
        AntiblockWand.Initialize()
        Relic.RegisterRelicEnabler()
    }
}
