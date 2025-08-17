export class GameCurrency {
    public Kibble: KibbleCurrency

    public constructor() {
        this.Kibble = new KibbleCurrency()
    }
}

export class KibbleCurrency {
    public Collected = 0
    public Jackpots = 0
    public SuperJackpots = 0
}
