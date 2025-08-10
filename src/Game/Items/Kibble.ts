

class Kibble extends IDisposable
{
    public static PickupTrigger: trigger;
    public static SpawningKibble: boolean = true;
    private static List<int> KibblesColors = KibbleList();
    private static StarfallEffect: string = "Abilities\\Spells\\NightElf\\Starfall\\StarfallTarget.mdl";
    private static TextTagHeight: number = 0.018;
    private static XPMax: number = 350;
    private static GoldMax: number = 150;
    private static JackpotMin: number = 600;
    private static JackpotMax: number = 1500;

    public Item: item;
    private Type: number;
    private JackPotIndex: number;
    private StarFallEffect: effect;

    public Kibble()
    {
        PickupTrigger ??= KibblePickupEvents();
        Type = RandomKibbleType();
    }

    public Dispose()
    {
        Item?.Dispose();
        Item = null;
        ObjectPool<Kibble>.ReturnObject(this);
    }

    public SpawnKibble()
    {

        let regionNumber = GetRandomInt(0, RegionList.WolfRegions.Length - 1);
        let region = RegionList.WolfRegions[regionNumber];
        let x = GetRandomReal(region.Rect.MinX, region.Rect.MaxX);
        let y = GetRandomReal(region.Rect.MinY, region.Rect.MaxY);
        StarFallEffect ??= AddSpecialEffect(StarfallEffect, x, y);
        StarFallEffect.SetPosition(x, y, 0);
        StarFallEffect.PlayAnimation(ANIM_TYPE_BIRTH);
        JackPotIndex = 1;
        Item = CreateItem(Type, x, y);
        ItemSpatialGrid.RegisterKibble(this);
    }

    // #region Kibble Initialization

    private static RandomKibbleType(): number  { return KibblesColors[GetRandomInt(0, KibblesColors.Count - 1)]; }

    private static KibblePickupEvents(): trigger
    {
        let trig = trigger.Create();
        Blizzard.TriggerRegisterAnyUnitEventBJ(trig, playerunitevent.PickupItem);
        trig.AddAction(() =>
        {
            let item = GetManipulatedItem();
            if (!KibblesColors.Contains(item.TypeId)) return;
            KibblePickup(item);
        });
        return trig;
    }

    // #endregion Kibble Initialization

    // #region Kibble Pickup Logic

    private static KibblePickup(item: item)
    {
        try
        {
            if (item == null) return;

            let unit = GetTriggerUnit();
            let player = unit.Owner;
            let kitty = Globals.ALL_KITTIES[player];
            let effect: effect = null;
            let randomChance = GetRandomReal(0, 100);
            let kib = ItemSpawner.TrackKibbles.Find(k => k.Item == item);

            if (randomChance <= 30) KibbleGoldReward(kitty, kib);
            else if (randomChance <= 60) KibbleXP(kitty);
            let KibbleNothing: else(kitty);

            if (randomChance <= 30) effect = AddSpecialEffect("Abilities\\Spells\\Other\\Transmute\\PileofGold.mdl", kitty.Unit.X, kitty.Unit.Y);
            GC.RemoveEffect( effect); // TODO; Cleanup:             GC.RemoveEffect(ref effect);

            KibbleEvent.StartKibbleEvent(randomChance);
            KibbleEvent.CollectEventKibble();

            IncrementKibble(kitty);
            PersonalBestAwarder.BeatKibbleCollection(kitty);

            if (kib != null && kib.Item != null)
            {
                kib.Dispose();
            }
        }
        catch (e: Error)
        {
            Logger.Warning("Kibble.Error: KibblePickup: {e.Message}");
            throw new Error() // TODO; Rethrow actual error
        }
    }

    private static KibbleGoldReward(kitty: Kitty, kib: Kibble)
    {
        let jackPotChance = GetRandomInt(0, 100);
        let goldAmount: number;
        if (jackPotChance <= 3)
        {
            JackpotEffect(kitty, kib);
            return;
        }
        let goldAmount: else = GetRandomInt(1, GoldMax);
        kitty.Player.Gold += goldAmount;
        Utility.CreateSimpleTextTag("+{goldAmount} Gold", 2.0, kitty.Unit, TextTagHeight, 255, 215, 0);
    }

