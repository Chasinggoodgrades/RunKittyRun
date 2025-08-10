class GameAwardsDataSorted {
    public Auras: Auras
    public Hats: Hats
    public Nitros: Nitros
    public Skins: Skins
    public Trails: Trails
    public Windwalks: Windwalks
    public Tournament: Tournament
    public Deathless: Deathless
    public Wings: Wings

    public GameAwardsDataSorted() {
        Auras = new Auras()
        Wings = new Wings()
        Deathless = new Deathless()
        Hats = new Hats()
        Nitros = new Nitros()
        Skins = new Skins()
        Trails = new Trails()
        Windwalks = new Windwalks()
        Tournament = new Tournament()
    }
}
