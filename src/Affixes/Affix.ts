import { Wolf } from 'src/Game/Entities/Wolf'

export abstract class Affix {
    public Unit: Wolf
    public name: string = ''

    public constructor(unit: Wolf) {
        this.Unit = unit
    }

    public Apply() {
        // GC.GCAffixes.push(this);
    }

    public Remove() {
        // GC.RemoveAffix(this);
    }

    public abstract Pause(pause: boolean): void
}
