using System;
using System.Text;
using WCSharp.Api;
using WCSharp.Shared;
using static WCSharp.Api.Common;

public static class Utility
{
    private static int Locust = FourCC("Aloc");
    private static StringBuilder stringBuilder = new StringBuilder();

    /// <summary>
    /// Makes the unit unclickable while remaining selectable.
    /// </summary>
    /// <param name="u"></param>
    public static void MakeUnitLocust(unit u)
    {
        u.AddAbility(Locust);
        ShowUnit(u, false);
        u.RemoveAbility(Locust);
        ShowUnit(u, true);
    }

    public static void SelectUnitForPlayer(player p, unit u)
    {
        if (GetLocalPlayer() != p) return;
        ClearSelection();
        SelectUnit(u, true);
    }

    /// <summary>
    /// Display a timed text message to all players.
    /// </summary>
    /// <param name="duration">How long to show the message.</param>
    /// <param name="message">Whats the message?</param>
    public static void TimedTextToAllPlayers(float duration, string message)
    {
        for (int i = 0; i < Globals.ALL_PLAYERS.Count; i++)
        {
            Globals.ALL_PLAYERS[i].DisplayTimedTextTo(duration, message);
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
        var tenths = (int)(time * 10 % 10);

        string timeString = seconds < 10 ? $"{minutes}:0{seconds}.{tenths}" : $"{minutes}:{seconds}.{tenths}";
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
        var tenths = (int)(time * 10 % 10);

        return seconds < 10 ? $"{minutes}:0{seconds}.{tenths}" : $"{minutes}:{seconds}.{tenths}";
    }

    /// <summary>
    /// Converts the float to a time string without tenths.
    /// </summary>
    /// <param name="time"></param>
    /// <returns></returns>
    public static string ConvertFloatToTimeInt(float time)
    {
        if (time <= 0.0f) return "0:00";

        var minutes = (int)(time / 60);
        var seconds = (int)(time % 60);

        return seconds < 10 ? $"{minutes}:0{seconds}" : $"{minutes}:{seconds}";
    }

    public static bool IsDeveloper(player p)
    {
        try
        {
            for (int i = 0; i < Globals.VIPLIST.Length;  i++)
            {
                if (p.Name == Base64.FromBase64(Globals.VIPLIST[i]))
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
        AchesHandles.SimpleTimer(duration, action);
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
        for (int i = 0; i < 6; i++)
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
        SimpleTimer(duration, () => tt?.Dispose());
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

        unit.Mana = newMana >= maxMana ? maxMana - 1 : newMana;
    }

    /// <summary>
    /// Formats an award name by inserting spaces before capital letters.
    /// </summary>
    /// <param name="awardName">The award name to be formatted.</param>
    /// <returns>The formatted award name.</returns>
    public static string FormatAwardName(string awardName)
    {
        stringBuilder.Clear();
        for (int i = 0; i < awardName.Length; i++)
        {
            if (i > 0 && char.IsUpper(awardName[i]))
            {
                stringBuilder.Append(' ');
            }
            stringBuilder.Append(awardName[i]);
        }

        var s = stringBuilder.ToString();
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
        Globals.ALL_KITTIES[player].NameTag?.Dispose();
        RoundManager.RoundEndCheck();
        MultiboardUtil.RefreshMultiboards();
    }

    public static player GetPlayerByName(string playerName)
    {
        // if playername is close to a player name, return.. However playerName should be atleast 3 chars long
        if (playerName.Length < 3) return null;
        for (int i = 0; i < Globals.ALL_PLAYERS.Count; i++)
        {
            var p = Globals.ALL_PLAYERS[i];
            if (p.Name.ToLower().Contains(playerName.ToLower()))
            {
                return p;
            }
        }
        return null;
    }

    public static int GetItemSkin(int itemId)
    {
        if (itemId == 0) return 0;
        var item = CreateItem(itemId, 0, 0);
        var skin = BlzGetItemSkin(item);
        item.Dispose();
        item = null;
        return skin;
    }

    public static void EffectReplayMagic(effect effect, float x, float y, float z)
    {
        BlzSetSpecialEffectAlpha(effect, 255);
        BlzSetSpecialEffectColor(effect, 255, 255, 255);
        BlzSetSpecialEffectTime(effect, 0);
        BlzSetSpecialEffectTimeScale(effect, 0.0f);
        BlzSpecialEffectClearSubAnimations(effect);
        effect.SetPosition(x, y, z);
        BlzPlaySpecialEffect(effect, animtype.Birth);
    }

    public static string FormattedColorPlayerName(player p)
    {
        // removes everything after '#' in the player name
        var name = p.Name.Split('#')[0];
        return $"{Colors.ColorString(name, p.Id + 1)}";
    }

    public static filterfunc CreateFilterFunc(Func<bool> func)
    {
        return filterfunc.Create(func);
    }
}
