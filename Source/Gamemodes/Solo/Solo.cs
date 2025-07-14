public static class Solo
{
    public static void Initialize()
    {
        ItemSpawner.NUMBER_OF_ITEMS = 8;
    }

    public static void ReviveKittySoloTournament(Kitty kitty)
    {
        if (Gamemode.CurrentGameMode != GameMode.SoloTournament || Gamemode.CurrentGameModeType != "Race") return; // Solo Gamemode & Race GamemodeType.
        new SoloDeathTimer(kitty.Player);
    }

    public static void RoundEndCheck()
    {
        if (Gamemode.CurrentGameModeType != Globals.SOLO_MODES[0]) return; // Progression mode

        for(int i = 0; i < Globals.ALL_PLAYERS.Count; i++)
        {
            var kitty = Globals.ALL_KITTIES[Globals.ALL_PLAYERS[i]];
            if (kitty.Alive) return;
        }
        RoundManager.RoundEnd();
    }
}
