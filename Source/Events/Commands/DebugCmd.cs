﻿using System;
using System.ComponentModel;
using System.Linq;
using System.Text.Json.Serialization;
using WCSharp.Api;
using WCSharp.Json;
using WCSharp.SaveLoad;
using static WCSharp.Api.Common;

public static class DebugCmd
{
    public static void Handle(player player, string command)
    {
        var cmd = command.Split(" ");
        var kitty = Globals.ALL_KITTIES[player];
        var selectedUnit = CustomStatFrame.SelectedUnit[player.Id];
        var selectedPlayer = selectedUnit.Owner;
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
            case "?er":
                RoundManager.RoundEnd();
                break;
            case "?gold":
                var amount = cmd.Length > 1 ? int.Parse(cmd[1]) : 10000;
                selectedPlayer.Gold += amount;
                break;
            case "?level":
            case "?lvl":
                selectedUnit.HeroLevel = cmd.Length > 1 ? int.Parse(cmd[1]) : 10;
                break;
            case "?blink":
            case "?tele":
                kitty.Unit.AddItem(FourCC("desc"));
                break;
            case "?diff":
                Difficulty.ChangeDifficulty(cmd.Length > 1 ? cmd[1] : "normal");
                AffixFactory.DistributeAffixes();
                MultiboardUtil.RefreshMultiboards();
                NitroChallenges.SetNitroRoundTimes();
                break;
            case "?rpos":
                kitty.ReviveKitty();
                break;
            case "?rposall":
                foreach (var p in Globals.ALL_PLAYERS)
                    Globals.ALL_KITTIES[p].ReviveKitty();
                break;
            case "?share":
                foreach (var p in Globals.ALL_PLAYERS)
                    p.SetAlliance(player, ALLIANCE_SHARED_CONTROL, true);
                break;
            case "?wshare":
                player.NeutralAggressive.SetAlliance(player, ALLIANCE_SHARED_CONTROL, true);
                player.NeutralExtra.SetAlliance(player, ALLIANCE_SHARED_CONTROL, true);
                player.NeutralPassive.SetAlliance(player, ALLIANCE_SHARED_CONTROL, true);
                player.NeutralVictim.SetAlliance(player, ALLIANCE_SHARED_CONTROL, true);
                break;
            case "?cooldown":
                selectedUnit.ResetCooldowns();
                break;
            case "?christmas":
                SeasonalManager.ActivateChristmas();
                break;
            case "?noseason":
                SeasonalManager.NoSeason();
                break;
            case "?col":
                Console.WriteLine($"Current Collision Value: {CollisionDetection.KITTY_COLLISION_RADIUS[player]}");
                break;
            case "?award":
                AwardingCmds.Awarding(player, command);
                break;
            case "?stat":
                AwardingCmds.SettingGameStats(player, command);
                break;
            case "?cd":
                kitty.Unit.ResetCooldowns();
                break;
            case "?time":
                AwardingCmds.SettingGameTimes(player, command);
                break;
            case "?invul":
                UnitWithinRange.DeRegisterUnitWithinRangeUnit(kitty.Unit);
                break;
            case "?vul":
                CollisionDetection.KittyRegisterCollisions(kitty);
                break;
            case "?slide":
                Slider slider = new Slider(kitty.Unit);
                slider.StartSlider();
                break;
            case "?test2":
                break;
            case "?pw":
            case "?pause":
                Wolf.PauseAllWolves(true);
                break;
            case "?uw":
            case "?unpause":
                Wolf.PauseAllWolves(false);
                break;
            case "?noslide":
                break;
            case "?tm":
                //kitty.SaveData.GameTimes.NormalGameTime.TeamMembers.Add(player.Name);
                break;
            case "?discord":
                DiscordFrame.Initialize();
                break;
            case "?load":
                Globals.SaveSystem.Load(player);
                break;
            case "?summonall":
                foreach (var k in Globals.ALL_KITTIES.Values)
                {
                    if (k.Unit.Owner == player)
                        continue;
                    k.Unit.SetPosition(kitty.Unit.X, kitty.Unit.Y);
                }
                break;
            default:
                player.DisplayTimedTextTo(10.0f, $"{Colors.COLOR_YELLOW_ORANGE}Unknown command.");
                break;
        }
    }
}
