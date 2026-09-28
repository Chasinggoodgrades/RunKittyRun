import { MonsterType } from 'core/04_STRUCTURES/Monster/MonsterType'
import { Text } from '../../01_libraries/Text'
import { MonsterDirectionMode, MonsterSpawn } from '../../04_STRUCTURES/MonsterSpawn/MonsterSpawn'
import { HorizontalRegionDirection } from '../../04_STRUCTURES/Region/HorizontalRectangleRegion'
import { MECRegion } from '../../04_STRUCTURES/Region/MECRegion'
import { MakeMECRegion, MakeMECRegionMode } from '../Make_create_region/MakeMECRegion'

export type MakeMonsterSpawnKind = HorizontalRegionDirection | 'line' | 'rect' | 'parallelogram' | 'trapeze'

export function MakeMonsterSpawnKind2MakeMECRegionMode(kind: MakeMonsterSpawnKind): MakeMECRegionMode {
    let mode: MakeMECRegionMode = 'line'
    if (['up', 'down', 'left', 'right'].includes(kind)) {
        mode = 'horizRect'
    } else if (kind === 'line') {
        mode = 'line'
    } else if (kind === 'rect') {
        mode = 'rect'
    } else if (kind === 'parallelogram') {
        mode = 'parallelogram'
    } else if (kind === 'trapeze') {
        mode = 'trapeze'
    }

    return mode
}

export function MakeMonsterSpawnKind2DirectionForHorizontal(kind: MakeMonsterSpawnKind) {
    let directionForHorizontal: HorizontalRegionDirection = 'up'
    if (['up', 'down', 'left', 'right'].includes(kind)) {
        directionForHorizontal = kind as HorizontalRegionDirection
    }

    return directionForHorizontal
}

export class MakeMonsterSpawn extends MakeMECRegion {
    label: string
    monsterType: MonsterType
    kind: MakeMonsterSpawnKind
    frequency: number
    monsterDirectionMode: MonsterDirectionMode

    constructor(
        maker: unit,
        label: string,
        mt: MonsterType,
        kind: MakeMonsterSpawnKind,
        frequency: number,
        monsterDirectionMode: MonsterDirectionMode
    ) {
        super(maker, MakeMonsterSpawnKind2MakeMECRegionMode(kind), MakeMonsterSpawnKind2DirectionForHorizontal(kind))

        this.label = label
        this.monsterType = mt
        this.kind = kind
        this.frequency = frequency
        this.monsterDirectionMode = monsterDirectionMode
    }

    onMECRegionCreated(mecRegion: MECRegion) {
        mecRegion.setWithEnterAndLeaveZone(true)

        const level = this.escaper.getMakingLevel()

        const monsterSpawn = new MonsterSpawn(
            this.label,
            this.monsterType,
            mecRegion,
            this.frequency,
            this.monsterDirectionMode
        )

        level.monsterSpawns.new(monsterSpawn, true)

        Text.mkP(this.makerOwner, 'monster spawn "' + this.label + '" created')
        this.escaper.destroyMake()
    }

    getMakingMessage(): string {
        return `Define the ${this.mode} monster spawn area with ${this.requiredLocsNumber} click${this.requiredLocsNumber > 1 ? 's' : ''}`
    }
}
