import { Constants } from 'core/01_libraries/Constants'
import { getUdgEscapers } from '../../../../globals'

const initDisco = () => {
    const ApplyRandomColor = (n: number) => {
        const esc = getUdgEscapers().get(n)

        if (!esc) {
            return
        }

        esc.setBaseColorDisco(GetRandomInt(0, Constants.NB_PLAYERS_MAX))
        esc.setVcRed(GetRandomPercentageBJ())
        esc.setVcGreen(GetRandomPercentageBJ())
        esc.setVcBlue(GetRandomPercentageBJ())
        esc.setVcTransparency(GetRandomReal(0, 25))

        esc.getHero() && esc.updateUnitVertexColor()
    }

    const Disco_Actions = (n: number) => {
        ApplyRandomColor(n)
    }

    return { Disco_Actions }
}

export const Disco = initDisco()
