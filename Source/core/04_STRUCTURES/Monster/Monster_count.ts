import { Monster } from './Monster'
import { MonsterMultiplePatrols } from './MonsterMultiplePatrols'
import { MonsterNoMove } from './MonsterNoMove'
import { MonsterSimplePatrol } from './MonsterSimplePatrol'

export const countMonstersAccordingToMode = (monsters: { [x: number]: Monster }, mode?: string) => {
    if (!mode) mode = 'all'

    let n = 0

    for (const [_, monster] of pairs(monsters)) {
        if (mode === 'all') {
            n++
        } else if (
            mode === 'moving' &&
            (monster instanceof MonsterSimplePatrol || monster instanceof MonsterMultiplePatrols)
        ) {
            n++
        } else if (mode === 'not moving' && monster instanceof MonsterNoMove) {
            n++
        }
    }

    return n
}
