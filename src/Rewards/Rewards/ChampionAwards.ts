class ChampionAwards {
    public static AwardAllChampions() {
        for (let player in Globals.ALL_PLAYERS) {
            if (!Globals.CHAMPIONS.Contains(player.Name)) continue
            GiveAllChampionAwards(player)
        }
    }

    private static GiveAllChampionAwards(player: player) {
        let awards: Tournament
        AwardManager.GiveReward(player, 'TurquoiseNitro', false)
        AwardManager.GiveReward(player, 'TurquoiseWings', false)
        AwardManager.GiveReward(player, 'VioletAura', false)
        AwardManager.GiveReward(player, 'VioletWings', false)
        AwardManager.GiveReward(player, 'PenguinSkin', false)
    }
}
