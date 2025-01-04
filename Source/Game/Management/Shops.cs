using System.Collections.Generic;
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
        KittyVendors = group.Create();
        Trigger = trigger.Create();
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

        if (Gamemode.CurrentGameMode != "Standard") return;

        StandardModeItems();
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
            vendor.AddItemToStock(item.Item, item.Stock, item.Stock);
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

    /// <summary>
    /// No longer has use. Constant items will just remain in the editor.
    /// </summary>
    private static void ConstantItems()
    {
        // Items for all modes
/*        KittyVendorItemList.Add(Constants.ITEM_ADRENALINE_POTION);
        KittyVendorItemList.Add(Constants.ITEM_HEALING_WATER);
        KittyVendorItemList.Add(Constants.ITEM_PEGASUS_BOOTS);
        KittyVendorItemList.Add(Constants.ITEM_ENERGY_STONE);
        KittyVendorItemList.Add(Constants.ITEM_MEDITATION_CLOAK);
        KittyVendorItemList.Add(Constants.ITEM_RITUAL_MASK);
        KittyVendorItemList.Add(Constants.ITEM_ELIXIR);
        KittyVendorItemList.Add(Constants.ITEM_ANCIENT_TOME);*/
    }

    /// <summary>
    /// These items can go to the misc shop if we want space for constant items. 
    /// </summary>
    private static void StandardModeItems()
    {
        // Kitty Vendor
        KittyVendorItemList.Add(Constants.ITEM_EMPTY_VIAL);
        KittyVendorItemList.Add(Constants.ITEM_URN_OF_A_BROKEN_SOUL);
        KittyVendorItemList.Add(Constants.ITEM_CAT_FIGURINE);
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
        // Registers all Kitty Vendors and Panda Vendor for on sell event.
        foreach (var vendor in KittyVendorsList)
            Trigger.RegisterUnitEvent(vendor, unitevent.SellItem);
        Trigger.AddAction( () => OnVendorSell());
    }

    private static void OnVendorSell()
    {
        var item = @event.SoldItem;
        var vendor = @event.SellingUnit;
        var player = @event.BuyingUnit.Owner;
        var itemID = item.TypeId;

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
            RestockTime = restockTime; // May implement later? unsure.
        }
    }
}
