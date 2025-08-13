declare module 'w3ts' {
    interface MapPlayer {
        DisplayTimedTextTo(duration: number, message: string): void
        DisplayTextTo(message: string): void
        getGold(): number
        setGold(amount: number): void
        addGold(amount: number): void
    }
}

export {}
