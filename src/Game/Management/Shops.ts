

class Shops
{
    private static KittyVendors: group;
    private static  KittyVendorsList:unit[];
    private static  KittyVendorItemList:int[];
    private static  VendorsItemList:{[x: unit]: VendorItem[]};
    private static Trigger: trigger;

    public static Initialize()
    {
        KittyVendors = group.Create();
        let Trigger = CreateTrigger();
        KittyVendorsList = []
        KittyVendorItemList = []
        VendorsItemList = {}
        CollectAllVendors();
        SetupAllItems();
        ApplyItemListToVendor();
    }

    private static SetupAllItems()
    {
        ConstantItems();

        if (Gamemode.CurrentGameMode != GameMode.Standard) return;

        StandardModeItems();
    }

    private static ApplyItemListToVendor()
    {
        for (let vendor in KittyVendorsList)
            AddRegularItemsToVendor(vendor, KittyVendorItemList);
    }

    private static RefreshItemsOnVendor(vendor: unit)
    {
        let vendorItems = VendorsItemList[vendor];
        for (let item in vendorItems)
            vendor.AddItemToStock(item.Item, item.Stock, item.Stock);
    }

    private static AddRegularItemsToVendor(vendor: unit, int[] items)
    {
        let vendorList : VendorItem[] = []
        for (let item in items)
        {
            vendorList.Add(new VendorItem(vendor, item, 2, 60));
        }
        VendorsItemList.Add(vendor, vendorList);
        RefreshItemsOnVendor(vendor);
    }

    /// <summary>
    /// No longer has use. Constant items will just remain in the editor.
    /// </summary>
    private static ConstantItems()
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
    private static StandardModeItems()
    {
        // Kitty Vendor
        KittyVendorItemList.Add(Constants.ITEM_EASTER_EGG_EMPTY_VIAL);
        KittyVendorItemList.Add(Constants.ITEM_EASTER_EGG_URN_OF_A_BROKEN_SOUL);
        KittyVendorItemList.Add(Constants.ITEM_EASTER_EGG_CAT_FIGURINE);
    }

    private static CollectAllVendors()
    {
        let filter = Utility.CreateFilterFunc(() => GetUnitTypeId(GetFilterUnit()) == Constants.UNIT_KITTY_VENDOR);
        KittyVendors.EnumUnitsInRect(GetWorldBounds(), filter);
        KittyVendorsList = KittyVendors.ToList();

        RegisterVendorSellingEvent();

        GC.RemoveFilterFunc( filter); // TODO; Cleanup:         GC.RemoveFilterFunc(ref filter);
    }

    private static RegisterVendorSellingEvent()
    {
        // Registers all Kitty Vendors and Panda Vendor for on sell event.
        for (let vendor in KittyVendorsList)
            Trigger.RegisterUnitEvent(vendor, unitevent.SellItem);
        Trigger.AddAction(OnVendorSell);
    }

    private static OnVendorSell()
    {
        try
        {
            let item = GetSoldItem() ;
            let vendor = GetSellingUnit();
            const u = GetBuyingUnit()
            if (!u) return 
            let player = GetOwningPlayer(u)
            let itemID = item.TypeId;

            let vendorItems = VendorsItemList[vendor];
            let vendorItem = vendorItems.Find(vi => vi.Item == itemID);
            if (vendorItem == null) return;

            RefreshItemsOnVendor(vendor);
        }
        catch (e: Error)
        {
            Logger.Warning("Error in OnVendorSell: {e.Message}");
        }
    }
    
    private class VendorItem
    {
        public Vendor: unit 
        public Item: number 
        public Stock: number 
        public RestockTime: number 

        public VendorItem(vendor: unit, item: number, stock: number, restockTime: number)
        {
            Vendor = vendor;
            Item = item;
            Stock = stock;
            RestockTime = restockTime; // May implement later? unsure.
        }
    }
}
