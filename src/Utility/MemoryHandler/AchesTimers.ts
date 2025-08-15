import { Logger } from 'src/Events/Logger/Logger'
import { Timer } from 'w3ts'
import { MemoryHandler } from './MemoryHandler'

export class AchesTimers {
    public Timer = Timer.create()

    public constructor() {}

    public pause(pause: boolean = true) {
        if (this.Timer === null) Logger.Warning('TIMER IS NULL in {nameof(AchesTimers)}.pause()')
        if (pause) this.Timer.pause()
        else this.Timer.resume()
    }

    public start(delay: number, repeat: boolean, callback: () => void) {
        if (this.Timer === null) Logger.Warning('TIMER IS NULL in {nameof(AchesTimers)}.start()')
        this.Timer.start(delay, repeat, callback)
    }

    public resume() {
        if (this.Timer === null) Logger.Warning('TIMER IS NULL in {nameof(AchesTimers)}.resume()')
        this.Timer.resume()
    }

    public remaining() {
        return this.Timer.remaining
    }

    public dispose() {
        this.pause()
        MemoryHandler.destroyObject(this)
    }
}
