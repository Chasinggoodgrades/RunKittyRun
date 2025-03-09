public static class EasterEggManager
{
    public static void LoadEasterEggs()
    {
        if (Gamemode.CurrentGameMode != "Standard") return;
        MissingShoe.Initialize();
        NoKittyLeftBehind.Initialize();
        FandF.Initialize();
        CrystalOfFire.Initialize();
        UrnSoul.Initialize();
    }

}