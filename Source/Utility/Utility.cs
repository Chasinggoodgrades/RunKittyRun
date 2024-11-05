using System;
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
        var minutes = (int)time / 60;
        var seconds = (int)time % 60;
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
        var minutes = (int)time / 60;
        var seconds = (int)time % 60;
        if (seconds < 10) return $"{minutes}:0{seconds}";
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

    public static string GetItemIconPath(int itemId)
    {
        var item = CreateItem(itemId, 0, 0);
        var iconPath = item.Icon;
        item.Dispose();
        return iconPath;
    }

    public static void CreateSimpleTextTag(string text, float duration, unit u, float height, int red, int green, int blue)
    {
        var tt = CreateTextTag();
        tt.SetText(text, height);
        tt.SetColor(red, green, blue, 255);
        tt.SetPosition(u.X, u.Y, 0);
        tt.SetVelocity(0, 0.02f);
        tt.SetVisibility(true);
        SimpleTimer(duration, () => tt.Dispose());
    }
}
