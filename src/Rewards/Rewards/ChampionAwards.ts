import { Globals } from "src/Global/Globals"
import { Tournament } from "src/SaveSystem2.0/MAKE REWARDS HERE/SaveObjects/RewardObjects/Tournament"
import { MapPlayer } from "w3ts"
import { AwardManager } from "./AwardManager"

export class ChampionAwards {
    public static AwardAllChampions() {
        for (let player of Globals.ALL_PLAYERS) {
            if (!Globals.CHAMPIONS.includes(player.name)) continue
            this.GiveAllChampionAwards(player)
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
