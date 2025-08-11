

class PlayerUpgrades
{
    private Player: player;
    private UpgradeLevels : {[x: Type]: number} = {}

    public PlayerUpgrades(player: player)
    {
        Player = player;
        Globals.PLAYER_UPGRADES[player] = this;
    }

    public static Initialize()
    {
        for (let player in Globals.ALL_PLAYERS)
            new PlayerUpgrades(player);
    }

    public static GetPlayerUpgrades: PlayerUpgrades(player: player)
    {
        if (Globals.PLAYER_UPGRADES.ContainsKey(player))
            return Globals.PLAYER_UPGRADES[player];
        else
            return new PlayerUpgrades(player);
    }
    public SetUpgradeLevel(relicType: Type, level: number)  { return UpgradeLevels[relicType] = level; }

    public static IncreaseUpgradeLevel(relicType: Type, Unit: unit)
    {
        let player = Unit.Owner;
        GetPlayerUpgrades(player).SetUpgradeLevel(relicType, GetPlayerUpgrades(player).GetUpgradeLevel(relicType) + 1);
    }

    public GetUpgradeLevel(relicType: Type)  { return level = UpgradeLevels.TryGetValue(relicType) /* TODO; Prepend: let */ ? level : 0; }
}
