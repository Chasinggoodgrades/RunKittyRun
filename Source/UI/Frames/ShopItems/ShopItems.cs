using Microsoft.VisualBasic;
using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public enum ShopItemType { Relic, Reward, Misc }

public class ShopItem
{
    public string Name { get; set; }
    public int Cost { get; set; }
    public int ItemID { get; set; }
    public int AbilityID { get; set; }
    public string Description { get; set; }
    public string IconPath { get; set; }
    public Relic Relic { get; set; }
    public Awards Award { get; set; }
    public ShopItemType Type { get; set; }

    public ShopItem(Relic relic)
    {
        InitializeShopItem(relic.Name, relic.Cost, relic.ItemID, relic.Description, relic.IconPath, ShopItemType.Relic);
        Relic = relic;
    }

    public ShopItem(Awards award, int cost, int abilityID, string description)
    {
        InitializeShopItem(AwardManager.GetRewardName(award), cost, abilityID, description, null, ShopItemType.Reward);
        Award = award;
        IconPath = BlzGetAbilityIcon(abilityID);
    }

    public ShopItem(string name, int cost, int itemID, string iconPath, string description)
    {
        InitializeShopItem(name, cost, itemID, description, iconPath, ShopItemType.Misc);
    }

    private void InitializeShopItem(string name, int cost, int itemID, string description, string iconPath, ShopItemType type)
    {
        Name = name;
        Cost = cost;
        ItemID = itemID;
        Description = description;
        IconPath = iconPath;
        Type = type;
    }

    public static List<ShopItem> ShopItemsRelic => new List<ShopItem>
    {
        new ShopItem(new OneOfNine()),
        new ShopItem(new FangOfShadows()),
        new ShopItem(new RingOfSummoning()),
        new ShopItem(new AmuletOfEvasiveness()),
        new ShopItem(new FrostbiteRing()),
        new ShopItem(new BeaconOfUnitedLifeforce()),
        new ShopItem(new ShardOfTranslocation())
    };

    public static List<ShopItem> ShopItemsReward()
    {
        var shopItems = new List<ShopItem>();

        var reward = RewardsManager.Rewards.Find(x => x.Name == Awards.Green_Tendrils);
        shopItems.Add(new ShopItem(Awards.Green_Tendrils, 8000, reward.AbilityID, "Wings designed for those whom are economically stable."));
        
        return shopItems;
    }

    public static List<ShopItem> ShopItemsMisc()
    {
        var shopItems = new List<ShopItem>();

        shopItems.Add(new ShopItem("Anti-Block-Wand", 100, Constants.ITEM_ANTI_BLOCK_WAND, BlzGetAbilityIcon(Constants.ABILITY_ANTI_BLOCK_WAND_ITEM), "Wolves in the way? Buy this to make them move. Dang pesky wolves."));
        shopItems.Add(new ShopItem("Mysterious Orb", 50, Constants.ITEM_ORB_OF_MYSTERIES, Utility.GetItemIconPath(Constants.ITEM_ORB_OF_MYSTERIES), "A mysterious orb that has mysterious usefulness!"));

        return shopItems;

    }
}