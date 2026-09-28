import { MemoryHandler } from 'Utils/MemoryHandler'
import { MakeOneByOneOrTwoClicks } from 'core/05_MAKE_STRUCTURES/Make/MakeOneByOneOrTwoClicks'
import { arrayPush } from '../../01_libraries/Basic_functions'
import { Text } from '../../01_libraries/Text'
import { Monster } from '../../04_STRUCTURES/Monster/Monster'
import { MakeDeleteMonstersAction } from '../MakeLastActions/MakeDeleteMonstersAction'

export class MakeDeleteMonsters extends MakeOneByOneOrTwoClicks {
    constructor(maker: unit, mode: string) {
        super(maker, 'deleteMonsters', mode, ['oneByOne', 'all', 'noMove', 'move', 'simplePatrol', 'multiplePatrols'])
    }

    doActions = () => {
        if (super.doBaseActions()) {
            //modes : oneByOne, all, noMove, move, simplePatrol, multiplePatrols
            let suppressedMonsters: Monster[] = []
            let nbMonstersRemoved = 0

            if (this.getMode() == 'oneByOne') {
                //mode oneClick
                let monster = this.escaper.getMakingLevel().monsters.getMonsterNear(this.orderX, this.orderY)
                if (monster) {
                    monster.delete()
                    arrayPush(suppressedMonsters, monster)
                    nbMonstersRemoved = 1
                }
            } else {
                //mode twoClics
                if (!this.isLastLocSavedUsed()) {
                    this.saveLoc(this.orderX, this.orderY)
                    return
                }

                let filterMonsterClassNameArr: string[] | undefined = undefined

                if (this.getMode() != 'all') {
                    filterMonsterClassNameArr = MemoryHandler.getEmptyArray()

                    if (this.getMode() == 'noMove') {
                        arrayPush(filterMonsterClassNameArr, 'MonsterNoMove')
                    } else {
                        if (this.getMode() == 'move' || this.getMode() == 'simplePatrol') {
                            arrayPush(filterMonsterClassNameArr, 'MonsterSimplePatrol')
                        }
                        if (this.getMode() == 'move' || this.getMode() == 'multiplePatrols') {
                            arrayPush(filterMonsterClassNameArr, 'MonsterMultiplePatrols')
                        }
                    }
                }

                const monsters = this.escaper
                    .getMakingLevel()
                    .monsters.getMonstersBetweenLocs(
                        this.lastX,
                        this.lastY,
                        this.orderX,
                        this.orderY,
                        filterMonsterClassNameArr
                    )

                if (filterMonsterClassNameArr) {
                    MemoryHandler.destroyArray(filterMonsterClassNameArr)
                }

                for (const monster of monsters) {
                    monster.delete()
                    arrayPush(suppressedMonsters, monster)
                }

                nbMonstersRemoved = monsters.length

                MemoryHandler.destroyArray(monsters)
            }

            if (nbMonstersRemoved <= 1) {
                Text.mkP(this.makerOwner, I2S(nbMonstersRemoved) + ' monster removed.')
            } else {
                Text.mkP(this.makerOwner, I2S(nbMonstersRemoved) + ' monsters removed.')
            }

            if (nbMonstersRemoved > 0) {
                this.escaper.newAction(new MakeDeleteMonstersAction(this.escaper.getMakingLevel(), suppressedMonsters))
            }
            this.unsaveLocDefinitely()
        }
    }
}
