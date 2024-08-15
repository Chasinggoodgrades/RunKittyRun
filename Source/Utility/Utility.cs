using System;
using System.Collections.Generic;
using System.Drawing;
using WCSharp.Api;
using WCSharp.Events;
using WCSharp.Shared;
using WCSharp.Shared.Data;
using WCSharp.Sync;
using static WCSharp.Api.Common;


public static class Utility
{
    public static void MakeUnitLocust(unit u)
    {
        u.AddAbility(FourCC("Aloc"));
        ShowUnit(u, false);
        u.RemoveAbility(FourCC("Aloc"));
        ShowUnit(u, true);
    }

    public static void SelectUnitForPlayer(player p, unit u)
    {
        var localplayer = GetLocalPlayer();
        if (p == localplayer)
        {
            ClearSelection();
            SelectUnit(u, true);
        }
    }

    public static void TimedTextToAllPlayers(float duration, string message)
    {
        foreach (var p in Globals.ALL_PLAYERS)
        {
            p.DisplayTimedTextTo(duration, message);
        }
    }

    public static string ConvertFloatToTime(float time, int teamID)
    {
        if (time <= 0.0f) return "0:00";
        var minutes = (int)time / 60;
        var seconds = (int)time % 60;
        if (seconds < 10) return Color.ColorString($"{minutes}:0{seconds}", teamID);
        return Color.ColorString($"{minutes}:{seconds}", teamID);
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
}
