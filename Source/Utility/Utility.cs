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


    public static void Print(string message)
    {
        Console.WriteLine(message);
    }

    public static void MakeUnitLocust(unit u)
    {
        u.AddAbility(FourCC("Aloc"));
        ShowUnit(u, false);
        u.RemoveAbility(FourCC("Aloc"));
        ShowUnit(u, true);
    }

    public static void SelectUnitForPlayer(player p, unit u)
    {
        if (p == player.LocalPlayer)
        {
            ClearSelection();
            SelectUnit(u, true);
        }
    }

    public static bool IsDeveloper(player p)
    {
        foreach (var player in Globals.DEVELOPERS)
        {
            if (p.Name == player)
            {
                return true;
            }
        }
        return false;
    }
}
