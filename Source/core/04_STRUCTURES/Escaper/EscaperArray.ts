import { IsEscaperInGame } from 'core/01_libraries/Basic_functions'
import { Constants } from 'core/01_libraries/Constants'
import { BaseArray } from '../BaseArray'
import type { Level } from '../Level/Level'
import { Escaper } from './Escaper'

export class EscaperArray extends BaseArray<Escaper> {
    constructor() {
        super(false)

        for (let escaperId = 0; escaperId < Constants.NB_ESCAPERS; escaperId++) {
            if (IsEscaperInGame(escaperId)) {
                this.data[escaperId] = new Escaper(escaperId)
            }
        }
    }

    countMain = () => {
        let n = 0

        for (const [_k, _v] of pairs(this.data)) {
            if (!_v.isEscaperSecondary()) {
                n++
            }
        }

        return n
    }

    newAt = (id: number) => {
        if (id < 0 || id >= Constants.NB_ESCAPERS) {
            return
        }

        if (this.data[id]) {
            return
        }

        this.data[id] = new Escaper(id)
    }

    removeEscaper = (id: number) => {
        delete this.data[id]
    }

    destroyEscaper = (id: number) => {
        if (this.data[id]) {
            this.data[id].destroy()
        }

        delete this.data[id]
    }

    forMainEscapers(callback: (escaper: Escaper) => void) {
        for (const [_, escaper] of pairs(this.data)) {
            if (!escaper.isEscaperSecondary()) {
                callback(escaper)
            }
        }
    }

    deleteSpecificActionsForLevel = (level: Level) => {
        for (const [_, escaper] of pairs(this.data)) {
            escaper.deleteSpecificActionsForLevel(level)
        }
    }

    destroyMakesIfForSpecificLevel_currentLevel = () => {
        //destroy le make des this.escapers si c'est un make pour spécifique level et que l'escaper make pour le "current_level"
        for (const [_, escaper] of pairs(this.data)) {
            escaper.isMakingCurrentLevel() && escaper.destroyMakeIfForSpecificLevel()
        }
    }
}
