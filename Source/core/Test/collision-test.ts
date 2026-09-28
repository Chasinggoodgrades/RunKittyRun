import { Escaper } from '../04_STRUCTURES/Escaper/Escaper'
import { MonsterType } from '../04_STRUCTURES/Monster/MonsterType'
import { NewImmobileMonster } from '../04_STRUCTURES/Monster/Monster_functions'
import { createTimer } from '../../Utils/mapUtils'
import { arrayPush } from '../01_libraries/Basic_functions'

const MOB_COUNT_PER_CIRCLE = 12
const COLLISION_MIN = 0
const COLLISION_MAX = 200

export class CollisionTest {
    private escaper: Escaper
    private monsterType: MonsterType
    private radius: number
    private mobOffset: number
    private triggerFrequency: number
    private monsterUnits: unit[] = []
    private nbDeadMonsters = 0

    constructor(
        escaper: Escaper,
        monsterType: MonsterType,
        radius: number,
        mobOffset: number,
        triggerFrequency: number
    ) {
        this.escaper = escaper
        this.monsterType = monsterType
        this.radius = radius
        this.mobOffset = mobOffset
        this.triggerFrequency = triggerFrequency
    }

    start() {
        const hero = this.escaper.getHero()
        if (!hero || !IsUnitAliveBJ(hero)) {
            print("Can't start the collision test: hero is not alive.")
            return
        }

        this.enableGodModKills()
        this.createMobsAroundHero()
        this.progressivelyIncreaseInvisUnitCollisionSize()
    }

    enableGodModKills() {
        this.escaper.setGodMode(true)
        this.escaper.setGodModeKills(true)
    }

    createMobsAroundHero() {
        const heroX = GetUnitX(this.escaper.getHero()!)
        const heroY = GetUnitY(this.escaper.getHero()!)

        for (let currentRadius = 0; currentRadius <= this.radius; currentRadius += this.mobOffset) {
            for (let angle = 0; angle < 360; angle += 360 / MOB_COUNT_PER_CIRCLE) {
                const x = heroX + currentRadius * Math.cos(angle * (Math.PI / 180))
                const y = heroY + currentRadius * Math.sin(angle * (Math.PI / 180))

                arrayPush(this.monsterUnits, NewImmobileMonster(this.monsterType, x, y, angle + 180)) // look towards the hero
            }
        }
    }

    progressivelyIncreaseInvisUnitCollisionSize() {
        let currentCollisionSize = COLLISION_MIN

        this.escaper.setHeroCollisionSize(currentCollisionSize)
        createTimer(0.1, false, () => {
            const deadMobs = this.monsterUnits.filter(mobUnit => !IsUnitAliveBJ(mobUnit)).length
            const newDeadMobs = deadMobs - this.nbDeadMonsters
            this.nbDeadMonsters = deadMobs
            print('Collision size = |cff1ce6b9' + currentCollisionSize + '|r, new dead mobs = |cffff0303' + newDeadMobs)
        })

        const timer = createTimer(this.triggerFrequency, true, () => {
            currentCollisionSize += 4
            if (currentCollisionSize > COLLISION_MAX) {
                print('Collision test ended.')
                this.escaper.setHeroCollisionSize(COLLISION_MIN)

                timer.destroy()

                createTimer(4, false, () => {
                    for (const mobUnit of this.monsterUnits) {
                        RemoveUnit(mobUnit)
                    }
                })
            } else {
                this.escaper.setHeroCollisionSize(currentCollisionSize)

                createTimer(0.1, false, () => {
                    const deadMobs = this.monsterUnits.filter(mobUnit => !IsUnitAliveBJ(mobUnit)).length
                    const newDeadMobs = deadMobs - this.nbDeadMonsters
                    this.nbDeadMonsters = deadMobs
                    print(
                        'Collision size = |cff1ce6b9' +
                            currentCollisionSize +
                            '|r, new dead mobs = |cffff0303' +
                            newDeadMobs
                    )
                })
            }
        })
    }
}
