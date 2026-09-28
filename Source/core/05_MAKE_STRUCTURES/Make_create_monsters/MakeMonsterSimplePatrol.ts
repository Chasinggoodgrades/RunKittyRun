import { GetLocDist } from 'core/01_libraries/Basic_functions'
import { Constants } from 'core/01_libraries/Constants'
import { Text } from 'core/01_libraries/Text'
import { Monster } from '../../04_STRUCTURES/Monster/Monster'
import { createMonsterSmartPatrol } from '../../04_STRUCTURES/Monster/MonsterSimplePatrol'
import { MonsterType } from '../../04_STRUCTURES/Monster/MonsterType'
import { IsTerrainTypeOfKind } from '../../04_STRUCTURES/TerrainType/Terrain_type_functions'
import { MakeOneByOneOrTwoClicks } from '../Make/MakeOneByOneOrTwoClicks'
import { MakeMonsterAction } from '../MakeLastActions/MakeMonsterAction'

export class MakeMonsterSimplePatrol extends MakeOneByOneOrTwoClicks {
    private static MIN_DIST = 5
    private static MAX_DIST = 2000
    private static ECART_DIST = 32
    private static ECART_ANGLE = 9
    private static DIST_ON_TERRAIN_MAX = 300
    private static DIST_ON_TERRAIN_DEFAULT = 50
    private static distOnTerrain: number = 50

    private mt: MonsterType
    private forcedAngle: number | undefined = undefined

    constructor(maker: unit, mode: string, mt: MonsterType, angle?: number) {
        super(maker, 'monsterCreateSimplePatrol', mode, ['normal', 'string', 'auto'])

        if (!mt) {
            throw this.constructor.name + ' : monster type required'
        }

        this.mt = mt
        this.forcedAngle = angle
    }

    getMonsterType = (): MonsterType => {
        return this.mt
    }

    //for "auto" mode
    static changeDistOnTerrain(newDist: number) {
        if (newDist < 0 || newDist > MakeMonsterSimplePatrol.DIST_ON_TERRAIN_MAX) {
            return false
        }

        MakeMonsterSimplePatrol.distOnTerrain = newDist
        return true
    }

    //for "auto" mode
    static changeDistOnTerrainDefault() {
        MakeMonsterSimplePatrol.distOnTerrain = MakeMonsterSimplePatrol.DIST_ON_TERRAIN_DEFAULT
    }

