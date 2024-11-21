using System.Collections.Generic;
using WCSharp.Api;
public class PlayerUpgrades
{
    private player Player;
    private Dictionary<System.Type, int> UpgradeLevels { get; set; } = new Dictionary<System.Type, int>();

    public PlayerUpgrades(player player)
    {
        Player = player;
        Globals.PLAYER_UPGRADES[player] = this;
    }

    public static void Initialize()
    {
        foreach (var player in Globals.ALL_PLAYERS)
            new PlayerUpgrades(player);
    }

    public static PlayerUpgrades GetPlayerUpgrades(player player) => Globals.PLAYER_UPGRADES[player];
    public void SetUpgradeLevel(System.Type relicType, int level) => UpgradeLevels[relicType] = level;

    public int GetCurrentUpgradeLevel(System.Type relicType)
    {
        if (!UpgradeLevels.ContainsKey(relicType))
            UpgradeLevels[relicType] = 0;
        return UpgradeLevels[relicType];
    }
}