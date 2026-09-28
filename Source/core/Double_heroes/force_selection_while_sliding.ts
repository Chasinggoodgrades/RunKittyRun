import { Constants } from 'core/01_libraries/Constants'
import { ForceSelectHeroes, GetMirrorEscaper } from 'core/04_STRUCTURES/Escaper/Escaper_functions'
import { createTimer } from 'Utils/mapUtils'
import { getUdgEscapers } from '../../../globals'
import { udg_doubleHeroesEnabled } from './double_heroes_config'

export const init_forceSelectionWhileSliding = () => {
    const ForceSelectionWhileSliding_Actions = () => {
        let escaper1
        let escaper2
        let isSelected1: boolean
        let isSelected2: boolean
        let i = 0

        if (udg_doubleHeroesEnabled) {
            while (true) {
                if (i >= Constants.NB_PLAYERS_MAX) break
                escaper1 = getUdgEscapers().get(i)
                if (escaper1 !== null) {
                    escaper2 = GetMirrorEscaper(escaper1)
                    if (escaper1.isSliding() || escaper2?.isSliding()) {
                        const h1 = escaper1.getHero()
                        const h2 = escaper2?.getHero()

                        isSelected1 = !!h1 && IsUnitSelected(h1, escaper1.getControler().getPlayer())
                        isSelected2 = !!h2 && !!escaper2 && IsUnitSelected(h2, escaper2.getControler().getPlayer())

                        if (isSelected1 !== isSelected2) {
                            //forcer la sélection des deux héros
                            ForceSelectHeroes(escaper1)
                        }
                    }
                }
                i = i + 1
            }
        }
    }

    createTimer(0.1, true, ForceSelectionWhileSliding_Actions)
}