    doActions = () => {
        if (super.doBaseActions()) {
            let monster: Monster | null = null
            let x1: number = 0
            let y1: number = 0
            let x2: number = 0
            let y2: number = 0
            let dist: number = 0
            let angle: number = 0
            let found: boolean

            //normal or string modes
            if (['normal', 'string'].includes(this.getMode())) {
                if (this.isLastLocSavedUsed()) {
                    if (GetLocDist(this.lastX, this.lastY, this.orderX, this.orderY) <= Constants.PATROL_DISTANCE_MIN) {
                        Text.erP(this.makerOwner, 'Too close to the start location !')
                        return
                    } else {
                        monster = createMonsterSmartPatrol(
                            this.getMonsterType(),
                            this.lastX,
                            this.lastY,
                            this.orderX,
                            this.orderY
                        )

                        if (this.getMode() == 'normal') {
                            this.unsaveLocDefinitely()
                        } else {
                            //string
                            this.saveLoc(this.orderX, this.orderY)
                        }
                    }
                } else {
                    this.saveLoc(this.orderX, this.orderY)
                }
            }

            //auto mode
            if (this.getMode() == 'auto') {
                if (IsTerrainTypeOfKind(GetTerrainType(this.orderX, this.orderY), 'death')) {
                    Text.erP(this.makerOwner, 'You clicked on a death terrain !')
                    return
                }

                //find approximatively first location
                found = false
                dist = MakeMonsterSimplePatrol.MIN_DIST
                while (true) {
                    if (found || dist > MakeMonsterSimplePatrol.MAX_DIST) break

                    if (this.forcedAngle) {
                        angle = this.forcedAngle
                        x1 = this.orderX + dist * CosBJ(angle)
                        y1 = this.orderY + dist * SinBJ(angle)
                        found = IsTerrainTypeOfKind(GetTerrainType(x1, y1), 'death')
                        if (found) break
                    } else {
                        angle = 0
                        x1 = this.orderX + dist * CosBJ(angle)
                        y1 = this.orderY + dist * SinBJ(angle)
                        found = IsTerrainTypeOfKind(GetTerrainType(x1, y1), 'death')
                        if (found) break

                        angle = 90
                        x1 = this.orderX + dist * CosBJ(angle)
                        y1 = this.orderY + dist * SinBJ(angle)
                        found = IsTerrainTypeOfKind(GetTerrainType(x1, y1), 'death')
                        if (found) break

                        angle = 180
                        x1 = this.orderX + dist * CosBJ(angle)
                        y1 = this.orderY + dist * SinBJ(angle)
                        found = IsTerrainTypeOfKind(GetTerrainType(x1, y1), 'death')
                        if (found) break

                        angle = 270
                        x1 = this.orderX + dist * CosBJ(angle)
                        y1 = this.orderY + dist * SinBJ(angle)
                        found = IsTerrainTypeOfKind(GetTerrainType(x1, y1), 'death')
                        if (found) break

                        angle = 1
                        while (true) {
                            if (found || angle >= 360) break
                            x1 = this.orderX + dist * CosBJ(angle)
                            y1 = this.orderY + dist * SinBJ(angle)
                            found = IsTerrainTypeOfKind(GetTerrainType(x1, y1), 'death')
                            angle = angle + MakeMonsterSimplePatrol.ECART_ANGLE
                        }
                        angle = angle - MakeMonsterSimplePatrol.ECART_ANGLE
                    }

                    dist = dist + MakeMonsterSimplePatrol.ECART_DIST
                }

                //first location not found
                if (!found) {
                    Text.erP(this.makerOwner, 'Death terrain too far !')
                    return
                }

                //precise position of first location
                while (true) {
                    if (!IsTerrainTypeOfKind(GetTerrainType(x1, y1), 'death')) break
                    dist = dist - 1
                    x1 = this.orderX + dist * CosBJ(angle)
                    y1 = this.orderY + dist * SinBJ(angle)
                }
                dist = dist + MakeMonsterSimplePatrol.distOnTerrain + 1
                x1 = this.orderX + dist * CosBJ(angle)
                y1 = this.orderY + dist * SinBJ(angle)

                //prepare angle for the second location
                if (angle >= 180) {
                    angle = angle - 180
                } else {
                    angle = angle + 180
                }

                //find approximatively second location
                found = false
                dist = MakeMonsterSimplePatrol.MIN_DIST
                while (true) {
                    if (found || dist > MakeMonsterSimplePatrol.MAX_DIST) break
                    x2 = this.orderX + dist * CosBJ(angle)
                    y2 = this.orderY + dist * SinBJ(angle)
                    found = IsTerrainTypeOfKind(GetTerrainType(x2, y2), 'death')
                    dist = dist + MakeMonsterSimplePatrol.ECART_DIST
                }

                //second location not found
                if (!found) {
                    Text.erP(this.makerOwner, 'Death terrain too far for the second location !')
                    return
                }

                //precise position of second location
                while (true) {
                    if (!IsTerrainTypeOfKind(GetTerrainType(x2, y2), 'death')) break
                    dist = dist - 1
                    x2 = this.orderX + dist * CosBJ(angle)
                    y2 = this.orderY + dist * SinBJ(angle)
                }
                dist = dist + MakeMonsterSimplePatrol.distOnTerrain + 1
                x2 = this.orderX + dist * CosBJ(angle)
                y2 = this.orderY + dist * SinBJ(angle)

                //the two locations were found, creating monster
                monster = createMonsterSmartPatrol(
                    this.getMonsterType(),
                    x1 + GetRandomInt(-4, 4),
                    y1 + GetRandomInt(-4, 4),
                    x2 + GetRandomInt(-4, 4),
                    y2 + GetRandomInt(-4, 4)
                )
            }

            if (monster) {
                this.escaper.getMakingLevel().monsters.new(monster, true)
                this.escaper.newAction(new MakeMonsterAction(this.escaper.getMakingLevel(), monster))
            }
        }
    }
}
