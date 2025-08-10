class ChampionAwards {
    public static AwardAllChampions() {
        for (let player in Globals.ALL_PLAYERS) {
            if (!Globals.CHAMPIONS.Contains(player.Name)) continue
            GiveAllChampionAwards(player)
        }
    }

    private static GiveAllChampionAwards(player: player) {
        let awards: Tournament
        AwardManager.GiveReward(player, nameof(awards.TurquoiseNitro), false)
        AwardManager.GiveReward(player, nameof(awards.TurquoiseWings), false)
        AwardManager.GiveReward(player, nameof(awards.VioletAura), false)
        AwardManager.GiveReward(player, nameof(awards.VioletWings), false)
        AwardManager.GiveReward(player, nameof(awards.PenguinSkin), false)
    }
}
