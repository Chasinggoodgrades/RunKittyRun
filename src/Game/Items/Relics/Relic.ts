

abstract class Relic
{
    private static CanBuyRelicsTrigger: trigger;
    private static  CanBuyRelics:player[];

    public static RequiredLevel: number  = 12;
    public static RelicIncrease: number  = 16;
    public static RelicSellLevel: number  = 15;
    public static MaxRelics: number  = 2;
    public Name: string 
    public Description: string 
    public ItemID: number 
    public Cost: number 
    public IconPath: string 
    public UpgradeLevel: number = 0;
    public MaxUpgradeLevel: number  { return Upgrades.Count; }
    public RelicAbilityID: number 
    public  Upgrades  : RelicUpgrade[] = []

    public Relic(name: string, desc: string, relicAbilityID: number, itemID: number, cost: number, iconPath: string)
    {
        Name = name;
        Description = desc;
        RelicAbilityID = relicAbilityID;
        ItemID = itemID;
        Cost = cost;
        IconPath = iconPath;
    }

    public abstract ApplyEffect(Unit: unit);

    public abstract RemoveEffect(Unit: unit);

    public GetCurrentUpgrade(): RelicUpgrade
    {
        if (Upgrades == null || Upgrades.Count == 0) return null;
        if (UpgradeLevel >= Upgrades.Count) return Upgrades[Upgrades.Count - 1];
        return Upgrades[UpgradeLevel];
    }

    public CanUpgrade(player: player)  { return PlayerUpgrades.GetPlayerUpgrades(player).GetUpgradeLevel(GetType()) < MaxUpgradeLevel; }

    public Upgrade(Unit: unit)
    {
        if (!CanUpgrade(Unit.Owner)) return false;
        UpgradeLevel++;
        PlayerUpgrades.IncreaseUpgradeLevel(GetType(), Unit);
        SetUpgradeLevelDesc(Unit);
        RemoveEffect(Unit);
        ApplyEffect(Unit);
        return true;
    }

    public static GetRelicCountForLevel(currentLevel: number)
    {
        let count = currentLevel - RelicIncrease + 1; // account for level 10 relic ..
        return count < 0 ? 0 : count >= MaxRelics ? MaxRelics : count;
    }

    public SetUpgradeLevelDesc(Unit: unit)
    {
        let upgradeLevel = PlayerUpgrades.GetPlayerUpgrades(Unit.Owner).GetUpgradeLevel(GetType());
        if (upgradeLevel == 0) return;

        let item = Utility.UnitGetItem(Unit, ItemID);
        if (item == null) return;

        let tempName = item.Name;
        let newUpgradeText = "{Colors.COLOR_TURQUOISE}[Upgrade: {upgradeLevel}]{Colors.COLOR_RESET}";

        if (tempName.StartsWith("{Colors.COLOR_TURQUOISE}[Upgrade:"))
        {
            let endIndex = tempName.IndexOf("]|r") + 3;
            tempName = tempName.Substring(endIndex).Trim();
        }

        item.Name = "{newUpgradeText} {tempName}";
    }

    public static RegisterRelicEnabler()
    {
        // Ability to Purchase Relics
        PlayerUpgrades.Initialize();
        CanBuyRelicsTrigger ??= CreateTrigger();
        CanBuyRelics ??: player[] = []
        TriggerRegisterAnyUnitEventBJ(CanBuyRelicsTrigger, playerunitevent.HeroLevel);
        CanBuyRelicsTrigger.AddAction(() =>
        {
            try
            {
                if (CanBuyRelics.Contains(GetTriggerUnit().Owner)) return;
                if (GetTriggerUnit().HeroLevel < RequiredLevel) return;
                CanBuyRelics.Add(GetTriggerUnit().Owner);
                RelicUtil.EnableRelicBook(GetTriggerUnit());
                RelicUtil.DisableRelicAbilities(GetTriggerUnit());
                ProtectionOfAncients.SetProtectionOfAncientsLevel(GetTriggerUnit());
                GetTriggerUnit().Owner.DisplayTimedTextTo(4.0, "{Colors.COLOR_TURQUOISE}may: now: buy: relics: from: the: shop: You!{Colors.COLOR_RESET}");
            }
            catch (e: Error)
            {
                Logger.Warning("Error in RegisterLevelTenTrigger {e.Message}");
            }
        });
    }
}
