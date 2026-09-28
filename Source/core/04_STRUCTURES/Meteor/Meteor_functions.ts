import { StopUnit } from 'core/01_libraries/Basic_functions'
import { getUdgTerrainTypes } from '../../../../globals'
import { Hero2Escaper } from '../Escaper/Escaper_functions'
import { METEOR_CHEAT, METEOR_NORMAL } from './Meteor'

const initMeteorFunctions = () => {
    const HeroAddCheatMeteor = (hero: unit) => {
        const meteor = UnitAddItemById(hero, METEOR_CHEAT)
        if (!meteor) {
            throw new Error('HeroAddCheatMeteor: Failed to add meteor item to hero')
        }

        const escaper = Hero2Escaper(hero)

        // where every machine agrees the hero is: whether the item may be dropped belongs to the game
        if (
            escaper &&
            getUdgTerrainTypes().getTerrainType(escaper.getSyncedHeroX(), escaper.getSyncedHeroY())?.getKind() ==
                'slide'
        ) {
            SetItemDroppable(meteor, false)
        }

        return meteor
    }

    const HeroComingToSlide_CheckItem = (hero: unit) => {
        const meteor = UnitItemInSlot(hero, 0)

        if (meteor !== undefined) {
            SetItemDroppable(meteor, false)
        }
    }

    const HeroComingOutFromSlide_CheckItem = (hero: unit) => {
        const meteor = UnitItemInSlot(hero, 0)

        if (meteor !== undefined) {
            SetItemDroppable(meteor, true)
        }
    }

    const ExecuteRightClicOnUnit = (hero: unit, u: unit) => {
        let itemCarried = UnitItemInSlot(hero, 0)
        if (!itemCarried) {
            return
        }

        let itemCarriedType = GetItemTypeId(itemCarried)

        if ((itemCarriedType == METEOR_NORMAL || itemCarriedType == METEOR_CHEAT) && GetWidgetLife(u) > 0) {
            UnitUseItemTarget(hero, itemCarried, u)
        } else {
            StopUnit(hero)
        }
    }

    return { HeroAddCheatMeteor, HeroComingToSlide_CheckItem, HeroComingOutFromSlide_CheckItem, ExecuteRightClicOnUnit }
}

export const MeteorFunctions = initMeteorFunctions()
