import { MemoryHandler } from 'Utils/MemoryHandler'
import { arrayPush } from 'core/01_libraries/Basic_functions'
import { getUdgEscapers, getUdgLevels } from '../../../../globals'
import { Escaper } from '../Escaper/Escaper'

const areMutuallyAllied = (a: Escaper, b: Escaper) => {
    return a.alliedState[b.getId()] && b.alliedState[a.getId()]
}

export const sameLevelProgression = (a: Escaper, b: Escaper) => {
    return (
        getUdgLevels().getLevelProgression() === 'all' ||
        (getUdgLevels().getLevelProgression() === 'allied' && areMutuallyAllied(b, a)) ||
        (getUdgLevels().getLevelProgression() === 'solo' && b.getId() === a.getId())
    )
}

export const getSameLevelProgressionPlayers = (a: Escaper) => {
    const output = MemoryHandler.getEmptyArray<Escaper>()

    for (const [_, b] of pairs(getUdgEscapers().getAll())) {
        if (sameLevelProgression(a, b)) {
            arrayPush(output, b)
        }
    }

    return output
}
