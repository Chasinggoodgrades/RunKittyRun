using System;
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
    public static string ConvertFloatToTime(float time, int teamID)
    {
        if (time <= 0.0f) return "0:00";
        var minutes = time / 60;
        var seconds = time % 60;
        if (seconds < 10) return Colors.ColorString($"{minutes}:0{seconds}", teamID);
        return Colors.ColorString($"{minutes}:{seconds}", teamID);
    }

    /// <summary>
    /// Converts a float to time string
    /// No colorization.
    /// </summary>
    public static string ConvertFloatToTime(float time)
    {
        if (time <= 0.0f) return "0:00";
        var minutes = (int)(time / 60);
        var seconds = (int)(time % 60);
        //var tenths = (int)((time * 10) % 10); // Get the tenths of a second

        if (seconds < 10)
        {
            return $"{minutes}:0{seconds}";
        }
        return $"{minutes}:{seconds}";
    }

    public static bool IsDeveloper(player p)
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

    /// <summary>
    /// Creates a disposable timer for a specific duration to do a simple action.
    /// </summary>
    /// <param name="duration"></param>
    /// <param name="action"></param>
    public static void SimpleTimer(float duration, Action action)
    {
        var t = CreateTimer();
        TimerStart(t, duration, false, () =>
        {
            action();
            t.Dispose();
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
    /// Obtains the string path of the icon of an item.
    /// </summary>
    /// <param name="itemId"></param>
    /// <returns></returns>
    public static string GetItemIconPath(int itemId)
    {
        var item = CreateItem(itemId, 0, 0);
        var iconPath = item.Icon;
        item.Dispose();
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
    public static void CreateSimpleTextTag(string text, float duration, unit u, float height, int red, int green, int blue)
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
    /// Creates an effect using path, @ x & y, and disposes of it immediately.
    /// </summary>
    public static void CreateEffectAndDispose(string path, float x, float y)
    {
        effect e = effect.Create(path, x, y);
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

    public static void DropAllItems(unit Unit)
    {
        for (int i = 0; i < 6; i++)
        {
            var item = UnitItemInSlot(Unit, i);
            if(item != null)
                UnitDropItemPoint(Unit, item, Unit.X, Unit.Y);
        }
    }

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

        return stringBuilder.ToString();
    }

}