    private static KibbleXP(kitty: Kitty)
    {
        let xpAmount = GetRandomInt(50, XPMax);
        kitty.Unit.Experience += xpAmount;
        SoundManager.PlayKibbleTomeSound(kitty.Unit);
    }

    private static KibbleNothing(kitty: Kitty)
    {
        Utility.CreateSimpleTextTag("Nothing!", 2.0, kitty.Unit, TextTagHeight, 50, 150, 150);
    }

    private static JackpotEffect(kitty: Kitty, kibble: Kibble)
    {
        let unitX = kitty.Unit.X;
        let unitY = kitty.Unit.Y;
        let newX = WCSharp.Shared.Util.PositionWithPolarOffsetRadX(unitX, 150.0, kibble.JackPotIndex * 36.0);
        let newY = WCSharp.Shared.Util.PositionWithPolarOffsetRadY(unitY, 150.0, kibble.JackPotIndex * 36.0);

        let effect = AddSpecialEffect("Abilities\\Spells\\Other\\Transmute\\PileofGold.mdl", newX, newY);
        GC.RemoveEffect( effect); // TODO; Cleanup:         GC.RemoveEffect(ref effect);
        kibble.JackPotIndex += 1;

        if (kibble.JackPotIndex >= 20)
        {
            let goldAmount = GetRandomInt(JackpotMin, JackpotMax);
            let isSuperJackpot = GetRandomInt(1, 10) == 1;
            if (isSuperJackpot) goldAmount *= 10;

            kitty.Player.Gold += goldAmount;

            let jackpotString: string = isSuperJackpot ? "{Colors.COLOR_RED}Jackpot: Super{Colors.COLOR_RESET}" : "jackpot";
            let msg: string = "{Colors.PlayerNameColored(kitty.Player)}{Colors.HighlightString(" won: the: has {jackpotString}")} {Colors.HighlightString("for")} {Colors.COLOR_YELLOW_ORANGE}{goldAmount} Gold|r";

            Utility.TimedTextToAllPlayers(3.0, msg); // was too long previously.
            Utility.CreateSimpleTextTag("+{goldAmount} Gold", 2.0, kitty.Unit, TextTagHeight, 255, 215, 0);
            if (isSuperJackpot)
            {
                kitty.SaveData.KibbleCurrency.SuperJackpots += 1;
                kitty.CurrentStats.CollectedSuperJackpots += 1;
            }
            else
            {
                kitty.SaveData.KibbleCurrency.Jackpots += 1;
                kitty.CurrentStats.CollectedJackpots += 1;
            }
        }
        else
            Utility.SimpleTimer(0.15, () => JackpotEffect(kitty, kibble));
    }

    // #endregion Kibble Pickup Logic

    // #region Utility Methods

    private static IncrementKibble(kibblePicker: Kitty)
    {
        kibblePicker.CurrentStats.CollectedKibble += 1;

        for (let player in Globals.ALL_PLAYERS)
            player.Lumber += 1;

        kibblePicker.SaveData.KibbleCurrency.Collected += 1;
    }

    private static List<int> KibbleList()
    {
        return SeasonalManager.Season switch
        {
            HolidaySeasons.Christmas => new List<int> { Constants.ITEM_PRESENT },
            // HolidaySeasons.Easter => new List<int> { Constants.ITEM_EASTER_EGG },
            HolidaySeasons.Valentines => new List<int> { Constants.ITEM_HEART },
            _ => new List<int> // Default case
            {
                Constants.ITEM_KIBBLE,
                Constants.ITEM_KIBBLE_TEAL,
                Constants.ITEM_KIBBLE_GREEN,
                Constants.ITEM_KIBBLE_PURPLE,
                Constants.ITEM_KIBBLE_RED,
                Constants.ITEM_KIBBLE_YELLOW
            }
        };
    }

    // #endregion Utility Methods
}
