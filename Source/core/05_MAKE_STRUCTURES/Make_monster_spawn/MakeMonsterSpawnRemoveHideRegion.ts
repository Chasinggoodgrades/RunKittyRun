import { Make } from '../Make/Make'
import { MonsterSpawn } from '../../04_STRUCTURES/MonsterSpawn/MonsterSpawn'
import { Text } from '../../01_libraries/Text'
import { MakeMonsterSpawnRemoveHideRegionAction } from '../MakeLastActions/MakeMonsterSpawnRemoveHideRegionAction'

export class MakeMonsterSpawnRemoveHideRegion extends Make {
    private monsterSpawn: MonsterSpawn

    constructor(maker: unit, monsterSpawn: MonsterSpawn) {
        super(maker, 'getMonsterInfo', false)
        this.monsterSpawn = monsterSpawn
    }

    doActions = () => {
        if (super.doBaseActions()) {
            const hideRegion = this.monsterSpawn.getMostLittleHideRegionAtPosition(this.orderX, this.orderY)

            if (hideRegion) {
                this.monsterSpawn.removeHideRegion(hideRegion, false)
                this.escaper.newAction(
                    new MakeMonsterSpawnRemoveHideRegionAction(
                        this.escaper.getMakingLevel(),
                        this.monsterSpawn,
                        hideRegion
                    )
                )

                Text.mkP(this.makerOwner, 'Hide region removed')
            } else {
                Text.mkP(
                    this.makerOwner,
                    'No hide region found at click location for monster spawn "' + this.monsterSpawn.getLabel() + '"'
                )
            }
        }
    }
}
