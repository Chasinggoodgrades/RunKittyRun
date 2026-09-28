import { MakeMECRegion, MakeMECRegionMode } from '../Make_create_region/MakeMECRegion'
import { MonsterSpawn } from '../../04_STRUCTURES/MonsterSpawn/MonsterSpawn'
import { MECRegion } from '../../04_STRUCTURES/Region/MECRegion'
import { Text } from '../../01_libraries/Text'
import { MakeMonsterSpawnHideRegionAction } from '../MakeLastActions/MakeMonsterSpawnHideRegionAction'

export class MakeMonsterSpawnHideRegion extends MakeMECRegion {
    monsterSpawn: MonsterSpawn
    mecRegionMode: MakeMECRegionMode

    constructor(maker: unit, monsterSpawn: MonsterSpawn, mecRegionMode: MakeMECRegionMode) {
        super(maker, mecRegionMode)

        this.monsterSpawn = monsterSpawn
        this.mecRegionMode = mecRegionMode
    }

    onMECRegionCreated(mecRegion: MECRegion) {
        this.monsterSpawn.addHideRegion(mecRegion)
        this.escaper.newAction(
            new MakeMonsterSpawnHideRegionAction(this.escaper.getMakingLevel(), this.monsterSpawn, mecRegion)
        )

        Text.mkP(
            this.makerOwner,
            `${this.mecRegionMode} dead zone added for monster spawn "${this.monsterSpawn.getLabel()}"`
        )
    }

    getMakingMessage(): string {
        return `Define the ${this.mode} monster spawn dead zone with ${this.requiredLocsNumber} click${this.requiredLocsNumber > 1 ? 's' : ''}`
    }
}
