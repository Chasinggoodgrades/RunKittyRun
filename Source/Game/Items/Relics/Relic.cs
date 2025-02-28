using System;
using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;
public abstract class Relic
{
    public static int RequiredLevel { get; } = 10;
    public static int RelicIncrease { get; } = 15;
    public static int RelicSellLevel { get; } = 15;
    public static int MaxRelics { get; } = 2;
    public string Name { get; }
    public string Description { get; }
    public int ItemID { get; }
    public int Cost { get; }
    public string IconPath { get; }
    public int UpgradeLevel { get; private set; } = 0;
    public int MaxUpgradeLevel => Upgrades.Count;
    public int RelicAbilityID { get; protected set; }
    public List<RelicUpgrade> Upgrades { get; } = new List<RelicUpgrade>();

    public Relic(string name, string desc, int relicAbilityID, int itemID, int cost, string iconPath)
    {
        Name = name;
        Description = desc;
        RelicAbilityID = relicAbilityID;
        ItemID = itemID;
        Cost = cost;
        IconPath = iconPath;
    }

    public abstract void ApplyEffect(unit Unit);
    public abstract void RemoveEffect(unit Unit);
    public RelicUpgrade GetCurrentUpgrade() => Upgrades[UpgradeLevel];
    public bool CanUpgrade(player player) => PlayerUpgrades.GetPlayerUpgrades(player).GetUpgradeLevel(GetType()) < MaxUpgradeLevel;
    public bool Upgrade(unit Unit)
    {
        if (!CanUpgrade(Unit.Owner)) return false;
        UpgradeLevel++;
        PlayerUpgrades.IncreaseUpgradeLevel(GetType(), Unit);
        SetUpgradeLevelDesc(Unit);
        RemoveEffect(Unit);
        ApplyEffect(Unit);
        return true;
    }

    public static int GetRelicCountForLevel(int currentLevel)
    {
        var count = (currentLevel - RelicIncrease) + 1; // account for level 10 relic .. 
        if (count < 0) return 0;
        else if(count >= MaxRelics) return MaxRelics;
        else return count;
    }

    public void SetUpgradeLevelDesc(unit Unit)
    {
        var upgradeLevel = PlayerUpgrades.GetPlayerUpgrades(Unit.Owner).GetUpgradeLevel(GetType());
        if (upgradeLevel == 0) return;

        var item = Utility.UnitGetItem(Unit, ItemID);
        if (item == null) return;

        var tempName = item.Name;
        var newUpgradeText = $"{Colors.COLOR_TURQUOISE}[Upgrade: {upgradeLevel}]{Colors.COLOR_RESET}";

        if (tempName.StartsWith($"{Colors.COLOR_TURQUOISE}[Upgrade:"))
        {
            var endIndex = tempName.IndexOf("]|r") + 3;
            tempName = tempName.Substring(endIndex).Trim();
        }

        item.Name = $"{newUpgradeText} {tempName}";
    }


}