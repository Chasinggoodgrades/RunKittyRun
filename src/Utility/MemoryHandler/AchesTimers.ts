import { Logger } from 'src/Events/Logger/Logger'
import { Timer } from 'w3ts'
import { MemoryHandler } from './MemoryHandler'

export class AchesTimers {
    public Timer = Timer.create()
    public AchesTimers() {}

    public Pause(pause: boolean = true) {
        if (this.Timer == null) Logger.Warning('TIMER IS NULL in {nameof(AchesTimers)}.pause()')
        if (pause) this.Timer.pause()
        else this.Timer.resume()
    }

    public Start(delay: number, repeat: boolean, callback: () => void) {
        if (this.Timer == null) Logger.Warning('TIMER IS NULL in {nameof(AchesTimers)}.start()')
        this.Timer.start(delay, repeat, callback)
    }

    public Resume() {
        if (this.Timer == null) Logger.Warning('TIMER IS NULL in {nameof(AchesTimers)}.Resume()')
        this.Timer.resume()
    }

    public Remaining() {
        return this.Timer.remaining
    }

    public Dispose() {
        this.Pause()
        MemoryHandler.destroyObject(this)
    }
}
