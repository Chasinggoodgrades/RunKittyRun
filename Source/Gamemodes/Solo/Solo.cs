public static class Solo
{
    public static void Initialize()
    {
        ItemSpawner.NUMBER_OF_ITEMS = 8;
        ShadowKitty.Initialize();
    }

    public static void ReviveKittySoloTournament(Kitty kitty)
    {
        if (Gamemode.CurrentGameModeType != "Race") return; // Race GamemodeType.
        new SoloDeathTimer(kitty.Player);
    }

    public static void RoundEndCheck()
    {
        if (Gamemode.CurrentGameModeType != "Progression") return; // Progression mode

        for(int i = 0; i < Globals.ALL_PLAYERS.Count; i++)
        {
            var kitty = Globals.ALL_KITTIES[Globals.ALL_PLAYERS[i]];
            if (kitty.Alive) return;
        }
        RoundManager.RoundEnd();
    }
}
