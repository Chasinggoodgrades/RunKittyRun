import { Escaper } from '../../04_STRUCTURES/Escaper/Escaper'
import { Level } from '../../04_STRUCTURES/Level/Level'

export abstract class MakeAction {
    isActionMadeB: boolean
    owner?: Escaper
    protected level?: Level

    abstract cancel(): boolean
    abstract redo(): boolean
    abstract destroy(): void

    constructor(level?: Level) {
        this.level = level
        this.isActionMadeB = true
    }

    getLevel = () => {
        return this.level
    }
}
