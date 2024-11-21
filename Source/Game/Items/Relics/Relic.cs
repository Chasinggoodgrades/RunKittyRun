using System;
using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;
public abstract class Relic
{
    public static int RequiredLevel = 10;
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

    public bool CanUpgrade() => UpgradeLevel < MaxUpgradeLevel;
    public bool Upgrade()
    {
        if (!CanUpgrade())
        {
            Console.WriteLine($"{Name} is at {UpgradeLevel}/{MaxUpgradeLevel}");
            return false;
        }
        UpgradeLevel++;
        return true;
    }

    public RelicUpgrade GetCurrentUpgrade() => Upgrades[UpgradeLevel];
    public RelicUpgrade GetNextUpgrade() => CanUpgrade() ? Upgrades[UpgradeLevel] : null;

    public override string ToString() => Name;
}