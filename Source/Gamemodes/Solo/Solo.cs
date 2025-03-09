public static class Solo
{
    public static void Initialize()
    {
        ItemSpawner.NUMBER_OF_ITEMS = 8;
    }

    public static void ReviveKittySoloTournament(Kitty kitty)
    {
        if (Gamemode.CurrentGameMode != Globals.GAME_MODES[1] || Gamemode.CurrentGameModeType != "Race") return; // Solo Gamemode & Race GamemodeType.
        _ = new SoloDeathTimer(kitty.Player);
    }

    public static void RoundEndCheck()
    {
        if (Gamemode.CurrentGameModeType != Globals.SOLO_MODES[0]) return; // Progression mode
        foreach (var kitty in Globals.ALL_KITTIES)
        {
            if (kitty.Value.Alive) return;
        }
        RoundManager.RoundEnd();
    }

}
