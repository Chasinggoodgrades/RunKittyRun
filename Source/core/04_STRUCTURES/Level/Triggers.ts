export class Trigger {
    private t: trigger = CreateTrigger()

    destroy = () => {
        DestroyTrigger(this.t)
        ;(this.t as any) = null
    }

    activate = (activ: boolean) => {
        if (activ) {
            EnableTrigger(this.t)
        } else {
            DisableTrigger(this.t)
        }
    }
}

export class TriggerArray {
    private triggers: Trigger[] = [] //todomax handle this error
    private lastInstance = -1

    destroy = () => {
        for (let i = 0; i <= this.lastInstance; i++) {
            this.triggers[i].destroy()
            delete this.triggers[i]
        }
        this.lastInstance = -1
    }

    activate = (activ: boolean) => {
        for (let i = 0; i <= this.lastInstance; i++) {
            if (this.triggers[i] !== null) {
                this.triggers[i].activate(activ)
            }
        }
    }
}
