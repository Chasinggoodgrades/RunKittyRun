using System;
using System.Collections.Generic;
using WCSharp.Api;

public class PlayerUpgrades
{
    private player Player;
    private Dictionary<Type, int> UpgradeLevels { get; set; } = new Dictionary<Type, int>();

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

    public void SetUpgradeLevel(Type relicType, int level) => UpgradeLevels[relicType] = level;

    public static void IncreaseUpgradeLevel(Type relicType, unit Unit)
    {
        var player = Unit.Owner;
        GetPlayerUpgrades(player).SetUpgradeLevel(relicType, GetPlayerUpgrades(player).GetUpgradeLevel(relicType) + 1);
    }

    public int GetUpgradeLevel(Type relicType) => UpgradeLevels.TryGetValue(relicType, out var level) ? level : 0;
}
