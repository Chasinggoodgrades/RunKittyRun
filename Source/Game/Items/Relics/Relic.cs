using System;
using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;
public abstract class Relic
{
    public static int RequiredLevel { get; } = 10;
    public static int SecondRelicLevel { get; } = 15;
    public static int MaxRelics { get; } = 2;
    public string Name { get; }
    public string Description { get; }
    public int ItemID { get; }
    public int Cost { get; }
    public string IconPath { get; }
    public int UpgradeLevel { get; private set; } = 0;
    public int MaxUpgradeLevel => Upgrades.Count;
    public List<RelicUpgrade> Upgrades { get; } = new List<RelicUpgrade>();

    public Relic(string name, string desc, int itemID, int cost, string iconPath)
    {
        Name = name;
        Description = desc;
        ItemID = itemID;
        Cost = cost;
        IconPath = iconPath;
    }

    public abstract void ApplyEffect(unit Unit);
    public abstract void RemoveEffect(unit Unit);
    public RelicUpgrade GetCurrentUpgrade() => Upgrades[UpgradeLevel];
    public RelicUpgrade GetNextUpgrade() => CanUpgrade() ? Upgrades[UpgradeLevel] : null;
    public bool CanUpgrade() => UpgradeLevel < MaxUpgradeLevel;
    public bool Upgrade(unit Unit)
    {
        if (!CanUpgrade()) return false;
        UpgradeLevel++;
        PlayerUpgrades.IncreaseUpgradeLevel(GetType(), Unit);
        RemoveEffect(Unit);
        ApplyEffect(Unit);
        return true;
    }
}