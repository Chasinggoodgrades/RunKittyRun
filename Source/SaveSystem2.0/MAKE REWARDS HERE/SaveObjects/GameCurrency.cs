public class GameCurrency
{
    public KibbleCurrency Kibble { get; set; }

    public GameCurrency()
    {
        Kibble = new KibbleCurrency();
    }

}

public class KibbleCurrency 
{
    public int Collected { get; set; }
    public int Jackpots { get; set; }


}