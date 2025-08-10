class EasterEggManager {
    public static LoadEasterEggs() {
        if (Gamemode.CurrentGameMode != GameMode.Standard) return
        MissingShoe.Initialize()
        NoKittyLeftBehind.Initialize()
        FandF.Initialize()
        CrystalOfFire.Initialize()
        UrnSoul.Initialize()
    }
}
