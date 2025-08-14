declare module 'w3ts' {
    interface MapPlayer {
        DisplayTimedTextTo(duration: number, message: string): void
        DisplayTextTo(message: string): void
        getGold(): number
        setGold(amount: number): void
        addGold(amount: number): void
    }
}

declare module 'w3ts' {
    interface Rectangle {
        includes(x: number, y: number): boolean
        rect(): rect
        region(): region
    }
}

export {}
