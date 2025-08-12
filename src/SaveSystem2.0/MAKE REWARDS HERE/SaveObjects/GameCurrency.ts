export class GameCurrency {
    public Kibble: KibbleCurrency

    public GameCurrency() {
        Kibble = new KibbleCurrency()
    }
}

export class KibbleCurrency {
    public Collected: number
    public Jackpots: number
    public SuperJackpots: number
}
