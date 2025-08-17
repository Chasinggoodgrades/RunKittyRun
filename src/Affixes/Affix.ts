import { Wolf } from 'src/Game/Entities/Wolf'

export abstract class Affix {
    public Unit: Wolf
    public name: string = ''

    public constructor(unit: Wolf) {
        this.Unit = unit
    }

    public abstract Apply: () => void

    public abstract Remove: () => void

    public abstract pause(pause: boolean): void
}
