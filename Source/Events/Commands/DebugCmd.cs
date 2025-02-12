using System;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class DebugCmd
{
    public static void Handle(player player, string command)
    {
        var cmd = command.Split(" ");
        var kitty = Globals.ALL_KITTIES.ContainsKey(player) ? Globals.ALL_KITTIES[player] : null;
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
            case "?cd":
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
            case "?time":
                AwardingCmds.SettingGameTimes(player, command);
                break;
            case "?kick":
                var name = cmd.Length > 1 ? cmd[1] : "??__";
                foreach (var p in Globals.ALL_PLAYERS)
                    if (p.Name.ToLower().StartsWith(name))
                    {
                        p.Remove(playergameresult.Defeat);
                        break;
                    }
                break;
            case "?invul":
                var setting = cmd.Length > 1 ? cmd[1] : "off";
                if (setting == "on") UnitWithinRange.DeRegisterUnitWithinRangeUnit(kitty.Unit);
                else if (setting == "off") CollisionDetection.KittyRegisterCollisions(kitty);
                break;
            case "?slide":
                Slider slider = new Slider(kitty.Unit);
                slider.StartSlider();
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
            case "?spawnloc":
                var spawnCenter = RegionList.SpawnRegions[1];
                foreach(var ko in Globals.ALL_KITTIES)
                    ko.Value.Unit.SetPosition(spawnCenter.Center.X, spawnCenter.Center.Y);
                break;
            case "?roundpause":
            case "?rp":
                RoundTimer.StartRoundTimer.Pause();
                break;
            case "?roundunpause":
            case "?rup":
                RoundTimer.StartRoundTimer.Resume();
                break;
            case "?affixall":
            case "?aa":
                var nameAffix = cmd.Length > 1 ? char.ToUpper(cmd[1][0]) + cmd[1].Substring(1).ToLower() : "Speedster";
                Console.WriteLine($"Applying {nameAffix} to all wolves.");
                foreach (var wolf in Globals.ALL_WOLVES.Values)
                {
                    var affix = AffixFactory.CreateAffix(wolf, nameAffix);
                    wolf.AddAffix(affix);
                }
                break;
            case "?affix":
                var affixName = cmd.Length > 1 ? char.ToUpper(cmd[1][0]) + cmd[1].Substring(1).ToLower() : "Speedster";
                if (!Globals.ALL_WOLVES.ContainsKey(selectedUnit)) return;
                var affixX = AffixFactory.CreateAffix(Globals.ALL_WOLVES[selectedUnit], affixName);
                Globals.ALL_WOLVES[selectedUnit].AddAffix(affixX);
                break;
            case "?removeaffix":
            case "?ra":
                if (!Globals.ALL_WOLVES.ContainsKey(selectedUnit)) return;
                var affixToRemove = cmd.Length > 1 ? char.ToUpper(cmd[1][0]) + cmd[1].Substring(1).ToLower() : "";
                if (affixToRemove == "") return;
                if (!Globals.ALL_WOLVES[selectedUnit].HasAffix(affixToRemove)) return;
                Globals.ALL_WOLVES[selectedUnit].RemoveAffix(affixToRemove);
                break;
            case "?clearaffixes":
            case "?ca":
                foreach (var wolf in Globals.ALL_WOLVES.Values)
                    wolf.RemoveAllWolfAffixes();
                break;
            case "?obs":
                var obsName = cmd.Length > 1 ? cmd[1] : "??__";
                foreach (var p in Globals.ALL_PLAYERS)
                    if (p.Name.ToLower().StartsWith(obsName))
                    {
                        Utility.MakePlayerSpectator(p);
                        break;
                    }
                break;
            case "?summonall":
                foreach (var k in Globals.ALL_KITTIES.Values)
                {
                    if (k.Unit.Owner == player)
                        continue;
                    k.Unit.SetPosition(kitty.Unit.X, kitty.Unit.Y);
                }
                break;
            case "?camfield":
                var value = cmd.Length > 1 ? float.Parse(cmd[1]) : 0.0f;
                if (!player.IsLocal) return;
                SetCameraField(CAMERA_FIELD_ANGLE_OF_ATTACK, value, 0);
                break;
            case "?roundset":
                var round = cmd.Length > 1 ? int.Parse(cmd[1]) : 1;
                if (round < 1 || round > 5) return;
                Globals.ROUND = round - 1;
                RoundManager.RoundEnd();
                break;
            case "?noend":
                var endValue = cmd.Length > 1 ? cmd[1] : "off";
                if (endValue == "on") Gameover.NoEnd = true;
                else if (endValue == "off") Gameover.NoEnd = false;
                player.DisplayTimedTextTo(1.0f, $"{Colors.COLOR_YELLOW}Game will {(endValue == "on" ? "no longer" : "")} end");
                break;
            case "?help":
                DisplayAdminCommands(player);
                break;
            case "?allsave":
                SaveManager.SaveAllDataToFile();
                break;
            case "?testx":
                for(int i = 0; i < 800; i++)
                {
                    var x = kitty.Unit.X;
                }
                Console.WriteLine("Done:");
                break;
            default:
                player.DisplayTimedTextTo(10.0f, $"{Colors.COLOR_YELLOW_ORANGE}Unknown command.");
                break;
        }
    }

    public static void DisplayAdminCommands(player p = null)
    {
        if (p == null) return;

        string[] commandList = new string[]
        {
            "?ab - Activates the barrier",
            "?db - Deactivates the barrier",
            "?endround - Ends the current round",
            "?gold [amount] - Gives gold to whichever player you currently have selected.",
            "?level [level] - Sets the level of the unit you currently have selected.",
            "?diff [difficulty] - (normal, hard, impossible)",
            "?rpos - Revives yourself.",
            "?rposall - Revives all players.",
            "?share - Forces everyone to share control with you.",
            "?wshare - Gives you control of all the wolves.",
            "?cooldown || ?cd - Resets the cooldowns of currently selected unit.",
            "?christmas - Activates the Christmas terrain.",
            "?noseason - Deactivates any current seasons.",
            "?col - Displays the current collision value.",
            "?award - Award currently selected player using award [name], do ?award help for more info.",
            "?stat - Sets the specified game stat for the selected player. Use ?stat help to see all valid game stats.",
            "?time - Sets the specified game time for the selected player. Use ?time help to see all valid game times.",
            "?invul [on/off] - Gives invulerability, cannot save others however.",
            "?pause || ?pause - Pauses all wolves.",
            "?uw || ?unpause - Unpauses all wolves.",
            "?spawnloc - Moves all kitties to the spawn location.",
            "?roundpause || ?rp - Pauses the round timer.",
            "?roundunpause || ?rup - Unpauses the round timer.",
            "?affixall || ?aa - Applies the specified affix to all wolves. (fixation, chaos, blitzer, speedster, frostbite, howler, unpredictable)",
            "?affix || ?a - Applies the specified affix to the currently selected wolf. (fixation, chaos, blitzer, speedster, frostbite, howler, unpredictable)",
            "?clearaffixes || ?ca - Clears all affixes from all wolves.",
            "?obs || ?observer [playerNameMatch] ex; ?obs Omni - Forces Omniology into obs mode.",
            "?summonall - Summons all players to your location.",
            "?camfield [value] - Adjusts the camera field. (default 0.0f)",
            "?roundset [round] - Sets the current round. (1-5)",
            "?noend [on/off] - Game won't end if turned on and all kitties die. (default off)",
            "?removeaffix || ?ra - Removes the specified affix from the currently selected wolf. (fixation, chaos, blitzer, speedster, frostbite, howler, unpredictable)",
        };

        p.DisplayTimedTextTo(15.0f, Colors.COLOR_TURQUOISE + "Available Commands:\n");
        p.DisplayTimedTextTo(15.0f, Colors.COLOR_YELLOW + commandList[0]);
        var currentIndex = 1;
        var t = timer.Create();
        t.Start(0.5f, true, () =>
        {
            if (currentIndex >= commandList.Length)
            {
                t.Pause();
                t.Dispose();
                return;
            }

            p.DisplayTimedTextTo(15.0f, Colors.COLOR_YELLOW + commandList[currentIndex]);
            currentIndex++;
        });
    }
}
