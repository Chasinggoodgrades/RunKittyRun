using System;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class DebugCmd
{
    public static void Handle(player player, string command)
    {
        var cmd = command.Split(" ");
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
                Console.WriteLine("Test 1");
                RewardChecker.CheckAllGameAwards(player);
                break;
            case "?test2":
                Console.WriteLine("Test 2");
                var playerTest2 = Globals.ALL_KITTIES[player];
                //BlzSetUnitSkin(Globals.ALL_KITTIES[player].Unit, Constants.UNIT_ASTRAL_KITTY);
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
