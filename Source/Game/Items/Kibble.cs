using System;
using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public class Kibble : IDisposable
{
    public static trigger PickupTrigger;
    public static bool SpawningKibble = true;
    private static List<int> KibblesColors = KibbleList();
    private static string StarfallEffect = "Abilities\\Spells\\NightElf\\Starfall\\StarfallTarget.mdl";
    private static float TextTagHeight = 0.018f;
    private static int XPMax = 350;
    private static int GoldMax = 150;
    private static int JackpotMin = 600;
    private static int JackpotMax = 1500;

    public item Item;
    private int Type;
    private int JackPotIndex;
    private effect StarFallEffect;

    public Kibble()
    {
        PickupTrigger ??= KibblePickupEvents();
        Type = RandomKibbleType();
    }

    public void Dispose()
    {
        Item?.Dispose();
        Item = null;
        ObjectPool.ReturnObject(this);
    }

    public void SpawnKibble()
    {

        var regionNumber = GetRandomInt(0, RegionList.WolfRegions.Length - 1);
        var region = RegionList.WolfRegions[regionNumber];
        var x = GetRandomReal(region.Rect.MinX, region.Rect.MaxX);
        var y = GetRandomReal(region.Rect.MinY, region.Rect.MaxY);
        StarFallEffect ??= AddSpecialEffect(StarfallEffect, x, y);
        StarFallEffect.SetPosition(x, y, 0);
        StarFallEffect.PlayAnimation(ANIM_TYPE_BIRTH);
        JackPotIndex = 1;
        Item = CreateItem(Type, x, y);
    }

    #region Kibble Initialization

    private static int RandomKibbleType() => KibblesColors[GetRandomInt(0, KibblesColors.Count - 1)];

    private static trigger KibblePickupEvents()
    {
        var trig = trigger.Create();
        Blizzard.TriggerRegisterAnyUnitEventBJ(trig, playerunitevent.PickupItem);
        trig.AddAction(() =>
        {
            var item = @event.ManipulatedItem;
            if (!KibblesColors.Contains(item.TypeId)) return;
            KibblePickup(item);
        });
        return trig;
    }

    #endregion Kibble Initialization

    #region Kibble Pickup Logic

    private static void KibblePickup(item item)
    {
        try
        {
            if (item == null) return;

            var unit = @event.Unit;
            var player = unit.Owner;
            var kitty = Globals.ALL_KITTIES[player];
            effect effect = null;
            var randomChance = GetRandomReal(0, 100);
            var kib = ItemSpawner.TrackKibbles.Find(k => k.Item == item);


            if (randomChance <= 30) KibbleGoldReward(kitty, kib);
            else if (randomChance <= 60) KibbleXP(kitty);
            else KibbleNothing(kitty);

            if (randomChance <= 30) effect = AddSpecialEffect("Abilities\\Spells\\Other\\Transmute\\PileofGold.mdl", kitty.Unit.X, kitty.Unit.Y);
            GC.RemoveEffect(ref effect);

            KibbleEvent.StartKibbleEvent(randomChance);
            KibbleEvent.CollectEventKibble();

            IncrementKibble(kitty);
            PersonalBestAwarder.BeatKibbleCollection(kitty);

            if (kib != null && kib.Item != null)
            {
                kib.Dispose();
            }
        }
        catch (Exception e)
        {
            Logger.Warning($"Kibble.KibblePickup Error: {e.Message}");
            throw;
        }
    }

    private static void KibbleGoldReward(Kitty kitty, Kibble kib)
    {
        var jackPotChance = GetRandomInt(0, 100);
        int goldAmount;
        if (jackPotChance <= 3)
        {
            JackpotEffect(kitty, kib);
            return;
        }
        else goldAmount = GetRandomInt(1, GoldMax);
        kitty.Player.Gold += goldAmount;
        Utility.CreateSimpleTextTag($"+{goldAmount} Gold", 2.0f, kitty.Unit, TextTagHeight, 255, 215, 0);
    }

    private static void KibbleXP(Kitty kitty)
    {
        var xpAmount = GetRandomInt(50, XPMax);
        kitty.Unit.Experience += xpAmount;
        SoundManager.PlayKibbleTomeSound(kitty.Unit);
    }

    private static void KibbleNothing(Kitty kitty)
    {
        Utility.CreateSimpleTextTag("Nothing!", 2.0f, kitty.Unit, TextTagHeight, 50, 150, 150);
    }

    private static void JackpotEffect(Kitty kitty, Kibble kibble)
    {
        var unitX = kitty.Unit.X;
        var unitY = kitty.Unit.Y;
        var newX = WCSharp.Shared.Util.PositionWithPolarOffsetRadX(unitX, 150.0f, kibble.JackPotIndex * 36.0f);
        var newY = WCSharp.Shared.Util.PositionWithPolarOffsetRadY(unitY, 150.0f, kibble.JackPotIndex * 36.0f);

        var effect = AddSpecialEffect("Abilities\\Spells\\Other\\Transmute\\PileofGold.mdl", newX, newY);
        GC.RemoveEffect(ref effect);
        kibble.JackPotIndex += 1;

        if (kibble.JackPotIndex >= 20)
        {
            var goldAmount = GetRandomInt(JackpotMin, JackpotMax);
            var isSuperJackpot = GetRandomInt(1, 10) == 1;
            if (isSuperJackpot) goldAmount *= 10;

            kitty.Player.Gold += goldAmount;
            string jackpotString = isSuperJackpot ? $"{Colors.COLOR_RED}Super Jackpot" : "jackpot";
            string msg = $"{Colors.PlayerNameColored(kitty.Player)}{Colors.HighlightString($" has won the {jackpotString} for ")}{Colors.COLOR_YELLOW_ORANGE}{goldAmount} Gold|r";

            Console.WriteLine(msg);
            Utility.CreateSimpleTextTag($"+{goldAmount} Gold", 2.0f, kitty.Unit, TextTagHeight, 255, 215, 0);
            if (isSuperJackpot) kitty.SaveData.KibbleCurrency.SuperJackpots += 1;
            else kitty.SaveData.KibbleCurrency.Jackpots += 1;
        }
        else
            Utility.SimpleTimer(0.15f, () => JackpotEffect(kitty, kibble));
    }

    #endregion Kibble Pickup Logic

    #region Utility Methods

    private static void IncrementKibble(Kitty kibblePicker)
    {
        kibblePicker.CurrentStats.CollectedKibble += 1;

        foreach (var player in Globals.ALL_PLAYERS)
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

    #endregion Utility Methods
}
