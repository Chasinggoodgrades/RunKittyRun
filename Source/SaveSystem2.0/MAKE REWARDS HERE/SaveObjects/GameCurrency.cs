public class GameCurrency
{
    public KibbleCurrency Kibble { get; set; }

    public GameCurrency()
    {
        Kibble = new KibbleCurrency();
    }

    public void ResetGameCurrency()
    {
        Kibble.Reset();
    }
}

public class KibbleCurrency
{
    public int Collected { get; set; }
    public int Jackpots { get; set; }
    public int SuperJackpots { get; set; }

    public void Reset()
    {
        Collected = 0;
        Jackpots = 0;
        SuperJackpots = 0;
    }
}
