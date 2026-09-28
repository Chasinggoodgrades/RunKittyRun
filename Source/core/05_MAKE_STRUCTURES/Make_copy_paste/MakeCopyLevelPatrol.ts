import { Text } from 'core/01_libraries/Text'
import { Level } from 'core/04_STRUCTURES/Level/Level'
import { MakeOneByOneOrTwoClicks } from 'core/05_MAKE_STRUCTURES/Make/MakeOneByOneOrTwoClicks'
import { getUdgLevels } from '../../../../globals'
import { MakeMonsterAction } from '../MakeLastActions/MakeMonsterAction'

export class MakeCopyLevelPatrol extends MakeOneByOneOrTwoClicks {
    private targetLevel: Level

    constructor(maker: unit, mode: string, targetLevel: Level) {
        super(maker, 'copyLevelPatrol', mode, ['oneByOne', 'all'])
        this.targetLevel = targetLevel
    }

    doActions = () => {
        if (super.doBaseActions()) {
            if (this.getMode() == 'oneByOne') {
                const monster = this.escaper.getMakingLevel().monsters.getMonsterNear(this.orderX, this.orderY)

                if (!monster) {
                    Text.mkP(this.makerOwner, 'no monster clicked')
                    return
                }

                const jsonM = monster.toJson()
                const m2 = getUdgLevels().newFromJsonMonster(
                    jsonM,
                    this.targetLevel,
                    this.targetLevel.isActivated(),
                    true
                )
                jsonM && jsonM.__destroy()

                if (m2) {
                    this.escaper.newAction(new MakeMonsterAction(this.targetLevel, m2))
                }

                Text.mkP(
                    this.makerOwner,
                    `Monster copied to level: ${this.targetLevel.getId()}, click on the next monster to copy`
                )

                this.escaper.destroyMake()
                this.escaper.makeCopyLevelPatrol(this.targetLevel, this.getMode())
            } else {
                if (!this.isLastLocSavedUsed()) {
                    this.saveLoc(this.orderX, this.orderY)
                    return
                }

                const monsters = this.escaper
                    .getMakingLevel()
                    .monsters.getMonstersBetweenLocs(this.lastX, this.lastY, this.orderX, this.orderY)

                for (const m of monsters) {
                    const jsonM = m.toJson()
                    const m2 = getUdgLevels().newFromJsonMonster(
                        jsonM,
                        this.targetLevel,
                        this.targetLevel.isActivated(),
                        true
                    )
                    jsonM && jsonM.__destroy()

                    if (m2) {
                        // todo; maybe use 1 global action?
                        this.escaper.newAction(new MakeMonsterAction(this.targetLevel, m2))
                    }
                }

                Text.mkP(
                    this.makerOwner,
                    `${
                        monsters.length
                    } monsters copied to level: ${this.targetLevel.getId()}, click on the next region to copy`
                )

                this.unsaveLocDefinitely()

                this.escaper.destroyMake()
                this.escaper.makeCopyLevelPatrol(this.targetLevel, this.getMode())
            }
        }
    }
}
