export class Shops {
    private static KittyVendors: Group
    private static KittyVendorsList: Unit[]
    private static KittyVendorItemList: number[]
    private static VendorsItemList: Map<unit, VendorItem[]>
    private static Trigger: Trigger

    public static Initialize() {
        KittyVendors = Group.create()!
        let Trigger = Trigger.create()!
        KittyVendorsList = []
        KittyVendorItemList = []
        VendorsItemList = {}
        CollectAllVendors()
        SetupAllItems()
        ApplyItemListToVendor()
    }

    private static SetupAllItems() {
        ConstantItems()

        if (Gamemode.CurrentGameMode != GameMode.Standard) return

        StandardModeItems()
    }

    private static ApplyItemListToVendor() {
        for (let vendor in KittyVendorsList) AddRegularItemsToVendor(vendor, KittyVendorItemList)
    }

    private static RefreshItemsOnVendor(vendor: Unit) {
        let vendorItems = VendorsItemList[vendor]
        for (let item in vendorItems) vendor.AddItemToStock(item.Item, item.Stock, item.Stock)
    }

    private static AddRegularItemsToVendor(vendor: Unit, items: number[]) {
        let vendorList: VendorItem[] = []
        for (let item in items) {
            vendorList.push(new VendorItem(vendor, item, 2, 60))
        }
        VendorsItemList.push(vendor, vendorList)
        RefreshItemsOnVendor(vendor)
    }

    /// <summary>
    /// No longer has use. Constant items will just remain in the editor.
    /// </summary>
    private static ConstantItems() {
        // Items for all modes
        /*        KittyVendorItemList.push(Constants.ITEM_ADRENALINE_POTION);
                KittyVendorItemList.push(Constants.ITEM_HEALING_WATER);
                KittyVendorItemList.push(Constants.ITEM_PEGASUS_BOOTS);
                KittyVendorItemList.push(Constants.ITEM_ENERGY_STONE);
                KittyVendorItemList.push(Constants.ITEM_MEDITATION_CLOAK);
                KittyVendorItemList.push(Constants.ITEM_RITUAL_MASK);
                KittyVendorItemList.push(Constants.ITEM_ELIXIR);
                KittyVendorItemList.push(Constants.ITEM_ANCIENT_TOME);*/
    }

    /// <summary>
    /// These items can go to the misc shop if we want space for constant items.
    /// </summary>
    private static StandardModeItems() {
        // Kitty Vendor
        KittyVendorItemList.push(Constants.ITEM_EASTER_EGG_EMPTY_VIAL)
        KittyVendorItemList.push(Constants.ITEM_EASTER_EGG_URN_OF_A_BROKEN_SOUL)
        KittyVendorItemList.push(Constants.ITEM_EASTER_EGG_CAT_FIGURINE)
    }

    private static CollectAllVendors() {
        let filter = Utility.CreateFilterFunc(() => GetUnitTypeId(getFilterUnit()) == Constants.UNIT_KITTY_VENDOR)
        KittyVendors.enumUnitsInRect(Rectangle.getWorldBounds(), filter)
        KittyVendorsList = KittyVendors.ToList()

        RegisterVendorSellingEvent()

        GC.RemoveFilterFunc(filter) // TODO; Cleanup:         GC.RemoveFilterFunc(ref filter);
    }

    private static RegisterVendorSellingEvent() {
        // Registers all Kitty Vendors and Panda Vendor for on sell event.
        for (let vendor in KittyVendorsList) TriggerRegisterUnitEvent(Trigger, vendor, unitevent.SellItem)
        Trigger.addAction(OnVendorSell)
    }

    private static OnVendorSell() {
        try {
            let item = GetSoldItem()
            let vendor = GetSellingUnit()
            const u = GetBuyingUnit()
            if (!u) return
            let player = GetOwningPlayer(u)
            let itemID = item.TypeId

            let vendorItems = VendorsItemList[vendor]
            let vendorItem = vendorItems.find(vi => vi.Item == itemID)
            if (vendorItem == null) return

            RefreshItemsOnVendor(vendor)
        } catch (e: any) {
            Logger.Warning('Error in OnVendorSell: {e.Message}')
        }
    }
}

export class VendorItem {
    public Vendor: Unit
    public Item: number
    public Stock: number
    public RestockTime: number

    public VendorItem(vendor: Unit, item: number, stock: number, restockTime: number) {
        Vendor = vendor
        Item = item
        Stock = stock
        RestockTime = restockTime // May implement later? unsure.
    }
}
