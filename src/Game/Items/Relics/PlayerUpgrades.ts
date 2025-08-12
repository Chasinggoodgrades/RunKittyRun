export class PlayerUpgrades {
    private Player: MapPlayer
    private UpgradeLevels: Map<Type, number> = new Map()

    public PlayerUpgrades(player: MapPlayer) {
        Player = player
        Globals.PLAYER_UPGRADES[player] = this
    }

    public static Initialize() {
        for (let player in Globals.ALL_PLAYERS) new PlayerUpgrades(player)
    }

    public static GetPlayerUpgrades(player: MapPlayer): PlayerUpgrades {
        if (Globals.PLAYER_UPGRADES.has(player)) return Globals.PLAYER_UPGRADES[player]
        else return new PlayerUpgrades(player)
    }
    public SetUpgradeLevel(relicType: Type, level: number) {
        return (UpgradeLevels[relicType] = level)
    }

    public static IncreaseUpgradeLevel(relicType: Type, Unit: Unit) {
        let player = Unit.Owner
        GetPlayerUpgrades(player).SetUpgradeLevel(relicType, GetPlayerUpgrades(player).GetUpgradeLevel(relicType) + 1)
    }

    public GetUpgradeLevel(relicType: Type) {
        return (level = UpgradeLevels.TryGetValue(relicType) /* TODO; Prepend: let */ ? level : 0)
    }
}
