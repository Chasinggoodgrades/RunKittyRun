export class ChampionAwards {
    public static AwardAllChampions() {
        for (let player in Globals.ALL_PLAYERS) {
            if (!Globals.CHAMPIONS.includes(player.Name)) continue
            GiveAllChampionAwards(player)
        }
    }

    private static GiveAllChampionAwards(player: MapPlayer) {
        let awards: Tournament
        AwardManager.GiveReward(player, 'TurquoiseNitro', false)
        AwardManager.GiveReward(player, 'TurquoiseWings', false)
        AwardManager.GiveReward(player, 'VioletAura', false)
        AwardManager.GiveReward(player, 'VioletWings', false)
        AwardManager.GiveReward(player, 'PenguinSkin', false)
    }
}
