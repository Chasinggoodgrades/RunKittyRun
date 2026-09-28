import { Text } from '../../01_libraries/Text'
import { MONSTER_NEAR_DIFF_MAX } from '../../04_STRUCTURES/Monster/MonsterArray'
import { Make } from '../Make/Make'

// Single-click flow resolving a click to a hand-placed Monster's id, mirroring MakeGetMonsterInfo's proximity
// resolution (level.monsters.getMonsterNear only ever contains hand-placed monsters, never MonsterSpawn-
// generated ones - see onEscaperTouchingMonster). Used by createTerrainSaveEvent/editTerrainSaveEvent's
// monsterTouch target selection - the id is never typed by the player, only ever resolved by clicking.
export class MakeSelectMonsterForEvent extends Make {
    private onSelected: (this: void, monsterId: number) => void

    constructor(maker: unit, onSelected: (this: void, monsterId: number) => void) {
        super(maker, 'selectMonsterForEvent', false)
        this.onSelected = onSelected
    }

    doActions = () => {
        if (super.doBaseActions()) {
            const level = this.escaper.getMakingLevel()
            const monster = level.monsters.getMonsterNear(this.orderX, this.orderY)

            if (!monster) {
                Text.erP(
                    this.makerOwner,
                    `No hand-placed monster found near click location (max range: ${MONSTER_NEAR_DIFF_MAX})`
                )
                return
            }

            this.onSelected(monster.getId())
            this.escaper.destroyMake()
        }
    }

    getMakingMessage(): string {
        return 'Click on a hand-placed monster to target it'
    }
}
