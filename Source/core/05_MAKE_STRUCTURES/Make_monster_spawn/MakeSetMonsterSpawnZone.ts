import { Text } from '../../01_libraries/Text'
import { MonsterSpawn } from '../../04_STRUCTURES/MonsterSpawn/MonsterSpawn'
import { MakeMECRegion } from '../Make_create_region/MakeMECRegion'
import { MECRegion } from '../../04_STRUCTURES/Region/MECRegion'
import {
    MakeMonsterSpawnKind,
    MakeMonsterSpawnKind2DirectionForHorizontal,
    MakeMonsterSpawnKind2MakeMECRegionMode,
} from './MakeMonsterSpawn'

export class MakeSetMonsterSpawnZone extends MakeMECRegion {
    monsterSpawn: MonsterSpawn
    kind: MakeMonsterSpawnKind

    constructor(maker: unit, monsterSpawn: MonsterSpawn, kind: MakeMonsterSpawnKind) {
        super(maker, MakeMonsterSpawnKind2MakeMECRegionMode(kind), MakeMonsterSpawnKind2DirectionForHorizontal(kind))

        this.monsterSpawn = monsterSpawn
        this.kind = kind
    }

    onMECRegionCreated(mecRegion: MECRegion) {
        mecRegion.setWithEnterAndLeaveZone(true)

        this.monsterSpawn.setMECRegion(mecRegion)

        Text.mkP(this.makerOwner, 'monster spawn "' + this.monsterSpawn.getLabel() + '" zone updated')
        this.escaper.destroyMake()
    }

    getMakingMessage(): string {
        return `Define the ${this.mode} monster spawn area with ${this.requiredLocsNumber} click${this.requiredLocsNumber > 1 ? 's' : ''}`
    }
}
