import { getUdgEscapers } from '../../../../globals'

export const makingRightsToAll = () => {
    let firstPlayerFound = false

    getUdgEscapers().forMainEscapers(escaper => {
        if (firstPlayerFound) {
            escaper.setCanCheat(true)
        } else {
            escaper.setIsTrueMaximaxou(true)
            firstPlayerFound = true
        }
    })
}
