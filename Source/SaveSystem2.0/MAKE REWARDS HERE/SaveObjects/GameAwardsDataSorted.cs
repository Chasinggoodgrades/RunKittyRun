public class GameAwardsDataSorted
{
    public Auras Auras { get; set; }
    public Hats Hats { get; set; }
    public Nitros Nitros { get; set; }
    public Skins Skins { get; set; }
    public Trails Trails { get; set; }
    public Windwalks Windwalks { get; set; }
    public Tournament Tournament { get; set; }
    public Deathless Deathless { get; set; }
    public Wings Wings { get; set; }

    public GameAwardsDataSorted()
    {
        Auras = new Auras();
        Wings = new Wings();
        Deathless = new Deathless();
        Hats = new Hats();
        Nitros = new Nitros();
        Skins = new Skins();
        Trails = new Trails();
        Windwalks = new Windwalks();
        Tournament = new Tournament();
    }
}