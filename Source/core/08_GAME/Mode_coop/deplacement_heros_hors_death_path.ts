import { getUdgTerrainTypes } from '../../../../globals'
import { Hero2Escaper } from '../../04_STRUCTURES/Escaper/Escaper_functions'

const initDeplacementHeroHorsDeathPath = () => {
    const GRADUATION_ANGLE = 5
    const VALEUR_DECALAGE = 60

    const DeplacementHeroHorsDeathPath = (hero: unit) => {
        let angle: number
        let angleIdeal: number
        let x: number
        let y: number
        let xDecal: number
        let yDecal: number
        const escaper = Hero2Escaper(hero)
        let xHero = escaper ? escaper.getHeroX() : GetUnitX(hero)
        let yHero = escaper ? escaper.getHeroY() : GetUnitY(hero)
        let nbPointsNonDeath: number
        let anglesCumules: number
        let premierAngleNonDeath = 0
        let dernierAngleNonDeath = 0
        let deuxiemePremierAngleNonDeath = 0
        let deuxiemeDernierAngleNonDeath = 0
        let angleNonDeathTrouveALInstant = false

        //vérification que le héros est sur le terrain qui tue
        if (getUdgTerrainTypes().getTerrainType(xHero, yHero)?.getKind() !== 'death') {
            return
        }

        //parcours des angles pour voir où se situent les terrains non death
        angle = 0
        while (true) {
            if (angle >= 360) break
            x = xHero + VALEUR_DECALAGE * CosBJ(angle)
            y = yHero + VALEUR_DECALAGE * SinBJ(angle)
            if (getUdgTerrainTypes().getTerrainType(x, y)?.getKind() !== 'death') {
                if (!angleNonDeathTrouveALInstant) {
                    if (dernierAngleNonDeath === 0) {
                        premierAngleNonDeath = angle
                    } else {
                        deuxiemePremierAngleNonDeath = angle
                    }
                    angleNonDeathTrouveALInstant = true
                }
            } else {
                if (angleNonDeathTrouveALInstant) {
                    if (dernierAngleNonDeath === 0) {
                        dernierAngleNonDeath = angle - GRADUATION_ANGLE
                    } else {
                        deuxiemeDernierAngleNonDeath = angle - GRADUATION_ANGLE
                    }
                    angleNonDeathTrouveALInstant = false
                }
            }
            angle = angle + GRADUATION_ANGLE
        }
        //ajout du dernier angle s'il est non death
        if (angleNonDeathTrouveALInstant) {
            if (dernierAngleNonDeath === 0) {
                dernierAngleNonDeath = angle - GRADUATION_ANGLE
            } else {
                deuxiemeDernierAngleNonDeath = angle - GRADUATION_ANGLE
            }
        }

        //calcul de l'angle idéal
        //cas simple où l'ensemble des angles non death ne passe pas par 0
        if (deuxiemePremierAngleNonDeath === 0) {
            //cas aucun angle non death trouvé
            if (dernierAngleNonDeath === 0) {
                return
            }
            angleIdeal = (dernierAngleNonDeath + premierAngleNonDeath) / 2
        } else {
            if (premierAngleNonDeath !== 0 || deuxiemeDernierAngleNonDeath !== 355) {
                if (
                    dernierAngleNonDeath - premierAngleNonDeath >
                    deuxiemeDernierAngleNonDeath - deuxiemePremierAngleNonDeath
                ) {
                    angleIdeal = (dernierAngleNonDeath + premierAngleNonDeath) / 2
                } else {
                    angleIdeal = (deuxiemeDernierAngleNonDeath + deuxiemePremierAngleNonDeath) / 2
                }
            } else {
                angleIdeal = (dernierAngleNonDeath + deuxiemePremierAngleNonDeath) / 2 + 180
            }
        }

        //déplacement du héros
        xDecal = xHero + VALEUR_DECALAGE * CosBJ(angleIdeal)
        yDecal = yHero + VALEUR_DECALAGE * SinBJ(angleIdeal)
        SetUnitPosition(hero, xDecal, yDecal)
    }

    return { DeplacementHeroHorsDeathPath }
}

export const DeplacementHeroHorsDeathPath = initDeplacementHeroHorsDeathPath()
