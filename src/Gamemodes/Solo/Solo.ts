export class Solo {
    public static Initialize() {
        ItemSpawner.NUMBER_OF_ITEMS = 8
    }

    public static ReviveKittySoloTournament(kitty: Kitty) {
        if (Gamemode.CurrentGameMode != GameMode.SoloTournament || Gamemode.CurrentGameModeType != 'Race') return // Solo Gamemode & Race GamemodeType.
        new SoloDeathTimer(kitty.Player)
    }

    public static RoundEndCheck() {
        if (Gamemode.CurrentGameModeType != Globals.SOLO_MODES[0]) return // Progression mode

        for (let i: number = 0; i < Globals.ALL_PLAYERS.length; i++) {
            let kitty = Globals.ALL_KITTIES[Globals.ALL_PLAYERS[i]]
            if (kitty.Alive) return
        }
        RoundManager.RoundEnd()
    }
}
