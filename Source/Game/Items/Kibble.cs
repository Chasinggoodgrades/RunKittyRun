﻿using static WCSharp.Api.Common;
using WCSharp.Api;
using System.Collections.Generic;
using System;
using System.Runtime.CompilerServices;
public class Kibble
{
    public static Dictionary<player, int> PickedUpKibble = new Dictionary<player, int>();
    public static trigger PickupTrigger;
    private static List<int> KibblesColors = KibbleList();
    private static string StarfallEffect = "Abilities\\Spells\\NightElf\\Starfall\\StarfallTarget.mdl";
    private static float TextTagHeight = 0.018f;
    private static int XPMax = 350;
    private static int GoldMax = 150;
    private static int JackpotMin = 600;
    private static int JackpotMax = 1500;
    private int Type;
    private int JackPotIndex = 1;
    private triggeraction TrigActions;
    public item Item;
    public Kibble()
    {
        PickupTrigger ??= KibblePickupEvents();
        Type = RandomKibbleType();
        Item = SpawnKibble();
        AddKibblePickupActions();
    }

    public void Dispose()
    {
        // kibble never "owned" 
        Item.Dispose();
        Item = null;
        PickupTrigger.RemoveAction(TrigActions);
        TrigActions = null;
    }

    private static int RandomKibbleType() => KibblesColors[GetRandomInt(0, KibblesColors.Count - 1)];

    private item SpawnKibble()
    {
        var regionNumber = GetRandomInt(0, RegionList.WolfRegions.Length - 1);
        var region = RegionList.WolfRegions[regionNumber];
        var x = GetRandomReal(region.Rect.MinX, region.Rect.MaxX);
        var y = GetRandomReal(region.Rect.MinY, region.Rect.MaxY);
        Utility.CreateEffectAndDispose(StarfallEffect, x, y);
        return CreateItem(Type, x, y);
    }
    
    private trigger KibblePickupEvents()
    {
        var trig = trigger.Create();
        foreach (var player in Globals.ALL_PLAYERS)
            trig.RegisterPlayerUnitEvent(player, EVENT_PLAYER_UNIT_PICKUP_ITEM, null);
        return trig;
    }

    private void AddKibblePickupActions()
    {
        TrigActions = PickupTrigger.AddAction(() =>
        {
            if (@event.ManipulatedItem != Item) return;
            KibblePickup();
        });
    }

    private void KibblePickup()
    {
        try
        {
            // either some gold, or xp... jack pot.. or a reward
            var unit = @event.Unit;
            var player = unit.Owner;
            var kitty = Globals.ALL_KITTIES[player];
            effect effect = null;
            var randomChance = GetRandomReal(0, 100);
            //if (randomChance <= 0.5) KibbleReward(kitty); // .5% Chance
            if (randomChance <= 30) KibbleGoldReward(kitty); // 20% Chance
            else if (randomChance <= 60) KibbleXP(kitty); // 20% Chance
            else KibbleNothing(kitty); // 55% Chance

            if (randomChance <= 30) effect = AddSpecialEffect("Abilities\\Spells\\Other\\Transmute\\PileofGold.mdl", kitty.Unit.X, kitty.Unit.Y);
            GC.RemoveEffect(ref effect);

            IncrementKibble(player);
        }
        catch (Exception e)
        {
            Logger.Warning(e.Message);
            Logger.Warning("Kibble Pickup Error");
            throw;
        }
    }

    private void KibbleReward(Kitty kitty)
    {
        //Console.WriteLine("Kibble Reward Later..");
    }

    private void KibbleGoldReward(Kitty kitty)
    {
        var jackPotChance = GetRandomInt(0, 100);
        var goldAmount = 0;
        if (jackPotChance <= 3) {
            JackpotEffect(kitty);
            return;
        }
        else goldAmount = GetRandomInt(1, GoldMax);
        kitty.Player.Gold += goldAmount;
        Utility.CreateSimpleTextTag($"+{goldAmount} Gold", 2.0f, kitty.Unit, TextTagHeight, 255, 215, 0);
    }

    private void KibbleXP(Kitty kitty)
    {
        var xpAmount = GetRandomInt(50, XPMax);
        kitty.Unit.Experience += xpAmount;
        SoundManager.PlayKibbleTomeSound(kitty.Unit);
    }

    private void KibbleNothing(Kitty kitty)
    {
        Utility.CreateSimpleTextTag("Nothing!", 2.0f, kitty.Unit, TextTagHeight, 50, 150, 150);
    }

    private void JackpotEffect(Kitty kitty)
    {
        var unitX = kitty.Unit.X;
        var unitY = kitty.Unit.Y;

        // Use PositionWithPolarOffset to calculate new point
        var newX = WCSharp.Shared.Util.PositionWithPolarOffsetRadX(unitX, 150.0f, JackPotIndex * 36.0f);
        var newY = WCSharp.Shared.Util.PositionWithPolarOffsetRadY(unitY, 150.0f, JackPotIndex * 36.0f);

        var effect = AddSpecialEffect("Abilities\\Spells\\Other\\Transmute\\PileofGold.mdl", newX, newY);
        GC.RemoveEffect(ref effect);
        JackPotIndex += 1;

        if (JackPotIndex >= 20)
        {
            Dispose();
            var goldAmount = GetRandomInt(JackpotMin, JackpotMax);

            // Roll for super jackpot (1/10 chance)
            var isSuperJackpot = GetRandomInt(1, 10) == 1;
            if (isSuperJackpot) goldAmount *= 10;

            kitty.Player.Gold += goldAmount;
            string jackpotString = isSuperJackpot ? $"{Colors.COLOR_RED}Super Jackpot" : "jackpot";
            string msg = $"{Colors.PlayerNameColored(kitty.Player)}{Colors.HighlightString($" has won the {jackpotString} for ")}{Colors.COLOR_YELLOW_ORANGE}{goldAmount} Gold|r";

            Console.WriteLine(msg);
            Utility.CreateSimpleTextTag($"+{goldAmount} Gold", 2.0f, kitty.Unit, TextTagHeight, 255, 215, 0);
        }
        else
        {
            Utility.SimpleTimer(0.15f, () => JackpotEffect(kitty));
        }
    }


    private static void IncrementKibble(player kibblePicker)
    {
        if (PickedUpKibble.ContainsKey(kibblePicker)) PickedUpKibble[kibblePicker] += 1;
        else PickedUpKibble.Add(kibblePicker, 1);

        foreach (var player in Globals.ALL_PLAYERS)
            player.Lumber += 1;
    }

    private static List<int> KibbleList()
    {
        if (SeasonalManager.Season == HolidaySeasons.Christmas)
        {
            return new List<int>
            {
                Constants.ITEM_PRESENT
            };
        }
        if (SeasonalManager.Season == HolidaySeasons.Valentines)
        {
            return new List<int>
            {
                Constants.ITEM_HEART
            };
        }
        return new List<int>
        {
            Constants.ITEM_KIBBLE,
            Constants.ITEM_KIBBLE_TEAL,
            Constants.ITEM_KIBBLE_GREEN,
            Constants.ITEM_KIBBLE_PURPLE,
            Constants.ITEM_KIBBLE_RED,
            Constants.ITEM_KIBBLE_YELLOW
        };
    }
}

