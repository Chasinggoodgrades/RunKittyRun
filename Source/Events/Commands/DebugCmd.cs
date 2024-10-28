using System;
using System.ComponentModel;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class DebugCmd
{
    public static void Handle(player player, string command)
    {
        var cmd = command.Split(" ");
        var kitty = Globals.ALL_KITTIES[player];
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
                kitty.Unit.HeroLevel = cmd.Length > 1 ? int.Parse(cmd[1]) : 10;
                break;
            case "?blink":
                kitty.Unit.AddItem(FourCC("desc"));
                break;
            case "?test1":
                Console.WriteLine("Test 1");
                break;
            case "?test2":
                Console.WriteLine("Test 2");
                break;
            case "?diff":
                Difficulty.ChangeDifficulty(cmd.Length > 1 ? cmd[1] : "normal");
                AffixFactory.DistributeAffixes();
                break;
            case "?rpos":
                kitty.ReviveKitty();
                break;
            case "?rposall":
                foreach (var p in Globals.ALL_PLAYERS)
                    Globals.ALL_KITTIES[p].ReviveKitty();
                break;
            case "?data":
                try
                {
                    Console.WriteLine(kitty.SaveData.SelectedData[SelectedData.SelectedSkin]);
                }
                catch (Exception e)
                {
                    Console.WriteLine(e);
                }
                break;
            case "?share":
                foreach (var p in Globals.ALL_PLAYERS)
                    p.SetAlliance(player, ALLIANCE_SHARED_CONTROL, true);
                break;
            case "?award":
                AwardingCmds.Awarding(player, command);
                break;
            case "?stat":
                AwardingCmds.SettingGameStats(player, command);
                break;
            case "?oldcode":
                var x = Savecode.Create();
                x.Load(player, 1);
                break;
            case "?discord":
                DiscordFrame.Initialize();
                break;
            case "?test4":
                break;
            default:
                player.DisplayTimedTextTo(10.0f, "Unknown command.");
                break;
        }
    }
}
