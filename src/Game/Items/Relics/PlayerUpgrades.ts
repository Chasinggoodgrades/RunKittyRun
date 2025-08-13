import { Globals } from 'src/Global/Globals'
import { MapPlayer, Unit } from 'w3ts'

export class PlayerUpgrades {
    private Player: MapPlayer
    private UpgradeLevels: Map<string, number> = new Map()

    public constructor(player: MapPlayer) {
        this.Player = player
        Globals.PLAYER_UPGRADES.set(player, this)
    }

    public static Initialize() {
        for (let player of Globals.ALL_PLAYERS) new PlayerUpgrades(player)
    }

    public static GetPlayerUpgrades(player: MapPlayer): PlayerUpgrades {
        if (Globals.PLAYER_UPGRADES.has(player)) return Globals.PLAYER_UPGRADES.get(player)!
        else return new PlayerUpgrades(player)
    }

    public SetUpgradeLevel(relicType: string, level: number) {
        return this.UpgradeLevels.set(relicType, level)
    }

    public static IncreaseUpgradeLevel(relicType: string, Unit: Unit) {
        let player = Unit.owner
        PlayerUpgrades.GetPlayerUpgrades(player).SetUpgradeLevel(
            relicType,
            PlayerUpgrades.GetPlayerUpgrades(player).GetUpgradeLevel(relicType) + 1
        )
    }

    public GetUpgradeLevel(relicType: string) {
        return (level = this.UpgradeLevels.TryGetValue(relicType) /* TODO; Prepend: let */ ? level : 0)
    }
}
