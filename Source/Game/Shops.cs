using System;
using System.Collections.Generic;
using System.Numerics;
using WCSharp.Api;
using WCSharp.Shared.Extensions;
using static WCSharp.Api.Common;


public static class Shops
{
    private static unit PandaVendor;
    private static group KittyVendors;
    private static List<unit> KittyVendorsList;
    private static List<int> KittyVendorItemList;
    private static Dictionary<unit, List<VendorItem>> VendorsItemList;
    private static trigger Trigger;
    public static void Initialize()
    {
        KittyVendors = CreateGroup();
        Trigger = CreateTrigger();
        KittyVendorsList = new List<unit>();
        KittyVendorItemList = new List<int>();
        VendorsItemList = new Dictionary<unit, List<VendorItem>>();
        CollectAllVendors();
        SetupAllItems();
        ApplyItemListToVendor();
    }

    private static void SetupAllItems()
    {
        ConstantItems();
        if (Gamemode.CurrentGameMode == Globals.GAME_MODES[0])
        {
            StandardModeItems();
            SpawnPandaVendor();
        }
    }

    private static void SpawnPandaVendor()
    {
        PandaVendor = CreateUnit(Player(PLAYER_NEUTRAL_PASSIVE), Constants.UNIT_PANDA, Regions.PandaArea.Center.X, Regions.PandaArea.Center.Y, 270f);
    }

    private static void ApplyItemListToVendor()
    {
        foreach (var vendor in KittyVendorsList)
            AddRegularItemsToVendor(vendor, KittyVendorItemList);
    }

    private static void RefreshItemsOnVendor(unit vendor)
    {
        var vendorItems = VendorsItemList[vendor];
        foreach (var item in vendorItems)
        {
            vendor.AddItemToStock(item.Item, item.Stock, item.Stock);
        }
    }

    private static void AddRegularItemsToVendor(unit vendor, List<int> items)
    {
        var vendorList = new List<VendorItem>();
        foreach (var item in items)
        {
            vendorList.Add(new VendorItem(vendor, item, 2, 60));

        }
        VendorsItemList.Add(vendor, vendorList);
        RefreshItemsOnVendor(vendor);
    }

    private static void ConstantItems()
    {
        // Items for all modes
        KittyVendorItemList.Add(Constants.ITEM_ADRENALINE_POTION);
        KittyVendorItemList.Add(Constants.ITEM_HEALING_WATER);
        KittyVendorItemList.Add(Constants.ITEM_PEGASUS_BOOTS);
        KittyVendorItemList.Add(Constants.ITEM_ENERGY_STONE);
        KittyVendorItemList.Add(Constants.ITEM_MEDITATION_CLOAK);
        KittyVendorItemList.Add(Constants.ITEM_RITUAL_MASK);
        KittyVendorItemList.Add(Constants.ITEM_ELIXIR);
        KittyVendorItemList.Add(Constants.ITEM_ANCIENT_TOME);
    }

    private static void StandardModeItems()
    {
        // Kitty Vendor
        KittyVendorItemList.Add(Constants.ITEM_EMPTY_VIAL);
        KittyVendorItemList.Add(Constants.ITEM_URN_OF_A_BROKEN_SOUL);
        KittyVendorItemList.Add(Constants.ITEM_CAT_FIGURINE);

        // Panda Vendor
/*      PandaVendorItemList.Add(Constants.ITEM_GREEN_TENDRILS);
        PandaVendorItemList.Add(Constants.ITEM_AMULET_OF_EVASIVENESS);
        PandaVendorItemList.Add(Constants.ITEM_FANG_OF_SHADOWS);
        PandaVendorItemList.Add(Constants.ITEM_BEACON_OF_UNITED_LIFEFORCE);
        PandaVendorItemList.Add(Constants.ITEM_SACRED_RING_OF_SUMMONING);
        PandaVendorItemList.Add(Constants.ITEM_ONE_OF_NINE);
        PandaVendorItemList.Add(Constants.ITEM_FROSTBITE_RING);
        PandaVendorItemList.Add(Constants.ITEM_ANTI_BLOCK_WAND);
*/
    }

    private static void CollectAllVendors()
    {
        KittyVendors.EnumUnitsInRect(GetWorldBounds(), Filter(() => GetUnitTypeId(GetFilterUnit()) == Constants.UNIT_KITTY_VENDOR));
        KittyVendorsList = KittyVendors.ToList();

        RegisterVendorSellingEvent();

        KittyVendors.Dispose();
    }

    private static void RegisterVendorSellingEvent()
    {
        foreach (var vendor in KittyVendorsList)
            TriggerRegisterUnitEvent(Trigger, vendor, EVENT_UNIT_SELL_ITEM);
        TriggerAddAction(Trigger, () => OnVendorSell());
    }

    private static void OnVendorSell()
    {
        var item = GetSoldItem();
        var vendor = GetSellingUnit();
        var player = GetOwningPlayer(GetBuyingUnit());

        var itemID = GetItemTypeId(item);

        var vendorItems = VendorsItemList[vendor];
        var vendorItem = vendorItems.Find(vi => vi.Item == itemID);
        if (vendorItem == null) return;

        RefreshItemsOnVendor(vendor);
    }

    class VendorItem
    {
        public unit Vendor { get; set; }
        public int Item { get; set; }
        public int Stock { get; set; }
        public float RestockTime { get; set; }

        public VendorItem(unit vendor, int item, int stock, float restockTime)
        {
            Vendor = vendor;
            Item = item;
            Stock = stock;
            RestockTime = restockTime;
        }
    }
}
