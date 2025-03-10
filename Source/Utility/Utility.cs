﻿using System;
using System.Text;
using WCSharp.Api;
using WCSharp.Shared;
using static WCSharp.Api.Common;


public static class Utility
{
    /// <summary>
    /// Makes the unit unclickable while remaining selectable.
    /// </summary>
    /// <param name="u"></param>
    public static void MakeUnitLocust(unit u)
    {
        u.AddAbility(FourCC("Aloc"));
        ShowUnit(u, false);
        u.RemoveAbility(FourCC("Aloc"));
        ShowUnit(u, true);
    }

    public static void SelectUnitForPlayer(player p, unit u)
    {
        var localplayer = player.LocalPlayer;
        if (p == localplayer)
        {
            ClearSelection();
            SelectUnit(u, true);
        }
    }

    /// <summary>
    /// Display a timed text message to all players.
    /// </summary>
    /// <param name="duration">How long to show the message.</param>
    /// <param name="message">Whats the message?</param>
    public static void TimedTextToAllPlayers(float duration, string message)
    {
        foreach (var p in Globals.ALL_PLAYERS)
        {
            p.DisplayTimedTextTo(duration, message);
        }
    }

    /// <summary>
    /// Converts a float to time string.
    /// Used for colorizing the time string in Teams mode.
    /// </summary>
    /// <summary>
    /// Converts a float to time string tenths.
    /// Used for colorizing the time string in Teams mode.
    /// </summary>
    public static string ConvertFloatToTime(float time, int teamID)
    {
        if (time <= 0.0f) return "0:00.0";

        var minutes = (int)(time / 60);
        var seconds = (int)(time % 60);
        var tenths = (int)((time * 10) % 10);

        string timeString;
        if (seconds < 10)
        {
            timeString = $"{minutes}:0{seconds}.{tenths}";
        }
        else
        {
            timeString = $"{minutes}:{seconds}.{tenths}";
        }

        return Colors.ColorString(timeString, teamID);
    }


    /// <summary>
    /// Converts a float to time string tenths.
    /// No colorization.
    /// </summary>
    public static string ConvertFloatToTime(float time)
    {
        if (time <= 0.0f) return "0:00.0";

        var minutes = (int)(time / 60);
        var seconds = (int)(time % 60);
        var tenths = (int)((time * 10) % 10);

        if (seconds < 10)
        {
            return $"{minutes}:0{seconds}.{tenths}";
        }
        return $"{minutes}:{seconds}.{tenths}";
    }

    public static string ConvertFloatToTimeInt(float time)
    {
        if (time <= 0.0f) return "0:00";

        var minutes = (int)(time / 60);
        var seconds = (int)(time % 60);

        if (seconds < 10)
        {
            return $"{minutes}:0{seconds}";
        }
        return $"{minutes}:{seconds}";
    }


    public static bool IsDeveloper(player p)
    {
        try
        {
            foreach (var player in Globals.VIPLIST)
            {
                if (p.Name == Base64.FromBase64(player))
                {
                    return true;
                }
            }
            return false;
        }
        catch (Exception ex)
        {
            Logger.Warning(ex.StackTrace);
            return false;
        }
    }

    /// <summary>
    /// Creates a disposable timer for a specific duration to do a simple action.
    /// </summary>
    /// <param name="duration"></param>
    /// <param name="action"></param>
    public static void SimpleTimer(float duration, Action action)
    {
        var t = timer.Create();
        t.Start(duration, false, () =>
        {
            action();
            t.Dispose();
            t = null;
        });
    }

    /// <summary>
    /// Determines if the specified unit has an item with the given itemId.
    /// </summary>
    /// <param name="u">The unit to check for the item.</param>
    /// <param name="itemId">The ID of the item to check for.</param>
    /// <returns>True if the unit has the item, otherwise false.</returns>
    public static bool UnitHasItem(unit u, int itemId)
    {
        for (int i = 0; i < 6; i++)
        {
            if (GetItemTypeId(UnitItemInSlot(u, i)) == itemId)
                return true;
        }
        return false;
    }

    /// <summary>
    /// Returns how many of that item a player has in their inventory.
    /// </summary>
    /// <param name="u"></param>
    /// <param name="itemId"></param>
    /// <returns></returns>
    public static int UnitHasItemCount(unit u, int itemId)
    {
        var count = 0;
        for(int i = 0; i < 6; i ++)
        {
            if (GetItemTypeId(UnitItemInSlot(u, i)) == itemId)
                count++;
        }
        return count;
    }

    /// <summary>
    /// Returns the item if the unit has it, otherwise null.
    /// </summary>
    /// <param name="u"></param>
    /// <param name="itemId"></param>
    /// <returns></returns>
    public static item UnitGetItem(unit u, int itemId)
    {
        for (int i = 0; i < 6; i++)
        {
            if (GetItemTypeId(UnitItemInSlot(u, i)) == itemId)
                return UnitItemInSlot(u, i);
        }
        return null;
    }

    /// <summary>
    /// Returns the slot of the item if the unit has it, otherwise -1.
    /// </summary>
    /// <param name="u"></param>
    /// <param name="itemId"></param>
    /// <returns></returns>
    public static int GetSlotOfItem(unit u, int itemId)
    {
        for (int i = 0; i < 6; i++)
        {
            if (GetItemTypeId(UnitItemInSlot(u, i)) == itemId)
                return i;
        }
        return -1;
    }

