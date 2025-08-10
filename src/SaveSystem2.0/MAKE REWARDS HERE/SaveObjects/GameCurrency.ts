class GameCurrency {
    public Kibble: KibbleCurrency

    public GameCurrency() {
        Kibble = new KibbleCurrency()
    }
}

class KibbleCurrency {
    public Collected: number
    public Jackpots: number
    public SuperJackpots: number
}
