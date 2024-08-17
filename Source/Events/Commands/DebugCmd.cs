using System;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class DebugCmd
{
    public static void Handle(player player, string command)
    {
        string[] cmd = command.Split(" ");
        var startswith = cmd[0];
        switch (startswith)
        {
            case "?ab":
                Console.WriteLine("Activating Barrier");
                BarrierSetup.ActivateBarrier();
                break;
            case "?db":
                Console.WriteLine("Deactivating Barrier");
                BarrierSetup.DeactivateBarrier();
                break;
            case "?endround":
                RoundManager.RoundEnd();
                break;
            case "?gold":
                var amount = cmd.Length > 1 ? int.Parse(cmd[1]) : 10000;
                player.Gold += amount;
                break;
            case "?level":
                var playerUnit = Globals.ALL_KITTIES[player].Unit;
                playerUnit.HeroLevel = cmd.Length > 1 ? int.Parse(cmd[1]) : 10;
                break;
            case "?blink":
                var kitty = Globals.ALL_KITTIES[player];
                kitty.Unit.AddItem(FourCC("desc"));
                break;
            case "?test1":
                Wolf w = Globals.ALL_WOLVES[GetRandomInt(0, Globals.ALL_WOLVES.Count - 1)];
                AffixFactory.ApplyRandomAffix(w);
                Console.WriteLine("Applied random affix");
                break;
            case "?diff":
                Difficulty.ChangeDifficulty(cmd.Length > 1 ? cmd[1] : "normal");
                break;
            case "?share":
                foreach (var p in Globals.ALL_PLAYERS)
                {
                    p.SetAlliance(player, ALLIANCE_SHARED_CONTROL, true);
                }
                break;
            default:
                player.DisplayTimedTextTo(10.0f, "Unknown command.");
                break;
        }
    }
}
