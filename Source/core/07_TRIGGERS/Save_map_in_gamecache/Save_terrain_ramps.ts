import { arrayPush, IsNearBounds } from 'core/01_libraries/Basic_functions'
import { Constants } from 'core/01_libraries/Constants'
import { Text } from 'core/01_libraries/Text'
import { MemoryHandler } from 'Utils/MemoryHandler'
import { globals } from '../../../../globals'

const initSaveTerrainRamps = () => {
    const DECAL_TEST_PATH = 10

    /*
takes a ramp (ramp center + direction of the ramp)
returns if the ramp middle is raised
a ramp middle is not raised in some cases, depending of the cliff level around the ramp :
here is the ramp : (R = ramp tilepoint, N = near ramp tilepoint, T = basic tilepoint)
TNNNT
TRRRT
TNNNT
the middle R is at cliff level CL
if one of the N tilepoints is at a cliff level different than CL or CL+1, the ramp middle isn't raised
*/

    const loc1 = Location(0, 0)
    const loc2 = Location(0, 0)

    const isRampMiddleRaised = (x: number, y: number, isRampDirectionX: boolean): boolean => {
        let middleRampcliffLevel = GetTerrainCliffLevel(x, y)
        let diffCliffLevel: number
        let sens = -1
        let diff: number
        let x2: number
        let y2: number
        let isRampMiddleRaisedB = true

        //call CreateUnit(Player(0), 'hpea', x, y, 0)

        while (true) {
            if (sens > 1) break
            diff = -1
            while (true) {
                if (diff > 1) break
                if (isRampDirectionX) {
                    x2 = x + diff * Constants.LARGEUR_CASE
                    y2 = y + sens * Constants.LARGEUR_CASE
                } else {
                    x2 = x + sens * Constants.LARGEUR_CASE
                    y2 = y + diff * Constants.LARGEUR_CASE
                }
                diffCliffLevel = GetTerrainCliffLevel(x2, y2) - middleRampcliffLevel
                if (diffCliffLevel < 0 || diffCliffLevel > 1) {
                    isRampMiddleRaisedB = false
                }
                diff = diff + 1
            }
            sens = sens + 2
        }

        return isRampMiddleRaisedB
    }

    //save terrain ramps
    let cachedTerrainRamps = ''

    const SaveTerrainRamps = (json: { [x: string]: any }) => {
        if (cachedTerrainRamps !== '') {
            json.terrainRamps = cachedTerrainRamps
            return
        }

        const terrainRampsArr = MemoryHandler.getEmptyArray()

        let x: number
        let currentCliffLevel: number
        let otherCliffLevel: number
        let otherCliffLevel2: number
        let otherX: number
        let otherY: number
        let ramp: boolean
        let isRampMiddleRaisedB: boolean = false
        let rampStr: string
        let walkable: boolean
        let walkable2: boolean
        let signX: number
        let signY: number

        let y = globals.MAP_MIN_Y

        while (y <= globals.MAP_MAX_Y) {
            x = globals.MAP_MIN_X
            while (x <= globals.MAP_MAX_X) {
                ramp = false

                if (!IsNearBounds(x, y)) {
                    currentCliffLevel = GetTerrainCliffLevel(x, y)
                    isRampMiddleRaisedB = false

                    if (!isRampMiddleRaisedB) {
                        //droite
                        otherX = x + Constants.LARGEUR_CASE
                        otherY = y
                        if (otherX <= globals.MAP_MAX_X) {
                            otherCliffLevel = GetTerrainCliffLevel(otherX, otherY)

                            otherX = x + Constants.LARGEUR_CASE / 2
                            walkable =
                                !IsTerrainPathable(otherX, otherY + DECAL_TEST_PATH, PATHING_TYPE_WALKABILITY) ||
                                !IsTerrainPathable(otherX, otherY - DECAL_TEST_PATH, PATHING_TYPE_WALKABILITY)

                            if (currentCliffLevel !== otherCliffLevel) {
                                //il y a une falaise entre les deux ; si c'est walkable malgré tout, c'est qu'il y a une rampe
                                if (walkable) {
                                    ramp = true
                                } else if (IAbsBJ(currentCliffLevel - otherCliffLevel) === 1) {
                                    //ce n'est pas walkable, mais il y a peut-être une rampe, de largeur 1
                                    //si ce n'est pas walkable non plus en bas de la falaise, c'est qu'il y a une rampe
                                    if (currentCliffLevel > otherCliffLevel) {
                                        otherX = x + (3 * Constants.LARGEUR_CASE) / 2
                                    } else {
                                        otherX = x - Constants.LARGEUR_CASE / 2
                                    }
                                    walkable2 =
                                        !IsTerrainPathable(
                                            otherX,
                                            otherY + DECAL_TEST_PATH,
                                            PATHING_TYPE_WALKABILITY
                                        ) ||
                                        !IsTerrainPathable(otherX, otherY - DECAL_TEST_PATH, PATHING_TYPE_WALKABILITY)
                                    if (!walkable2) {
                                        //il y a une rampe à condition que les deux points en bas de la falaise soient au même niveau de falaise et pas à la même hauteur
                                        if (currentCliffLevel < otherCliffLevel) {
                                            MoveLocation(loc1, x, y)
                                            MoveLocation(loc2, x - Constants.LARGEUR_CASE, y)
                                        } else {
                                            MoveLocation(loc1, otherX, y)
                                            MoveLocation(loc2, otherX + Constants.LARGEUR_CASE, y)
                                        }
                                        if (
                                            GetLocationZ(loc1) !== GetLocationZ(loc2) && //todomax remove leak locations
                                            GetTerrainCliffLevelBJ(loc1) === GetTerrainCliffLevelBJ(loc2)
                                        ) {
                                            ramp = true
                                        }
                                    }
                                }
                                //s'il y a une rampe, on détermine si on est au milieu de la rampe
                                if (ramp) {
                                    if (currentCliffLevel < otherCliffLevel) {
                                        isRampMiddleRaisedB = isRampMiddleRaised(x, y, true)
                                    }
                                }
                            } else {
                                //il n'y a pas de falaise entre les deux ; si ce n'est pas walkable, il y a une rampe de largeur 1 s'il y a une falaise ensuite vers le haut de différence 1
                                if (!walkable) {
                                    otherX = x + Constants.LARGEUR_CASE * 2
                                    otherCliffLevel2 = GetTerrainCliffLevel(otherX, otherY)
                                    if (otherCliffLevel2 - currentCliffLevel === 1) {
                                        //il y a une rampe sauf si les deux points en bas de la falaise sont à la même hauteur
                                        MoveLocation(loc1, x, y)
                                        MoveLocation(loc2, x + Constants.LARGEUR_CASE, y)
                                        if (GetLocationZ(loc1) !== GetLocationZ(loc2)) {
                                            ramp = true
                                        }
                                    }
                                } else {
                                    //il peut y avoir une rampe s'il y a une falaise juste après, vers le haut et walkable
                                    otherX = x + Constants.LARGEUR_CASE * 2
                                    if (otherX <= globals.MAP_MAX_X) {
                                        otherCliffLevel2 = GetTerrainCliffLevel(otherX, otherY)
                                        if (currentCliffLevel < otherCliffLevel2) {
                                            otherX = otherX - Constants.LARGEUR_CASE / 2
                                            walkable2 =
                                                !IsTerrainPathable(
                                                    otherX,
                                                    otherY + DECAL_TEST_PATH,
                                                    PATHING_TYPE_WALKABILITY
                                                ) ||
                                                !IsTerrainPathable(
                                                    otherX,
                                                    otherY - DECAL_TEST_PATH,
                                                    PATHING_TYPE_WALKABILITY
                                                )
                                            if (walkable2) {
                                                ramp = true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    if (!isRampMiddleRaisedB) {
                        //gauche
                        otherX = x - Constants.LARGEUR_CASE
                        otherY = y
                        if (otherX >= globals.MAP_MIN_X) {
                            otherCliffLevel = GetTerrainCliffLevel(otherX, otherY)

                            otherX = x - Constants.LARGEUR_CASE / 2
                            walkable =
                                !IsTerrainPathable(otherX, otherY + DECAL_TEST_PATH, PATHING_TYPE_WALKABILITY) ||
                                !IsTerrainPathable(otherX, otherY - DECAL_TEST_PATH, PATHING_TYPE_WALKABILITY)

                            if (currentCliffLevel !== otherCliffLevel) {
                                //il y a une falaise entre les deux ; si c'est walkable malgré tout, c'est qu'il y a une rampe
                                if (walkable) {
                                    ramp = true
                                } else if (IAbsBJ(currentCliffLevel - otherCliffLevel) === 1) {
                                    //ce n'est pas walkable, mais il y a peut-être une rampe, de largeur 1
                                    //si ce n'est pas walkable non plus en bas de la falaise, c'est qu'il y a une rampe
                                    if (currentCliffLevel > otherCliffLevel) {
                                        otherX = x - (3 * Constants.LARGEUR_CASE) / 2
                                    } else {
                                        otherX = x + Constants.LARGEUR_CASE / 2
                                    }
                                    walkable2 =
                                        !IsTerrainPathable(
                                            otherX,
                                            otherY + DECAL_TEST_PATH,
                                            PATHING_TYPE_WALKABILITY
                                        ) ||
                                        !IsTerrainPathable(otherX, otherY - DECAL_TEST_PATH, PATHING_TYPE_WALKABILITY)
                                    if (!walkable2) {
                                        //il y a une rampe à condition que les deux points en bas de la falaise soient au même niveau de falaise et pas à la même hauteur
                                        if (currentCliffLevel < otherCliffLevel) {
                                            MoveLocation(loc1, x, y)
                                            MoveLocation(loc2, x + Constants.LARGEUR_CASE, y)
                                        } else {
                                            MoveLocation(loc1, otherX, y)
                                            MoveLocation(loc2, otherX - Constants.LARGEUR_CASE, y)
                                        }
                                        if (
                                            GetLocationZ(loc1) !== GetLocationZ(loc2) &&
                                            GetTerrainCliffLevelBJ(loc1) === GetTerrainCliffLevelBJ(loc2)
                                        ) {
                                            ramp = true
                                        }
                                    }
                                }
                                //s'il y a une rampe, on détermine si on est au milieu de la rampe
                                if (ramp) {
                                    if (currentCliffLevel < otherCliffLevel) {
                                        isRampMiddleRaisedB = isRampMiddleRaised(x, y, true)
                                    }
                                }
                            } else {
                                //il n'y a pas de falaise entre les deux ; si ce n'est pas walkable, il y a une rampe de largeur 1 s'il y a une falaise ensuite vers le haut de différence 1
                                if (!walkable) {
                                    otherX = x - Constants.LARGEUR_CASE * 2
                                    otherCliffLevel2 = GetTerrainCliffLevel(otherX, otherY)
                                    if (otherCliffLevel2 - currentCliffLevel === 1) {
                                        //il y a une rampe sauf si les deux points en bas de la falaise sont à la même hauteur
                                        MoveLocation(loc1, x, y)
                                        MoveLocation(loc2, x - Constants.LARGEUR_CASE, y)
                                        if (GetLocationZ(loc1) !== GetLocationZ(loc2)) {
                                            ramp = true
                                        }
                                    }
                                } else {
                                    //il peut y avoir une rampe s'il y a une falaise juste après, vers le haut et walkable
                                    otherX = x - Constants.LARGEUR_CASE * 2
                                    if (otherX >= globals.MAP_MIN_X) {
                                        otherCliffLevel2 = GetTerrainCliffLevel(otherX, otherY)
                                        if (currentCliffLevel < otherCliffLevel2) {
                                            otherX = otherX + Constants.LARGEUR_CASE / 2
                                            walkable2 =
                                                !IsTerrainPathable(
                                                    otherX,
                                                    otherY + DECAL_TEST_PATH,
                                                    PATHING_TYPE_WALKABILITY
                                                ) ||
                                                !IsTerrainPathable(
                                                    otherX,
                                                    otherY - DECAL_TEST_PATH,
                                                    PATHING_TYPE_WALKABILITY
                                                )
                                            if (walkable2) {
                                                ramp = true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    if (!isRampMiddleRaisedB) {
                        //haut
                        otherX = x
                        otherY = y + Constants.LARGEUR_CASE
                        if (otherY <= globals.MAP_MAX_Y) {
                            otherCliffLevel = GetTerrainCliffLevel(otherX, otherY)

                            otherY = y + Constants.LARGEUR_CASE / 2
                            walkable =
                                !IsTerrainPathable(otherX + DECAL_TEST_PATH, otherY, PATHING_TYPE_WALKABILITY) ||
                                !IsTerrainPathable(otherX - DECAL_TEST_PATH, otherY, PATHING_TYPE_WALKABILITY)

                            if (currentCliffLevel !== otherCliffLevel) {
                                //il y a une falaise entre les deux ; si c'est walkable malgré tout, c'est qu'il y a une rampe
                                if (walkable) {
                                    ramp = true
                                } else if (IAbsBJ(currentCliffLevel - otherCliffLevel) === 1) {
                                    //ce n'est pas walkable, mais il y a peut-être une rampe, de largeur 1
                                    //si ce n'est pas walkable non plus en bas de la falaise, c'est qu'il y a une rampe
                                    if (currentCliffLevel > otherCliffLevel) {
                                        otherY = y + (3 * Constants.LARGEUR_CASE) / 2
                                    } else {
                                        otherY = y - Constants.LARGEUR_CASE / 2
                                    }
                                    walkable2 =
                                        !IsTerrainPathable(
                                            otherX + DECAL_TEST_PATH,
                                            otherY,
                                            PATHING_TYPE_WALKABILITY
                                        ) ||
                                        !IsTerrainPathable(otherX - DECAL_TEST_PATH, otherY, PATHING_TYPE_WALKABILITY)
                                    if (!walkable2) {
                                        //il y a une rampe à condition que les deux points en bas de la falaise soient au même niveau de falaise et pas à la même hauteur
                                        if (currentCliffLevel < otherCliffLevel) {
                                            MoveLocation(loc1, x, y)
                                            MoveLocation(loc2, x, y - Constants.LARGEUR_CASE)
                                        } else {
                                            MoveLocation(loc1, x, otherY)
                                            MoveLocation(loc2, x, otherY + Constants.LARGEUR_CASE)
                                        }
                                        if (
                                            GetLocationZ(loc1) !== GetLocationZ(loc2) &&
                                            GetTerrainCliffLevelBJ(loc1) === GetTerrainCliffLevelBJ(loc2)
                                        ) {
                                            ramp = true
                                        }
                                    }
                                }
                                //s'il y a une rampe, on détermine si on est au milieu de la rampe
                                if (ramp) {
                                    if (currentCliffLevel < otherCliffLevel) {
                                        isRampMiddleRaisedB = isRampMiddleRaised(x, y, false)
                                    }
                                }
                            } else {
                                //il n'y a pas de falaise entre les deux ; si ce n'est pas walkable, il y a une rampe de largeur 1 s'il y a une falaise ensuite vers le haut de différence 1
                                if (!walkable) {
                                    otherY = y + Constants.LARGEUR_CASE * 2
                                    otherCliffLevel2 = GetTerrainCliffLevel(otherX, otherY)
                                    if (otherCliffLevel2 - currentCliffLevel === 1) {
                                        //il y a une rampe sauf si les deux points en bas de la falaise sont à la même hauteur
                                        MoveLocation(loc1, x, y)
                                        MoveLocation(loc2, x, y + Constants.LARGEUR_CASE)
                                        if (GetLocationZ(loc1) !== GetLocationZ(loc2)) {
                                            ramp = true
                                        }
                                    }
                                } else {
                                    //il peut y avoir une rampe s'il y a une falaise juste après, vers le haut et walkable
                                    otherY = y + Constants.LARGEUR_CASE * 2
                                    if (otherY <= globals.MAP_MAX_Y) {
                                        otherCliffLevel2 = GetTerrainCliffLevel(otherX, otherY)
                                        if (currentCliffLevel < otherCliffLevel2) {
                                            otherY = otherY - Constants.LARGEUR_CASE / 2
                                            walkable2 =
                                                !IsTerrainPathable(
                                                    otherX + DECAL_TEST_PATH,
                                                    otherY,
                                                    PATHING_TYPE_WALKABILITY
                                                ) ||
                                                !IsTerrainPathable(
                                                    otherX - DECAL_TEST_PATH,
                                                    otherY,
                                                    PATHING_TYPE_WALKABILITY
                                                )
                                            if (walkable2) {
                                                ramp = true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    if (!isRampMiddleRaisedB) {
                        //bas
                        otherX = x
                        otherY = y - Constants.LARGEUR_CASE
                        if (otherY >= globals.MAP_MIN_Y) {
                            otherCliffLevel = GetTerrainCliffLevel(otherX, otherY)

                            otherY = y - Constants.LARGEUR_CASE / 2
                            walkable =
                                !IsTerrainPathable(otherX + DECAL_TEST_PATH, otherY, PATHING_TYPE_WALKABILITY) ||
                                !IsTerrainPathable(otherX - DECAL_TEST_PATH, otherY, PATHING_TYPE_WALKABILITY)

                            if (currentCliffLevel !== otherCliffLevel) {
                                //il y a une falaise entre les deux ; si c'est walkable malgré tout, c'est qu'il y a une rampe
                                if (walkable) {
                                    ramp = true
                                } else if (IAbsBJ(currentCliffLevel - otherCliffLevel) === 1) {
                                    //ce n'est pas walkable, mais il y a peut-être une rampe, de largeur 1
                                    //si ce n'est pas walkable non plus en bas de la falaise, c'est qu'il y a une rampe
                                    if (currentCliffLevel > otherCliffLevel) {
                                        otherY = y - (3 * Constants.LARGEUR_CASE) / 2
                                    } else {
                                        otherY = y + Constants.LARGEUR_CASE / 2
                                    }
                                    walkable2 =
                                        !IsTerrainPathable(
                                            otherX + DECAL_TEST_PATH,
                                            otherY,
                                            PATHING_TYPE_WALKABILITY
                                        ) ||
                                        !IsTerrainPathable(otherX - DECAL_TEST_PATH, otherY, PATHING_TYPE_WALKABILITY)
                                    if (!walkable2) {
                                        //il y a une rampe à condition que les deux points en bas de la falaise soient au même niveau de falaise et pas à la même hauteur
                                        if (currentCliffLevel < otherCliffLevel) {
                                            MoveLocation(loc1, x, y)
                                            MoveLocation(loc2, x, y + Constants.LARGEUR_CASE)
                                        } else {
                                            MoveLocation(loc1, x, otherY)
                                            MoveLocation(loc2, x, otherY - Constants.LARGEUR_CASE)
                                        }
                                        if (
                                            GetLocationZ(loc1) !== GetLocationZ(loc2) &&
                                            GetTerrainCliffLevelBJ(loc1) === GetTerrainCliffLevelBJ(loc2)
                                        ) {
                                            ramp = true
                                        }
                                    }
                                }
                                //s'il y a une rampe, on détermine si on est au milieu de la rampe
                                if (ramp) {
                                    if (currentCliffLevel < otherCliffLevel) {
                                        isRampMiddleRaisedB = isRampMiddleRaised(x, y, false)
                                    }
                                }
                            } else {
                                //il n'y a pas de falaise entre les deux ; si ce n'est pas walkable, il y a une rampe de largeur 1 s'il y a une falaise ensuite vers le haut de différence 1
                                if (!walkable) {
                                    otherY = y - Constants.LARGEUR_CASE * 2
                                    otherCliffLevel2 = GetTerrainCliffLevel(otherX, otherY)
                                    if (otherCliffLevel2 - currentCliffLevel === 1) {
                                        //il y a une rampe sauf si les deux points en bas de la falaise sont à la même hauteur
                                        MoveLocation(loc1, x, y)
                                        MoveLocation(loc2, x, y - Constants.LARGEUR_CASE)
                                        if (GetLocationZ(loc1) !== GetLocationZ(loc2)) {
                                            ramp = true
                                        }
                                    }
                                } else {
                                    //il peut y avoir une rampe s'il y a une falaise juste après, vers le haut et walkable
                                    otherY = y - Constants.LARGEUR_CASE * 2
                                    if (otherY >= globals.MAP_MIN_Y) {
                                        otherCliffLevel2 = GetTerrainCliffLevel(otherX, otherY)
                                        if (currentCliffLevel < otherCliffLevel2) {
                                            otherY = otherY + Constants.LARGEUR_CASE / 2
                                            walkable2 =
                                                !IsTerrainPathable(
                                                    otherX + DECAL_TEST_PATH,
                                                    otherY,
                                                    PATHING_TYPE_WALKABILITY
                                                ) ||
                                                !IsTerrainPathable(
                                                    otherX - DECAL_TEST_PATH,
                                                    otherY,
                                                    PATHING_TYPE_WALKABILITY
                                                )
                                            if (walkable2) {
                                                ramp = true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    //rampes en diagonales
                    if (!ramp) {
                        signY = -1
                        while (true) {
                            if (ramp || signY > 1) break
                            signX = -1
                            while (true) {
                                if (ramp || signX > 1) break
                                otherX = x + Constants.LARGEUR_CASE * signX
                                otherY = y + Constants.LARGEUR_CASE * signY
                                otherCliffLevel = GetTerrainCliffLevel(otherX, otherY)
                                //call BJDebugMsg("signX : " + R2S(signX) + " ; signY : " + R2S(signY) + " ; x : " + R2S(otherX) + " ; y : " + R2S(otherY))
                                //on ne prend en compte que si ça monte et que c'est walkable
                                if (currentCliffLevel < otherCliffLevel) {
                                    otherX = x + (Constants.LARGEUR_CASE * signX) / 2
                                    otherY = y + (Constants.LARGEUR_CASE * signY) / 2
                                    walkable = !IsTerrainPathable(otherX, otherY, PATHING_TYPE_WALKABILITY)
                                    if (walkable) {
                                        ramp = true
                                    } else {
                                    }
                                }
                                signX = signX + 2
                            }
                            signY = signY + 2
                        }
                    }
                }

                if (ramp) {
                    if (isRampMiddleRaisedB) {
                        //call CreateUnit(Player(0), 'hpea', x, y, 0)
                        rampStr = '2'
                    } else {
                        //call CreateUnit(Player(1), 'hpea', x, y, 0)
                        rampStr = '1'
                    }
                } else {
                    rampStr = '0'
                }

                arrayPush(terrainRampsArr, rampStr)

                x = x + Constants.LARGEUR_CASE
            }
            y = y + Constants.LARGEUR_CASE
        }

        json.terrainRamps = cachedTerrainRamps = terrainRampsArr.join('')
        MemoryHandler.destroyArray(terrainRampsArr)

        Text.A('terrain ramps saved')
    }

    return { SaveTerrainRamps }
}

export const SaveTerrainRamps = initSaveTerrainRamps()