    /// <summary>
    /// If the unit has the item, it'll be deleted.
    /// </summary>
    /// <param name="u"></param>
    /// <param name="itemId"></param>
    public static void RemoveItemFromUnit(unit u, int itemId)
    {
        for (int i = 0; i < 6; i++)
        {
            if (GetItemTypeId(UnitItemInSlot(u, i)) == itemId)
            {
                UnitItemInSlot(u, i).Dispose();
                return;
            }
        }
    }

    /// <summary>
    /// Obtains and returns the string path of the icon of an item.
    /// </summary>
    /// <param name="itemId"></param>
    /// <returns></returns>
    public static string GetItemIconPath(int itemId)
    {
        var item = CreateItem(itemId, 0, 0);
        var iconPath = item.Icon;
        item.Dispose();
        item = null;
        return iconPath;
    }

    /// <summary>
    /// Self explanatory. Creates a texttag over the player's head.
    /// </summary>
    /// <param name="text"></param>
    /// <param name="duration"></param>
    /// <param name="u"></param>
    /// <param name="height"></param>
    /// <param name="red"></param>
    /// <param name="green"></param>
    /// <param name="blue"></param>
    public static void CreateSimpleTextTag(string text, float duration, unit u, float height = 0.015f, int red = 255, int green = 255, int blue = 255)
    {
        var tt = texttag.Create();
        tt.SetText(text, height);
        tt.SetColor(red, green, blue, 255);
        tt.SetPosition(u.X, u.Y, 0);
        tt.SetVelocity(0, 0.02f);
        tt.SetVisibility(true);
        SimpleTimer(duration, () => tt.Dispose());
    }

    /// <summary>
    /// Gives the player owner of u the amount of gold as well as shows a floating text displaying how much gold they recieved.
    /// </summary>
    /// <param name="amount"></param>
    /// <param name="u"></param>
    public static void GiveGoldFloatingText(int amount, unit u)
    {
        u.Owner.Gold += amount;
        CreateSimpleTextTag($"+{amount} Gold", 2.0f, u, 0.018f, 255, 215, 0);
    }

    /// <summary>
    /// Creates an effect using the specified path at the given x and y coordinates,
    /// and disposes of it immediately.
    /// </summary>
    /// <param name="path">The path to the effect resource.</param>
    /// <param name="x">The x-coordinate at which to create the effect.</param>
    /// <param name="y">The y-coordinate at which to create the effect.</param>
    public static void CreateEffectAndDispose(string path, float x, float y)
    {
        effect e = effect.Create(path, x, y);
        e.Dispose();
        e = null;
    }

    /// <summary>
    /// Creates an effect using the specified path at the given unit and attach point,
    /// </summary>
    /// <param name="path"></param>
    /// <param name="u"></param>
    /// <param name="attachPoint"></param>
    public static void CreateEffectAndDispose(string path, unit u, string attachPoint)
    {
        effect e = effect.Create(path, u, attachPoint);
        e.Dispose();
        e = null;
    }


    /// <summary>
    /// Clears the screen of all messages for the given player.
    /// </summary>
    /// <param name="player"></param>
    public static void ClearScreen(player player)
    {
        if (!player.IsLocal) return; 
        ClearTextMessages(); 
    }

    /// <summary>
    /// Drops all items held by the specified unit.
    /// </summary>
    /// <param name="Unit">The unit whose items are to be dropped.</param>
    public static void DropAllItems(unit Unit)
    {
        for (int i = 0; i < 6; i++)
        {
            var item = UnitItemInSlot(Unit, i);
            if (item != null)
                UnitDropItemPoint(Unit, item, Unit.X, Unit.Y);
        }
    }

    /// <summary>
    /// Adds mana to a unit, without exceeding the unit's maximum mana.
    /// </summary>
    /// <param name="unit">The unit to which mana is to be added.</param>
    /// <param name="amount">The amount of mana to add.</param>
    public static void UnitAddMana(unit unit, int amount)
    {
        var maxMana = unit.MaxMana;
        var currentMana = unit.Mana;
        var newMana = currentMana + amount;

        if (newMana >= maxMana)
            unit.Mana = maxMana - 1;
        else
            unit.Mana = newMana;
    }

    /// <summary>
    /// Formats an award name by inserting spaces before capital letters.
    /// </summary>
    /// <param name="awardName">The award name to be formatted.</param>
    /// <returns>The formatted award name.</returns>
    public static string FormatAwardName(string awardName)
    {
        var stringBuilder = new StringBuilder();

        for (int i = 0; i < awardName.Length; i++)
        {
            if (i > 0 && char.IsUpper(awardName[i]))
            {
                stringBuilder.Append(' ');
            }
            stringBuilder.Append(awardName[i]);
        }

        var s = stringBuilder.ToString();
        stringBuilder.Clear();
        stringBuilder = null;

        return s;
    }

    /// <summary>
    /// Makes a player a spectator by removing them from their team,
    /// disposing of their in-game objects, and refreshing the game state.
    /// </summary>
    /// <param name="player">The player to be made a spectator.</param>
    public static void MakePlayerSpectator(player player)
    {
        PlayerLeaves.TeamRemovePlayer(player);
        Globals.ALL_KITTIES[player].Dispose();
        Globals.ALL_CIRCLES[player].Dispose();
        Globals.ALL_PLAYERS.Remove(player);
        FloatingNameTag.PlayerNameTags[player].Dispose();
        RoundManager.RoundEndCheck();
        MultiboardUtil.RefreshMultiboards();
    }

    public static string FormattedColorPlayerName(player p)
    {
        // removes everything after '#' in the player name
        var name = p.Name.Split('#')[0];
        return $"{Colors.ColorString(name, p.Id+1)}";
    }

    public static filterfunc CreateFilterFunc(Func<bool> func)
    {
        return filterfunc.Create(func);
    }

}
