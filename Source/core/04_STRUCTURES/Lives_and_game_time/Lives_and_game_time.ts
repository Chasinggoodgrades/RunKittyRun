import { Constants } from 'core/01_libraries/Constants'
import { udg_colorCode } from 'core/01_libraries/Init_colorCodes'
import { Text } from 'core/01_libraries/Text'
import { ServiceManager } from 'Services'
import { createTimer } from 'Utils/mapUtils'
import { getUdgLevels } from '../../../../globals'
import { Natives } from '../../wc3_natives_unsecured/Natives'

export const LIVES_PLAYER = Natives.UPlayer(6) //Constants.GREEN

export type ILives = ReturnType<typeof initLives>

export const initLives = () => {
    let nb = Constants.NB_LIVES_AT_BEGINNING

    const initLives = () => {
        createTimer(0, false, () => {
            nb = getUdgLevels().get(0)?.getNbLives() || Constants.NB_LIVES_AT_BEGINNING
            ServiceManager.getService('Multiboard').updateLives(nb)
        })
    }

    //lives methods
    const get = () => nb

    const setNb = (nbLives: number) => {
        let wordLives: string
        if (nbLives < 0) {
            return false
        }
        nb = nbLives
        ServiceManager.getService('Multiboard').updateLives(nb)

        if (nbLives > 1) {
            wordLives = ' lives.'
        } else {
            wordLives = ' life.'
        }
        Text.A(udg_colorCode[GetPlayerId(LIVES_PLAYER)] + 'You have now ' + I2S(nbLives) + wordLives)
        return true
    }

    const add = (n: number) => {
        let wordLives: string

        if (n > 1) {
            wordLives = 'lives !'
        } else {
            wordLives = 'life.'
        }
        nb = nb + n
        Text.A(`${udg_colorCode[1]}You have earned ${I2S(n)} ${wordLives} (${I2S(nb)})`)
        ServiceManager.getService('Multiboard').updateLives(nb)
    }

    const loseALife = () => {
        nb = nb - 1
        ServiceManager.getService('Multiboard').updateLives(nb)
    }

    return { get, setNb, add, loseALife, initLives }
}
