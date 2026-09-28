import { Constants } from 'core/01_libraries/Constants'
import { forRange } from 'Utils/mapUtils'
import { getUdgEscapers } from '../../../../globals'

const initAutoContinueAfterSliding = () => {
    let lastClickedX: number[] = []
    let lastClickedY: number[] = []
    let lastClickedWidgets: (widget | null)[] = []
    let isLastTargetALocation: boolean[] = []
    let udg_autoContinueAfterSliding: boolean[] = []

    forRange(Constants.NB_ESCAPERS, i => (udg_autoContinueAfterSliding[i] = true))

    const ECART_MAX_ANGLE = 45

    const AutoContinueAfterSliding = (n: number) => {
        const escaper = getUdgEscapers().get(n)
        const hero = escaper?.getHero()

        if (!escaper || !hero) {
            return
        }

        if (!lastClickedY[n] || !lastClickedX[n]) {
            return
        }

        //vérification de l'angle
        let angleHero2Target =
            Atan2(lastClickedY[n] - escaper.getHeroY(), lastClickedX[n] - escaper.getHeroX()) * bj_RADTODEG
        let diffAngle = RAbsBJ(angleHero2Target - escaper.getHeroFacing())
        if (diffAngle > ECART_MAX_ANGLE && diffAngle < 360 - ECART_MAX_ANGLE) {
            return
        }

        //cas dernier clic : un point
        if (isLastTargetALocation[n]) {
            IssuePointOrder(hero, 'move', lastClickedX[n], lastClickedY[n])

            //cas dernier clic : pas un point
        } else {
            const lastClickedWidget = lastClickedWidgets[n]

            //dernier widget cliqué n'existe pas (donc aucun clic effectué pendant le slide)
            if (lastClickedWidget === null) {
                return
            } else {
                //cible n'a pas bougé
                if (
                    GetWidgetX(lastClickedWidget) === lastClickedX[n] &&
                    GetWidgetY(lastClickedWidget) === lastClickedY[n]
                ) {
                    //ordre clic droit vers cible
                    IssueTargetOrder(hero, 'smart', lastClickedWidget)
                } else {
                    //bouger vers ancien endroit du widget
                    IssuePointOrder(hero, 'move', lastClickedX[n], lastClickedY[n])
                }
            }
        }
    }

    const ClearLastClickSave = (n: number) => {
        isLastTargetALocation[n] = false
        lastClickedWidgets[n] = null
    }

    return {
        lastClickedX,
        lastClickedY,
        lastClickedWidgets,
        isLastTargetALocation,
        udg_autoContinueAfterSliding,
        AutoContinueAfterSliding,
        ClearLastClickSave,
    }
}

export const AutoContinueAfterSliding = initAutoContinueAfterSliding()
