using System;
using System.Diagnostics;
using System.Linq;
using System.Reflection.Metadata.Ecma335;
using System.Text;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class InitCommands
{
    public static dynamic _G;

    public static void InitializeCommands()
    {
        CommandsManager.RegisterCommand(
            name: "help",
            alias: "commands,?",
            tier: CommandTier.All,
            argDesc: "[topic]",
            description: "Displays all available commands for the passed parameter topic.",
            action: (player, args) =>
            {
                CommandsManager.HelpCommands(player, args?.FirstOrDefault());
            }
        );

        CommandsManager.RegisterCommand(
            name: "memtest",
            alias: "[none]",
            tier: CommandTier.Developer,
            argDesc: "[on][off]",
            description: "Memory Handler Periodic Message",
            action: (player, args) =>
            {
                MemoryHandlerTest.PeriodicTest(CommandsManager.GetBool(args[0]));
            }
        );

        CommandsManager.RegisterCommand(
            name: "save",
            alias: "",
            tier: CommandTier.All,
            argDesc: "[none]",
            description: "Save your current game stats.",
            action: (player, args) =>
            {
                TournamentSaver.Instance.SaveTournamentData();
                Globals.SaveSystem.Save(player);
            } 
        );

        CommandsManager.RegisterCommand(
            name: "saveall",
            alias: "",
            tier: CommandTier.Developer,
            argDesc: "[none]",
            description: "Saves to alldata file, mock data purposes only",
            action: (player, args) =>
            {
                Globals.SaveSystem.SaveAllDataToFile(player);
            }
        );

        CommandsManager.RegisterCommand(
            name: "victoryarea",
            alias: "va",
            tier: CommandTier.Admin,
            argDesc: "bool",
            description: "Disables or enables victory area according to passed parm or flips it.",
            action: (player, args) =>
            {
                if (args[0] == "")
                {
                    VictoryZone.VictoryAreaActive = !VictoryZone.VictoryAreaActive;
                    return;
                }

                var status = CommandsManager.GetBool(args[0]);
                VictoryZone.VictoryAreaActive = status;
                player.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_GOLD}Victory Area: {(status ? "On" : "Off")}{Colors.COLOR_RESET}");
            }
        );

        CommandsManager.RegisterCommand(
            name: "wolfeffects",
            alias: "we,wolfe",
            tier: CommandTier.Admin,
            argDesc: "[true][false]",
            description: "Disables the wolves overhead ! effects",
            action: (player, args) => Wolf.DisableEffects = CommandsManager.GetBool(args[0])
        );

        CommandsManager.RegisterCommand(
            name: "clear",
            alias: "clear,clr,c",
            tier: CommandTier.All,
            argDesc: "[none]",
            description: "Clears your screen.",
            action: (player, args) => Utility.ClearScreen(player)
        );

        CommandsManager.RegisterCommand(
            name: "gold",
            alias: "g",
            tier: CommandTier.Admin,
            argDesc: "[amount][resolvePlayerId]",
            description: "Gives an [amount] of gold to the [resolvePlayerId]s",
            action: (player, args) =>
            {
                if (args[0] == "")
                {
                    player.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_YELLOW_ORANGE}Invalid arguments. Usage: gold [amount] [resolvePlayerId]|r");
                    return;
                }

                var amount = int.Parse(args[0]);

                if (args.Length < 2)
                {
                    player.Gold += amount;
                    return;
                }

                CommandsManager.ResolvePlayerId(args[1], kitty =>
                    {
                        kitty.Player.Gold += amount;
                    });

            }
        );

        CommandsManager.RegisterCommand(
            name: "colors",
            alias: "",
            tier: CommandTier.All,
            argDesc: "[none]",
            description: "Display all available colors.",
            action: (player, args) => Colors.ListColorCommands(player)
        );

        CommandsManager.RegisterCommand(
            name: "color",
            alias: "",
            tier: CommandTier.All,
            argDesc: "[color]",
            description: "Sets the color of your kitty to the passed color parameter.",
            action: (player, args) => Colors.SetPlayerColor(player, args?[0])
        );

        CommandsManager.RegisterCommand(
            name: "kick",
            alias: "k",
            tier: CommandTier.All,
            argDesc: "[playerNumber]",
            description: "Initiate a votekick against a player.",
            action: (player, args) =>
            {

                if (Globals.ADMIN_LIST.Contains(player))
                {
                    CommandsManager.ResolvePlayerId(args[0], kitty =>
                    {
                        if (Globals.ALL_KITTIES[player].CommandTier <= kitty.CommandTier) return;
                        PlayerLeaves.PlayerLeavesActions(kitty.Player);
                        Blizzard.CustomDefeatBJ(kitty.Player, $"{Colors.COLOR_RED}You have been kicked from the game!{Colors.COLOR_RESET}");
                    });
                }
                else
                    Votekick.InitiateVotekick(player, args?[0]);
            }
        );

        CommandsManager.RegisterCommand(
            name: "voteend",
            alias: "ve",
            tier: CommandTier.All,
            argDesc: "[none]",
            description: "Initiate a vote to end the round (Solo Tournament Only).",
            action: (player, args) => VoteEndRound.InitiateVote(player)
        );

        CommandsManager.RegisterCommand(
            name: "yes",
            alias: "y",
            tier: CommandTier.All,
            argDesc: "[none]",
            description: "Vote yes for the current vote.",
            action: (player, args) =>
            {
                Votekick.IncrementTally();
                VoteEndRound.IncrementVote(player);
            }
        );

        CommandsManager.RegisterCommand(
            name: "affixinfo",
            alias: "ainfo",
            tier: CommandTier.All,
            argDesc: "[lane #] (1-17)",
            description: "Displays current round affixes or affixes for a specific lane.",
            action: (player, args) =>
            {
                string[] affixes;
                int laneIndex;
                if (args[0] != "")
                {
                    laneIndex = int.Parse(args[0]);
                    if (laneIndex <= 0 || laneIndex > 17) return;
                    affixes = AffixFactory.CalculateAffixes(laneIndex - 1);
                }
                else
                {
                    affixes = AffixFactory.CalculateAffixes();
                }
                player.DisplayTextTo(Colors.COLOR_GOLD + "Current Affixes:\n" + string.Join("\n", affixes) + $"\n{Colors.COLOR_LAVENDER}All Lanes Count: {AffixFactory.AllAffixes.Count}");
            }
        );

        CommandsManager.RegisterCommand(
            name: "wolfinfo",
            alias: "lnbm",
            tier: CommandTier.All,
            argDesc: "[lane #] (1-17)",
            description: "Displays the total wolf count or the wolf count for a specific lane.",
            action: (player, args) =>
            {
                int laneIndex;
                int nbWolves;
                if (args[0] != "")
                {
                    laneIndex = int.Parse(args[0]);
                    if (laneIndex <= 0 || laneIndex > 17) return;
                    nbWolves = WolfArea.WolfAreas[laneIndex - 1].Wolves.Count;
                    player.DisplayTextTo(Colors.COLOR_GOLD + $"Current Wolf Count for Lane {Colors.COLOR_YELLOW}{laneIndex}: {nbWolves}{Colors.COLOR_RESET}");
                    return;
                }
                else nbWolves = Globals.ALL_WOLVES.Count;
                player.DisplayTextTo(Colors.COLOR_GOLD + $"Current Wolf Count: {Colors.COLOR_YELLOW}{nbWolves}{Colors.COLOR_RESET}");
            }
        );

        CommandsManager.RegisterCommand(
            name: "setcolor",
            alias: "sc,vc",
            tier: CommandTier.All,
            argDesc: "[rgb]",
            description: "Set your kitty vertex color to the passed red-green-blue values. (-sc 112, 52, 92)",
            action: (player, args) => Colors.SetPlayerVertexColor(player, args)
        );

        CommandsManager.RegisterCommand(
            name: "wild",
            alias: "",
            tier: CommandTier.All,
            argDesc: "[none]",
            description: "Set your kitty to a random vertex color.",
            action: (player, args) => Colors.SetPlayerRandomVertexColor(player)
        );

        CommandsManager.RegisterCommand(
            name: "names",
            alias: "n",
            tier: CommandTier.All,
            argDesc: "[none]",
            description: "Hides all floating name tags.",
            action: (player, args) => FloatingNameTag.ShowAllNameTags(player, CommandsManager.GetBool(args[0]))
        );

        CommandsManager.RegisterCommand(
            name: "zoom",
            alias: "cam",
            tier: CommandTier.All,
            argDesc: "[xxxx]",
            description: "Adjust the camera zoom level to the passed parameter.",
            action: (player, args) => CameraUtil.HandleZoomCommand(player, args)
        );

        CommandsManager.RegisterCommand(
            name: "lockcamera",
            alias: "lc,spectate",
            tier: CommandTier.All,
            argDesc: "[none]",
            description: "Locks your camera to your unit. Can also do ctrl + C.",
            action: (player, args) =>
            {
                if (args[0] == "")
                {
                    CameraUtil.LockCamera(player);
                    return;
                }
            }
        );

        CommandsManager.RegisterCommand(
            name: "firstperson",
            alias: "fpc,firstpersoncamera",
            tier: CommandTier.All,
            argDesc: "[none]",
            description: "Toggle first person camera.",
            action: (player, args) => FirstPersonCameraManager.ToggleFirstPerson(player)
        );

        CommandsManager.RegisterCommand(
            name: "reset",
            alias: "",
            tier: CommandTier.All,
            argDesc: "[none]",
            description: "Resets your camera to their default settings.",
            action: (player, args) =>
            {
                CameraUtil.UnlockCamera(player);
                FrameManager.InitalizeButtons();
            }
        );

        CommandsManager.RegisterCommand(
            name: "kc",
            alias: "",
            tier: CommandTier.All,
            argDesc: "[none]",
            description: "Kicks yourself from the game.",
            action: (player, args) =>
            {
                PlayerLeaves.PlayerLeavesActions(player);
                Blizzard.CustomDefeatBJ(player, $"{Colors.COLOR_RED}You kicked yourself!{Colors.COLOR_RESET}");
            }
        );

        CommandsManager.RegisterCommand(
            name: "apm",
            alias: "",
            tier: CommandTier.All,
            argDesc: "[none]",
            description: "Displays your APM for ACTIVE game time. (not counting intermissions)",
            action: (player, args) => player.DisplayTimedTextTo(10.0f, APMTracker.CalculateAllAPM())
        );

        CommandsManager.RegisterCommand(
            name: "kibble",
            alias: "",
            tier: CommandTier.All,
            argDesc: "[none]",
            description: "Displays the kibble collected by each player.",
            action: (player, args) =>
            {
                var kibbleList = "";
                for (int i = 0; i < Globals.ALL_KITTIES_LIST.Count; i++)
                {
                    var kitty = Globals.ALL_KITTIES_LIST[i];
                    var kibbleCollected = kitty.CurrentStats.CollectedKibble;
                    kibbleList += $"{Colors.PlayerNameColored(kitty.Player)}: {kibbleCollected}\n";
                }
                player.DisplayTimedTextTo(7.0f, $"{Colors.COLOR_GOLD}Kibble Collected:\n{kibbleList}{Colors.COLOR_RESET}");
            }
        );

        CommandsManager.RegisterCommand(
            name: "watcher",
            alias: "watching",
            tier: CommandTier.All,
            argDesc: "[none]",
            description: "Removes all units from game and you become an observer/spectator.",
            action: (player, args) => Utility.MakePlayerSpectator(player)
        );

        CommandsManager.RegisterCommand(
            name: "overheadcam",
            alias: "overhead,topdown,ohc",
            tier: CommandTier.All,
            argDesc: "[none]",
            description: "Gives an overhead view.",
            action: (player, args) => CameraUtil.OverheadCamera(player, 280f)
        );

        CommandsManager.RegisterCommand(
            name: "komotocam",
            alias: "",
            tier: CommandTier.All,
            argDesc: "[none]",
            description: "Toggle KomotoCam.",
            action: (player, args) => CameraUtil.ToggleKomotoCam(player)
        );

        CommandsManager.RegisterCommand(
            name: "glow",
            alias: "",
            tier: CommandTier.All,
            argDesc: "[true/false]",
            description: "Toggle unit glow.",
            action: (player, args) =>
            {
                BlzShowUnitTeamGlow(Globals.ALL_KITTIES[player].Unit, CommandsManager.GetBool(args[0]));
            }
        );

        CommandsManager.RegisterCommand(
            name: "mirror",
            alias: "reverse",
            tier: CommandTier.All,
            argDesc: "",
            description: "Toggle mirror mode.",
            action: (player, args) =>
            {
                if (Globals.ALL_KITTIES[player].Slider.IsOnSlideTerrain())
                {
                    player.DisplayTextTo(Colors.COLOR_YELLOW_ORANGE + "You can't toggle mirror mode while sliding!");
                    return;
                }
                Globals.ALL_KITTIES[player].ToggleMirror();
                player.DisplayTextTo(Colors.COLOR_GOLD + "Mirror: " + (Globals.ALL_KITTIES[player].IsMirror ? "On" : "Off"));
            }
        );

        CommandsManager.RegisterCommand(
            name: "disco",
            alias: "",
            tier: CommandTier.All,
            argDesc: "[on][off]",
            description: "Toggle disco mode.",
            action: (player, args) =>
            {

                if (args[0] == "")
                {
                    player.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_YELLOW_ORANGE}Invalid arguments. Usage: disco [on/off]|r");
                    return;
                }

                var status = CommandsManager.GetBool(args[0]);
                if (CommandsManager.GetPlayerTier(player) >= CommandTier.Admin && args.Length > 1)
                {
                    if (args[1] == "wolves" || args[1] == "wolf")
                    {
                        foreach (var wolf in Globals.ALL_WOLVES)
                        {
                            wolf.Value.Disco ??= ObjectPool<Disco>.GetEmptyObject();
                            wolf.Value.Disco.Unit = wolf.Value.Unit;
                            wolf.Value.Disco.ToggleDisco(status);
                            if (!status)
                            {
                                wolf.Value.Disco = null;
                                wolf.Value.Unit.SetVertexColor(150, 120, 255, 255);
                            }
                        }
                    }
                    else
                    {
                        CommandsManager.ResolvePlayerId(args[1], kitty =>
                        {
                            kitty.Disco.ToggleDisco(status);
                        });
                    }
                }
                else
                {
                    var playerKitty = Globals.ALL_KITTIES[player];
                    playerKitty.Disco.ToggleDisco(status);
                }

                player.DisplayTextTo(Colors.COLOR_GOLD + "Disco: " + (status ? "On" : "Off"));
            }
        );

        CommandsManager.RegisterCommand(
            name: "animate",
            alias: "animation,an",
            tier: CommandTier.All,
            argDesc: "[index]",
            description: "Set unit animation by index.",
            action: (player, args) => SetUnitAnimationByIndex(Globals.ALL_KITTIES[player].Unit, int.Parse(args[0]))
        );

        CommandsManager.RegisterCommand(
            name: "spincam",
            alias: "",
            tier: CommandTier.All,
            argDesc: "[speed]",
            description: "Toggle SpinCam.",
            action: (player, args) =>
            {
                float speed = args[0] != "" ? float.Parse(args[0]) : 0;
                Globals.ALL_KITTIES[player].SpinCam.ToggleSpinCam(speed);
                player.DisplayTextTo(Colors.COLOR_GOLD + "SpinCam: " + (Globals.ALL_KITTIES[player].SpinCam.IsSpinCamActive() ? "On" : "Off"));
            }
        );

        CommandsManager.RegisterCommand(
            name: "activatebarrier",
            alias: "ab",
            tier: CommandTier.Admin,
            argDesc: "",
            description: "Activates the barrier.",
            action: (player, args) => BarrierSetup.ActivateBarrier()
        );

        CommandsManager.RegisterCommand(
            name: "rtr",
            alias: "",
            tier: CommandTier.All,
            argDesc: "[on/off] [player]",
            description: "Set RTR mode on/off.",
            action: (player, args) =>
            {
                if (args[0] == "")
                {
                    player.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_YELLOW_ORANGE}Invalid arguments. Usage: rtr [on/off] [player]|r");
                    return;
                }

                bool mode = CommandsManager.GetBool(args[0]);

                if (args.Length < 2 || args[1] == "")
                {
                    // Apply to self
                    if (mode)
                    {
                        Globals.ALL_KITTIES[player].RTR.StartRTR();
                        player.DisplayTextTo(Colors.COLOR_GOLD + "RTR: On");
                    }
                    else
                    {
                        Globals.ALL_KITTIES[player].RTR.StopRTR();
                        player.DisplayTextTo(Colors.COLOR_GOLD + "RTR: Off");
                    }
                    return;
                }

                bool isMatch = false;

                CommandsManager.ResolvePlayerId(args[1], kitty =>
                {
                    if (kitty == null) return;
                    isMatch = true;

                    if (mode)
                    {
                        kitty.RTR.StartRTR();
                    }
                    else
                    {
                        kitty.RTR.StopRTR();
                    }
                });

                if (isMatch)
                {
                    player.DisplayTextTo(Colors.COLOR_GOLD + $"RTR set to {(mode ? "On" : "Off")} for target player");
                }
            }
        );

        CommandsManager.RegisterCommand(
            name: "deactivatebarrier",
            alias: "db",
            tier: CommandTier.Admin,
            argDesc: "",
            description: "Deactivates the barrier.",
            action: (player, args) => BarrierSetup.DeactivateBarrier()
        );

        CommandsManager.RegisterCommand(
            name: "endround",
            alias: "er",
            tier: CommandTier.Admin,
            argDesc: "",
            description: "Ends the current round.",
            action: (player, args) => RoundManager.RoundEnd()
        );

        CommandsManager.RegisterCommand(
            name: "level",
            alias: "lvl",
            tier: CommandTier.Admin,
            argDesc: "[level][resolvePlayerId]",
            description: "Sets the passed player paramter",
            action: (player, args) =>
            {
                if (args.Length < 2)
                {
                    var kitty = Globals.ALL_KITTIES[player];
                    Blizzard.SetHeroLevelBJ(kitty.Unit, int.Parse(args[0]), true);
                    return;
                }
                CommandsManager.ResolvePlayerId(args[1], kitty =>
                {
                    Blizzard.SetHeroLevelBJ(kitty.Unit, int.Parse(args[0]), true);
                });
            }
        );

        CommandsManager.RegisterCommand(
            name: "blink",
            alias: "tele",
            tier: CommandTier.Admin,
            argDesc: "[none]",
            description: "Adds a blink item to the kitty.",
            action: (player, args) =>
            {
                var kitty = Globals.ALL_KITTIES[player];
                kitty.Unit.AddItem(FourCC("desc"));
            }
        );

        CommandsManager.RegisterCommand(
            name: "difficulty",
            alias: "diff",
            tier: CommandTier.Admin,
            argDesc: "[difficulty]",
            description: "Changes the game difficulty.",
            action: (player, args) =>
            {
                var difficulty = args[0] != "" ? args[0] : "normal";
                Difficulty.ChangeDifficulty(difficulty);
                AffixFactory.DistAffixes();
                MultiboardUtil.RefreshMultiboards();
                NitroChallenges.SetNitroRoundTimes();
            }
        );

        CommandsManager.RegisterCommand(
            name: "monsterdb",
            alias: "mdb",
            tier: CommandTier.VIP,
            argDesc: "[monster name]",
            description: "Finds any monsters ingame that are simliar to the passed name, giving unitID.",
            action: (player, args) =>
            {
                var search = args[0].ToLower();
                var foundMonsters = UnitData.Monsters.Where(m => m.Name.ToLower().Contains(search)).ToList(); // IEnumberable + ToList memory usage. 
                if (foundMonsters.Count == 0)
                {
                    player.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_YELLOW_ORANGE}No monsters found with name containing '{search}'|r");
                    return;
                }
                var message = $"{Colors.COLOR_GOLD}Monsters found with name containing '{search}':\n";
                foreach (var monster in foundMonsters)
                {
                    message += $"{Colors.COLOR_LAVENDER}{monster.Name} - UnitID: {monster.Id}\n";
                }
                player.DisplayTimedTextTo(10.0f, message);
            }
        );

        CommandsManager.RegisterCommand(
            name: "revive",
            alias: "rpos",
            tier: CommandTier.Admin,
            argDesc: "[none]",
            description: "Revives yourself.",
            action: (player, args) => CommandsManager.ResolvePlayerId(args[0], kitty => kitty.ReviveKitty())
        );

        CommandsManager.RegisterCommand(
            name: "reviveto",
            alias: "rto,rposto",
            tier: CommandTier.Admin,
            argDesc: "[resolvePlayerId]",
            description: "Revives your hero to another hero, with the same facing angle.",
            action: (player, args) =>
            {
                if (args.Length == 1)
                {
                    CommandsManager.ResolvePlayerId(args[0], kitty =>
                    {
                        Globals.ALL_KITTIES[player].ReviveKitty();
                        Globals.ALL_KITTIES[player].Unit.SetPosition(kitty.Unit.X, kitty.Unit.Y);
                        Globals.ALL_KITTIES[player].Unit.SetFacing(kitty.Unit.Facing);
                    });
                }
                else if (args.Length == 2)
                {
                    CommandsManager.ResolvePlayerId(args[1], kitty =>
                    {
                        CommandsManager.ResolvePlayerId(args[0], kitty2 =>
                        {
                            kitty.ReviveKitty();
                            kitty.Unit.SetPosition(kitty2.Unit.X, kitty2.Unit.Y);
                            kitty.Unit.SetFacing(kitty2.Unit.Facing);
                        });
                    });
                }
            }
        );

        CommandsManager.RegisterCommand(
            name: "summon",
            alias: "smn",
            tier: CommandTier.Admin,
            argDesc: "[resolvePlayerId]",
            description: "Revives another hero to yours, with the same facing angle.",
            action: (player, args) =>
            {
                CommandsManager.ResolvePlayerId(args[0], kitty =>
                {
                    kitty.ReviveKitty();
                    kitty.Unit.SetPosition(Globals.ALL_KITTIES[player].Unit.X, Globals.ALL_KITTIES[player].Unit.Y);
                    kitty.Unit.SetFacing(Globals.ALL_KITTIES[player].Unit.Facing);
                });
            }
        );

        CommandsManager.RegisterCommand(
            name: "sharecontrol",
            alias: "share",
            tier: CommandTier.Admin,
            argDesc: "[resolvePlayerId] [on/off]",
            description: "Sets whether or not to force the player to share control [default: off]",
            action: (player, args) =>
            {
                if (args.Length < 2)
                {
                    player.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_YELLOW_ORANGE}Invalid arguments. Usage: sharecontrol [player] [on/off]{Colors.COLOR_RESET}");
                    return;
                }
                var status = CommandsManager.GetBool(args[1]);
                CommandsManager.ResolvePlayerId(args[0], kitty =>
                {
                    kitty.Player.SetAlliance(player, ALLIANCE_SHARED_CONTROL, status);
                });
            }
        );

        CommandsManager.RegisterCommand(
            name: "shareforcecontrol",
            alias: "shareforce, sf",
            tier: CommandTier.Admin,
            argDesc: "[sharingPlayer] [sharedWithPlayer] [on/off]",
            description: "Sets whether or not to force the player to share control [default: off]",
            action: (player, args) =>
            {
                if (args.Length < 3)
                {
                    player.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_YELLOW_ORANGE}Invalid arguments. Usage: shareforce [player] [player] [on/off]{Colors.COLOR_RESET}");
                    return;
                }
                var status = CommandsManager.GetBool(args[2]);
                CommandsManager.ResolvePlayerId(args[0], kitty =>
                {
                    CommandsManager.ResolvePlayerId(args[1], kitty2 =>
                    {
                        kitty.Player.SetAlliance(kitty2.Player, ALLIANCE_SHARED_CONTROL, status);
                    });
                });
            }
        );

        CommandsManager.RegisterCommand(
            name: "wolfshare",
            alias: "wshare",
            tier: CommandTier.Admin,
            argDesc: "[on][off]",
            description: "Gives you control of all the wolves.",
            action: (player, args) =>
            {
                var status = CommandsManager.GetBool(args[0]);
                player.NeutralAggressive.SetAlliance(player, ALLIANCE_SHARED_CONTROL, status);
                player.NeutralExtra.SetAlliance(player, ALLIANCE_SHARED_CONTROL, status);
                player.NeutralPassive.SetAlliance(player, ALLIANCE_SHARED_CONTROL, status);
                player.NeutralVictim.SetAlliance(player, ALLIANCE_SHARED_CONTROL, status);

                for (var i = 0; i < 24; i++)
                {
                    var p = Player(i);
                    if (p.SlotState != playerslotstate.Playing)
                    {
                        p.SetAlliance(player, ALLIANCE_SHARED_CONTROL, status);
                    }
                }
            }
        );

        CommandsManager.RegisterCommand(
            name: "resetcooldowns",
            alias: "cooldown,cd",
            tier: CommandTier.Admin,
            argDesc: "[resolvePlayerId]",
            description: "Resets the cooldowns of the selected unit.",
            action: (player, args) =>
            {                
                CommandsManager.ResolvePlayerId(args[0], kitty =>
                {
                    kitty.Unit.ResetCooldowns();
                });
            }
        );

        CommandsManager.RegisterCommand(
            name: "activatechristmas",
            alias: "christmas",
            tier: CommandTier.VIP,
            argDesc: "[none]",
            description: "Activates the Christmas terrain.",
            action: (player, args) => SeasonalManager.ActivateChristmas()
        );

        CommandsManager.RegisterCommand(
            name: "deactivateseason",
            alias: "noseason",
            tier: CommandTier.VIP,
            argDesc: "[none]",
            description: "Deactivates any current seasons.",
            action: (player, args) => SeasonalManager.NoSeason()
        );

        CommandsManager.RegisterCommand(
            name: "award",
            alias: "",
            tier: CommandTier.Admin,
            argDesc: "[name] [player?]",
            description: "Awards the resolved player (or yourself) with the given award. Use award help to see valid awards.",
            action: (player, args) => AwardingCmds.Awarding(player, args)
        );

        CommandsManager.RegisterCommand(
            name: "stat",
            alias: "",
            tier: CommandTier.Admin,
            argDesc: "[stat] [value] [player?]",
            description: "Sets the specified game stat for the resolved player.",
            action: (player, args) => AwardingCmds.SettingGameStats(player, args)
        );

        CommandsManager.RegisterCommand(
            name: "time",
            alias: "",
            tier: CommandTier.Admin,
            argDesc: "[time] [value] [player?]",
            description: "Sets the specified game time for the resolved player.",
            action: (player, args) => AwardingCmds.SettingGameTimes(player, args)
        );

        CommandsManager.RegisterCommand(
            name: "invulnerability",
            alias: "invul,godmode,god",
            tier: CommandTier.Admin,
            argDesc: "[resolvePlayerId][on/off]",
            description: "Gives invulnerability.",
            action: (player, args) =>
            {
                if (args.Length < 2)
                {
                    var setting = CommandsManager.GetBool(args[0]);
                    var kitty = Globals.ALL_KITTIES[player].Invulnerable = setting;
                    player.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_GOLD}Invulnerability: {setting}|r");
                }
                else if (args.Length == 2)
                {
                    CommandsManager.ResolvePlayerId(args[0], kitty =>
                    {
                        var setting = CommandsManager.GetBool(args[1]);
                        kitty.Invulnerable = setting;
                        player.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_GOLD}Invulnerability for: {Colors.PlayerNameColored(kitty.Player)} : {setting}|r");
                    });
                }
            }
        );

        CommandsManager.RegisterCommand(
            name: "pausewolves",
            alias: "pw,pause",
            tier: CommandTier.Admin,
            argDesc: "[on][off]",
            description: "Pauses all wolves. Defaults to [on]",
            action: (player, args) =>
            {
                var status = args[0] == "" || CommandsManager.GetBool(args[0]);
                Wolf.PauseAllWolves(status);
            }
        );

        CommandsManager.RegisterCommand(
            name: "wolfpause",
            alias: "wp",
            tier: CommandTier.Admin,
            argDesc: "[on][off]",
            description: "Pauses selected wolf. Defaults to [on]",
            action: (player, args) =>
            {
                var status = args[0] == "" || CommandsManager.GetBool(args[0]);
                Wolf.PauseSelectedWolf(CustomStatFrame.SelectedUnit[player], status);
            }
        );

        CommandsManager.RegisterCommand(
            name: "wolfwalk",
            alias: "ww",
            tier: CommandTier.Developer,
            argDesc: "[on][off]",
            description: "Sets the selected wolf to walking or not. Defaults to [on]",
            action: (player, args) =>
            {
                var status = args[0] == "" || CommandsManager.GetBool(args[0]);
                var selected = CustomStatFrame.SelectedUnit[player];
                if (Globals.ALL_WOLVES.TryGetValue(selected, out var wolf))
                {
                    wolf.IsWalking = status;
                }
            }
        );

        CommandsManager.RegisterCommand(
            name: "spawnlocation",
            alias: "spawnloc",
            tier: CommandTier.Admin,
            argDesc: "[none]",
            description: "Moves all kitties to the spawn location.",
            action: (player, args) =>
            {
                var spawnCenter = RegionList.SpawnRegions[1];
                for (int i = 0; i < Globals.ALL_KITTIES_LIST.Count; i++)
                {
                    var kitty = Globals.ALL_KITTIES_LIST[i];
                    kitty.Unit.SetPosition(spawnCenter.Center.X, spawnCenter.Center.Y);
                }
            }
        );

        CommandsManager.RegisterCommand(
            name: "pauseround",
            alias: "roundpause,rp",
            tier: CommandTier.Admin,
            argDesc: "[none]",
            description: "Pauses the round timer.",
            action: (player, args) => RoundTimer.StartRoundTimer.Pause()
        );

        CommandsManager.RegisterCommand(
            name: "unpauseround",
            alias: "roundunpause,rup",
            tier: CommandTier.Admin,
            argDesc: "[none]",
            description: "Unpauses the round timer.",
            action: (player, args) => RoundTimer.StartRoundTimer.Resume()
        );

        CommandsManager.RegisterCommand(
            name: "en",
            alias: "hidelanes",
            tier: CommandTier.Admin,
            argDesc: "[none]",
            description: "Hides the lanes.",
            action: (player, args) => WolfLaneHider.LanesHider()
        );

        CommandsManager.RegisterCommand(
            name: "applyaffixall",
            alias: "affixall,aa",
            tier: CommandTier.Admin,
            argDesc: "[affix]",
            description: "Applies the specified affix to all wolves.",
            action: (player, args) =>
            {
                var affixName = args[0] != "" ? char.ToUpper(args[0][0]) + args[0].Substring(1).ToLower() : "Speedster";
                Console.WriteLine($"Applying {affixName} to all wolves.");
                foreach (var wolf in Globals.ALL_WOLVES_LIST)
                {
                    if (NamedWolves.DNTNamedWolves.Contains(wolf)) continue;
                    var affix = AffixFactory.CreateAffix(wolf, affixName);
                    wolf.AddAffix(affix);
                }
            }
        );

        CommandsManager.RegisterCommand(
            name: "removeaward",
            alias: "reaw",
            tier: CommandTier.Admin,
            argDesc: "[award name] [player?]",
            description: "Removes the specified award from the resolved player.",
            action: (player, args) => AwardingCmds.RemovingAward(player, args)
        );

        CommandsManager.RegisterCommand(
            name: "applyaffix",
            alias: "affix,a",
            tier: CommandTier.Admin,
            argDesc: "[affix]",
            description: "Applies the specified affix to the currently selected wolf.",
            action: (player, args) =>
            {
                var affixName = args[0] != "" ? char.ToUpper(args[0][0]) + args[0].Substring(1).ToLower() : "Speedster";
                var selectedUnit = CustomStatFrame.SelectedUnit[player];
                if (!Globals.ALL_WOLVES.ContainsKey(selectedUnit)) return;
                if (NamedWolves.DNTNamedWolves.Contains(Globals.ALL_WOLVES[selectedUnit])) return;
                var affix = AffixFactory.CreateAffix(Globals.ALL_WOLVES[selectedUnit], affixName);
                Globals.ALL_WOLVES[selectedUnit].AddAffix(affix);
            }
        );

        CommandsManager.RegisterCommand(
            name: "removeaffix",
            alias: "ra",
            tier: CommandTier.Admin,
            argDesc: "[affix]",
            description: "Removes the specified affix from the currently selected wolf.",
            action: (player, args) =>
            {
                var affixName = args[0] != "" ? char.ToUpper(args[0][0]) + args[0].Substring(1).ToLower() : "";
                var selectedUnit = CustomStatFrame.SelectedUnit[player];
                if (!Globals.ALL_WOLVES.ContainsKey(selectedUnit)) return;
                if (affixName == "") return;
                if (!Globals.ALL_WOLVES[selectedUnit].HasAffix(affixName)) return;
                Globals.ALL_WOLVES[selectedUnit].RemoveAffix(affixName);
            }
        );

        CommandsManager.RegisterCommand(
            name: "clearaffixes",
            alias: "ca",
            tier: CommandTier.Admin,
            argDesc: "[none]",
            description: "Clears all affixes from all wolves.",
            action: (player, args) =>
            {
                foreach (var wolf in Globals.ALL_WOLVES_LIST)
                {
                    wolf?.RemoveAllWolfAffixes();
                }
            }
        );

        CommandsManager.RegisterCommand(
            name: "observer",
            alias: "obs",
            tier: CommandTier.Admin,
            argDesc: "[resolvePlayerId]",
            description: "Forces a player into observer mode.",
            action: (player, args) =>
            {
                var name = args[0] != "" ? args[0] : "??__";
                CommandsManager.ResolvePlayerId(name, kitty =>
                {
                    if (kitty == null) return;
                    Utility.MakePlayerSpectator(kitty.Player);
                });
            }
        );

        CommandsManager.RegisterCommand(
            name: "camfield",
            alias: "",
            tier: CommandTier.Admin,
            argDesc: "[value]",
            description: "Adjusts the camera field.",
            action: (player, args) =>
            {
                var value = args[0] != "" ? float.Parse(args[0]) : 0.0f;
                if (!player.IsLocal) return;
                SetCameraField(CAMERA_FIELD_ANGLE_OF_ATTACK, value, 0);
            }
        );

        CommandsManager.RegisterCommand(
            name: "roundset",
            alias: "",
            tier: CommandTier.Admin,
            argDesc: "[round]",
            description: "Sets the current round.",
            action: (player, args) =>
            {
                var round = args[0] != "" ? int.Parse(args[0]) : 1;
                if (round < 1 || round > 5) return;
                Globals.ROUND = round - 1;
                RoundManager.RoundEnd();
            }
        );

        CommandsManager.RegisterCommand(
            name: "noend",
            alias: "",
            tier: CommandTier.Admin,
            argDesc: "[on/off]",
            description: "Game won't end if turned on and all kitties die.",
            action: (player, args) =>
            {
                var status = CommandsManager.GetBool(args[0]);
                Gameover.NoEnd = status;
                player.DisplayTimedTextTo(6.0f, $"{Colors.COLOR_YELLOW_ORANGE}Game will end: {!status}|r");
            }
        );

        CommandsManager.RegisterCommand(
            name: "ability",
            alias: "",
            tier: CommandTier.Admin,
            argDesc: "[abilityId]",
            description: "Adds or removes an ability from the kitty.",
            action: (player, args) =>
            {
                var abilityId = args[0] != "" ? args[0] : "";
                var kitty = Globals.ALL_KITTIES[player];
                if (GetUnitAbilityLevel(kitty.Unit, FourCC(abilityId)) > 0)
                {
                    UnitRemoveAbility(kitty.Unit, FourCC(abilityId));
                    var abilityName = GetObjectName(FourCC(abilityId)); // GetObjectName is async
                    player.DisplayTimedTextTo(10.0f, $"{Colors.COLOR_YELLOW_ORANGE}Removed {abilityName}.");
                }
                else
                {
                    UnitAddAbility(kitty.Unit, FourCC(abilityId));
                    var abilityName = GetObjectName(FourCC(abilityId)); // GetObjectName is async
                    player.DisplayTimedTextTo(10.0f, $"{Colors.COLOR_YELLOW_ORANGE}Added {abilityName}.");
                }
            }
        );

        CommandsManager.RegisterCommand(
            name: "scale",
            alias: "",
            tier: CommandTier.VIP,
            argDesc: "[scale], [resolvePlayerId]",
            description: "Sets the scale of the passed player's kitty parameter.",
            action: (player, args) =>
            {
                var scale = args[0] != "" ? float.Parse(args[0]) : 0.6f;

                if (args.Length < 2 || args[1] == "")
                {
                    Globals.ALL_KITTIES[player].Unit.SetScale(scale, scale, scale);
                    return;
                }

                CommandsManager.ResolvePlayerId(args[1], kitty =>
                {
                    if (kitty == null) return;
                    kitty.Unit.SetScale(scale, scale, scale);
                });
            }
        );

        CommandsManager.RegisterCommand(
            name: "day",
            alias: "",
            tier: CommandTier.Red,
            argDesc: "[none]",
            description: "Sets the time of day to day.",
            action: (player, args) =>
            {
                SetFloatGameState(GAME_STATE_TIME_OF_DAY, 12);
                SetTimeOfDayScale(0.0f);
            }
        );

        CommandsManager.RegisterCommand(
            name: "night",
            alias: "",
            tier: CommandTier.Red,
            argDesc: "[none]",
            description: "Sets the time of day to night.",
            action: (player, args) =>
            {
                SetFloatGameState(GAME_STATE_TIME_OF_DAY, 0.0f);
                SetTimeOfDayScale(0.0f);
            }
        );

        CommandsManager.RegisterCommand(
            name: "mem",
            alias: "",
            tier: CommandTier.Admin,
            argDesc: "[none]",
            description: "Prints debug names.",
            action: (player, args) =>
            {
                _G["trackPrintMap"] = true;
                DebugUtilities.DebugPrinter.PrintDebugNames("globals");
            }
        );

        CommandsManager.RegisterCommand(
            name: "aishare",
            alias: "",
            tier: CommandTier.Admin,
            argDesc: "[none]",
            description: "Shares control with all AI players.",
            action: (player, args) =>
            {
                foreach (var p in Globals.ALL_PLAYERS)
                {
                    if (p.SlotState != playerslotstate.Playing)
                    {
                        p.SetAlliance(player, ALLIANCE_SHARED_CONTROL, true);
                    }
                }
            }
        );

        CommandsManager.RegisterCommand(
            name: "exec",
            alias: "",
            tier: CommandTier.Admin,
            argDesc: "[none]",
            description: "Executes lua script",
            action: (player, args) =>
            {
                var script = args[0] != "" ? string.Join(" ", args) : "";
                if (string.IsNullOrEmpty(script)) return;
                ExecuteLua.LuaCode(player, script);
            }
        );

        CommandsManager.RegisterCommand(
            name: "createhero",
            alias: "crh",
            tier: CommandTier.Admin,
            argDesc: "[playerNumber]",
            description: "Creates a hero for the specified player.",
            action: (player, args) =>
            {
                for (var i = 0; i < 24; i++)
                {
                    int target = args.Length > 0 && args[0] != "all" ? int.Parse(args[0]) - 1 : (args.Length > 0 && args[0] == "all" ? i : -1);

                    if (target == i || args[0] == "all")
                    {
                        var compPlayer = Player(target);

                        if (Globals.ALL_KITTIES.ContainsKey(compPlayer))
                        {
                            player.DisplayTimedTextTo(10.0f, $"{Colors.COLOR_YELLOW_ORANGE}Player already has a hero.");
                            continue;
                        }

                        Globals.ALL_PLAYERS.Add(compPlayer);
                        SaveManager.SetPlayerLoaded(compPlayer);
                        var newKitty = new Kitty(compPlayer);
                        newKitty.ComputerControlled = true;
                        newKitty.Unit.AddItem(FourCC("bspd"));
                    }
                }
            }
        );

        CommandsManager.RegisterCommand(
            name: "deletehero",
            alias: "delh",
            tier: CommandTier.Admin,
            argDesc: "[playerNumber]",
            description: "Deletes the hero of the specified player.",
            action: (player, args) =>
            {

                if (args[0] == "") // cannot delete self anyway, but for usage i guess.
                {
                    player.DisplayTimedTextTo(10.0f, $"{Colors.COLOR_YELLOW_ORANGE}Usage: deletehero [player] or [all]|r");
                    return;
                }

                CommandsManager.ResolvePlayerId(args[0], kitty =>
                {
                    if (kitty == null) return;
                    if (!Globals.ALL_KITTIES.ContainsKey(kitty.Player))
                    {
                        player.DisplayTimedTextTo(10.0f, $"{Colors.COLOR_YELLOW_ORANGE}Player does not have a hero.|r");
                        return;
                    }
                    if (kitty.Player.SlotState == playerslotstate.Playing && kitty.Player.Controller != mapcontrol.Computer) // if slotted, it becomes computer.. this allows for deletion of even slotted comps
                    {
                        player.DisplayTimedTextTo(10.0f, $"{Colors.COLOR_YELLOW_ORANGE}Player is not a computer.|r");
                        return;
                    }

                    PlayerLeaves.PlayerLeavesActions(kitty.Player);

                });
            }
        );

        CommandsManager.RegisterCommand(
            name: "skin",
            alias: "",
            tier: CommandTier.VIP,
            argDesc: "[skinId], [player]",
            description: "Sets the skin of the passed player parameter. Use \"none\" for default skin.",
            action: (player, args) =>
            {
                int skin = (args[0] == "" || args[0] == "none") ? Constants.UNIT_KITTY : FourCC(args[0]);

                if (args.Length < 2 || args[1] == "")
                {
                    BlzSetUnitSkin(Globals.ALL_KITTIES[player].Unit, skin);
                    return;
                }

                CommandsManager.ResolvePlayerId(args[1], kitty =>
                {
                    if (kitty == null) return;
                    BlzSetUnitSkin(kitty.Unit, skin);
                });
                return;
            }
        );

        CommandsManager.RegisterCommand(
            name: "ai",
            alias: "",
            tier: CommandTier.VIP,
            argDesc: "[resolvePlayerId]",
            description: "Toggles AI for the specified player.",
            action: (player, args) =>
            {

                CommandsManager.ResolvePlayerId(args[0], kitty =>
                {
                    if (kitty == null) return;
                    if (!Globals.ALL_KITTIES.ContainsKey(kitty.Player))
                    {
                        player.DisplayTimedTextTo(10.0f, $"{Colors.COLOR_YELLOW_ORANGE}Player does not have a hero.");
                        return;
                    }

                    if (kitty.aiController.IsEnabled())
                    {
                        kitty.aiController.StopAi();
                        player.DisplayTimedTextTo(1.0f, $"{Colors.COLOR_YELLOW}AI deactivated.");
                    }
                    else
                    {
                        kitty.aiController.StartAi();
                        player.DisplayTimedTextTo(1.0f, $"{Colors.COLOR_YELLOW}AI activated.");
                    }
                });
            }
        );

        CommandsManager.RegisterCommand(
            name: "aisetup",
            alias: "",
            tier: CommandTier.Admin,
            argDesc: "[dodgeRadius] [timerInterval] [laser]",
            description: "Sets up AI parameters.",
            action: (player, args) =>
            {
                if (args[0] == "")
                {
                    player.DisplayTimedTextTo(10.0f, $"{Colors.COLOR_YELLOW_ORANGE}Usage: aisetup [dodgeRadius=192] [timerInterval=0.1] [laser=0]");
                    return;
                }

                var dodgeRadius = args.Length > 0 ? float.Parse(args[0]) : 192.0f;
                var timerInterval = args.Length > 1 ? float.Parse(args[1]) : 0.1f;
                var laser = args.Length > 2 ? int.Parse(args[2]) : 0;

                foreach (var compKitty in Globals.ALL_KITTIES)
                {
                    if (compKitty.Value.aiController.IsEnabled())
                    {
                        compKitty.Value.aiController.DODGE_RADIUS = dodgeRadius;
                        compKitty.Value.aiController.timerInterval = timerInterval;
                        compKitty.Value.aiController.laser = laser == 1;
                    }
                }

                player.DisplayTimedTextTo(10.0f, $"{Colors.COLOR_YELLOW}AI setup: dodgeRadius={dodgeRadius}, timerInterval={timerInterval}, laser={laser}");
            }
        );

        CommandsManager.RegisterCommand(
            name: "ailaser",
            alias: "lasercolor",
            tier: CommandTier.Admin,
            argDesc: "[free/blocked] [string ID]",
            description: "Changes the color of the laser on all the AI, blocked or free",
            action: (player, args) =>
            {
                if (args[0] == "")
                {
                    return;
                }

                var laserType = args[0].ToLower();
                if (laserType != "free" && laserType != "blocked")
                {
                    player.DisplayTimedTextTo(10.0f, $"{Colors.COLOR_YELLOW_ORANGE}Usage: ailaser [free/blocked] [string ID]");
                    return;
                }

                if (laserType == "free") AIController.FREE_LASER_COLOR = args[1].ToUpper();
                else if (laserType == "blocked") AIController.BLOCKED_LASER_COLOR = args[1].ToUpper();

                player.DisplayTimedTextTo(10.0f, $"{Colors.COLOR_YELLOW}Laser color changed: {laserType} laser color is now {args[1].ToUpper()}");
            }
        );

        CommandsManager.RegisterCommand(
            name: "aitest",
            alias: "test33",
            tier: CommandTier.Admin,
            argDesc: "",
            description: "Changes the color of the laser on all the AI, blocked or free",
            action: (player, args) =>
            {
                foreach (var compKitty in Globals.ALL_KITTIES)
                {
                    if (compKitty.Value.aiController.IsEnabled())
                    {
                        compKitty.Value.aiController.DODGE_RADIUS = 160.0f;
                        compKitty.Value.aiController.timerInterval = 0.1f;
                        compKitty.Value.aiController.laser = true;
                    }
                }
                player.DisplayTimedTextTo(10.0f, $"{Colors.COLOR_YELLOW}Test started");
            }
        );

        CommandsManager.RegisterCommand(
            name: "killunit",
            alias: "kill,kl",
            tier: CommandTier.Admin,
            argDesc: "resolve playerID",
            description: "Kills urself by default, or enter name/number/selected, parm. ONLY KITTIES",
            action: (player, args) => CommandsManager.ResolvePlayerId(args[0], kitty => kitty.KillKitty())
        );

        CommandsManager.RegisterCommand(
            name: "kibblecurrency",
            alias: "kibbleinfo,kbinfo",
            tier: CommandTier.All,
            argDesc: "player name, #, selected, or self",
            description: "Gets the Kibble Currency information on the given player.",
            action: (player, args) =>
            {
                CommandsManager.ResolvePlayerId(args[0], kitty => AwardingCmds.GetKibbleCurrencyInfo(player, kitty));
            }
        );

        CommandsManager.RegisterCommand(
            name: "error",
            alias: "",
            tier: CommandTier.All,
            argDesc: "[on][off]",
            description: "Turns the error prompts off or on",
            action: (player, args) =>
            {
                var status = args[0] != "" && CommandsManager.GetBool(args[0]);
                ErrorHandler.ErrorMessagesOn = status;
                player.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_YELLOW_ORANGE}Error messages: {status}");
            }
        );

        CommandsManager.RegisterCommand(
            name: "nochain",
            alias: "",
            tier: CommandTier.All,
            argDesc: "",
            description: "Lets you opt out of the chained together event.",
            action: (player, args) =>
            {
                if (RoundManager.GAME_STARTED)
                {
                    player.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_YELLOW_ORANGE}You cannot opt out of the chain after the round has started.");
                    return;
                }

                ChainedTogether.OptOutOfChain(Globals.ALL_KITTIES[player]);
            }
        );

        CommandsManager.RegisterCommand(
            name: "times",
            alias: "gettimes",
            tier: CommandTier.All,
            argDesc: "[player] [difficulty]",
            description: "Gets fastest overall times of the passed parm player and difficulty, if no parm then yourself and current difficulty.",
            action: (player, args) =>
            {
                var difficulty = args.Length > 1 && args[1] != "" ? args[1] : Difficulty.DifficultyOption.Name;
                CommandsManager.ResolvePlayerId(args[0], kitty => AwardingCmds.GetAllGameTimes(player, kitty, difficulty));
            }
        );

        CommandsManager.RegisterCommand(
            name: "personalbests",
            alias: "pbs,bests",
            tier: CommandTier.All,
            argDesc: "[resolvePlayerId]",
            description: "Gets personal best stats of the passed parm player, if no parm then yourself.",
            action: (player, args) => CommandsManager.ResolvePlayerId(args[0], kitty => AwardingCmds.GetAllPersonalBests(player, kitty))
        );

        CommandsManager.RegisterCommand(
            name: "stats",
            alias: "",
            tier: CommandTier.All,
            argDesc: "[resolvePlayerId]",
            description: "Gets the game stats of the passed parm player, if no parm then yourself.",
            action: (player, args) => CommandsManager.ResolvePlayerId(args[0], kitty => AwardingCmds.GetAllGameStats(player, kitty))
        );

        CommandsManager.RegisterCommand(
            name: "shop",
            alias: "",
            tier: CommandTier.All,
            argDesc: "",
            description: "Opens the shop frame.",
            action: (player, args) =>
            {
                ShopFrame.ShopFrameActions();
            }
        );

        CommandsManager.RegisterCommand(
            name: "rewards",
            alias: "",
            tier: CommandTier.All,
            argDesc: "",
            description: "Opens the rewards frame.",
            action: (player, args) =>
            {
                RewardsFrame.RewardsFrameActions();
            }
        );

        CommandsManager.RegisterCommand(
            name: "music",
            alias: "",
            tier: CommandTier.All,
            argDesc: "",
            description: "Opens the music frame.",
            action: (player, args) =>
            {
                MusicFrame.MusicFrameActions();
            }
        );

        CommandsManager.RegisterCommand(
            name: "benchmarktest",
            alias: "bmt",
            tier: CommandTier.Developer,
            argDesc: "Testing performance in collision detection",
            description: "Runs a benchmark test for collision detection. Results are printed. Beware of lag -- will cause performance issues while running.",
            action: (player, args) =>
            {
             /*
                var k = Globals.ALL_KITTIES[player];
                var func = CollisionDetection.CircleCollisionFilter(k);

                StringBuilder sb = new StringBuilder();

                for (int j = 0; j < 5; j++)
                {
                    // Warmup
                    for (int i = 0; i < 10000; i++)
                        func();

                    var sw = Stopwatch.StartNew();

                    const int iterations = 2_000_000;
                    int hits = 0;

                    for (int i = 0; i < iterations; i++)
                    {
                        if (func())
                            hits++;
                    }

                    sw.Stop();

                    sb.AppendLine($"\nTime: {sw.ElapsedMilliseconds} ms\n Ops/sec: {(iterations / sw.Elapsed.TotalSeconds):N0}\n Hits: {hits}\n\n");
                }

                SyncSaveLoad.Instance.WriteStringNoEncodeNoLoad("Run-Kitty-Run/DebugBenchMarkAches.txt", sb.ToString());
             */
            }

        );

        CommandsManager.RegisterCommand(
            name: "revivetest",
            alias: "yoshi",
            tier: CommandTier.Developer,
            argDesc: "[on][off]",
            description: "Activates the revive invul for 0.6 seconds. Served as a test run.",
            action: (player, args) =>
            {
                bool status = args[0] != "" && CommandsManager.GetBool(args[0]);
                Kitty.InvulTest = status;
                player.DisplayTimedTextTo(3.0f, $"{Colors.COLOR_YELLOW_ORANGE}Revive invul test: {status}");
            }
        );

        CommandsManager.RegisterCommand(
            name: "col",
            alias: "collision",
            tier: CommandTier.VIP,
            argDesc: "[player]",
            description: "Gets collision of passed player, or yourself if no args.",
            action: (player, args) =>
            {
                if (args[0] == "")
                {
                    player.DisplayTimedTextTo(3.0f, $"{Globals.ALL_KITTIES[player].CurrentStats.CollisonRadius}");
                    return;
                }
                CommandsManager.ResolvePlayerId(args[0], kitty =>
                {
                    player.DisplayTimedTextTo(3.0f, $"{Colors.PlayerNameColored(kitty.Player)} : {kitty.CurrentStats.CollisonRadius}");
                });
            }
        );

        CommandsManager.RegisterCommand(
            name: "fortest",
            alias: "",
            tier: CommandTier.Developer,
            argDesc: "[on][off]",
            description: "Foreach memory test, executes 20k iterations of foreach loop.",
            action: (player, args) =>
            {
                // Roughly 3MB of memory per 20k iterations.
                for (int i = 0; i < 20000; i++)
                {
                    foreach (var k in Globals.ALL_KITTIES)
                    {
                        k.Value.TeamID = k.Value.TeamID;
                    }
                }
                player.DisplayTextTo(Colors.COLOR_YELLOW_ORANGE + "Done");
            }
        );

        CommandsManager.RegisterCommand(
            name: "moretime",
            alias: "mt",
            tier: CommandTier.All,
            argDesc: "",
            description: "Adds 20 secondsd to the round timer. Can only happen once per round.",
            action: (player, args) =>
            {
                if (!RoundManager.AddMoreRoundTime()) return;
                Console.WriteLine($"{Colors.PlayerNameColored(player)}{Colors.COLOR_TURQUOISE} has added more time to start the round.{Colors.COLOR_RESET}{Colors.COLOR_RED}({RoundTimer.StartRoundTimer.Remaining.ToString("F2")} seconds remaining){Colors.COLOR_RESET}");
            }
        );

        CommandsManager.RegisterCommand(
            name: "automt",
            alias: "amt, automoretime",
            tier: CommandTier.All,
            argDesc: "[seconds] (20.00 default)",
            description: "Automatically applies this extra time at the start of each round. Limit is 60 seconds.",
            action: (player, args) =>
            {
                var timeValue = args[0] != "" ? float.Parse(args[0]) : 20.0f; // Default to 20
                if (timeValue < 0 || timeValue > 60.0f)
                {
                    player.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_YELLOW_ORANGE}Usage: automt [seconds], seconds must be between 0 and 60.{Colors.COLOR_RESET}");
                    return;
                }
                RoundManager.AddMoreRoundTime(timeValue); // Account for current round intermission.
                RoundManager.ROUND_INTERMISSION = timeValue + Standard.ROUND_INTERMISSION;
                Console.WriteLine($"{Colors.PlayerNameColored(player)}{Colors.COLOR_TURQUOISE} has added more time to start the round and all future rounds.{Colors.COLOR_RESET}{Colors.COLOR_RED}({RoundTimer.StartRoundTimer.Remaining.ToString("F2")} seconds remaining){Colors.COLOR_RESET}");
            }
        );

        CommandsManager.RegisterCommand(
            name: "spawnkibble",
            alias: "skb",
            tier: CommandTier.Admin,
            argDesc: "[# of kibble]",
            description: "Spawns {int #} of kibbles ",
            action: (player, args) =>
            {
                var amount = args[0] != "" ? int.Parse(args[0]) : ItemSpawner.NUMBER_OF_ITEMS;
                ItemSpawner.SpawnKibble(amount);

            }
        );

        // -jackpot command
        CommandsManager.RegisterCommand(
            name: "jackpot",
            alias: "jp",
            tier: CommandTier.All,
            argDesc: "",
            description: "Tells the number of jackpots all players have recieved this game.",
            action: (player, args) =>
            {
                var finalString = "";
                for (int i = 0; i < Globals.ALL_KITTIES_LIST.Count; i++)
                {
                    var kitty = Globals.ALL_KITTIES_LIST[i];
                    finalString += $"{Colors.PlayerNameColored(kitty.Player)}: {kitty.CurrentStats.CollectedJackpots} jackpots {Colors.COLOR_YELLOW}({kitty.CurrentStats.GoldCollectedFromJackpots}){Colors.COLOR_RESET}\n";
                }
                player.DisplayTimedTextTo(7.0f, finalString);
            }
        );

        CommandsManager.RegisterCommand(
            name: "savedvc",
            alias: "svc, ssc",
            tier: CommandTier.All,
            argDesc: "",
            description: "Sets you to your previously last saved vortex color if you have one.",
            action: (player, args) =>
            {
                Kitty kitty = Globals.ALL_KITTIES[player];
                string vortexColor = kitty.SaveData.PlayerColorData.VortexColor;
                if (vortexColor == "") return;
                string[] rgb = vortexColor.Split(',');
                player.DisplayTextTo($"{Colors.COLOR_YELLOW_ORANGE}Your vortex color has been set to the following: {Colors.COLOR_RED}R: {rgb[0]} {Colors.COLOR_GREEN}G: {rgb[1]} {Colors.COLOR_BLUE}B: {rgb[2]} {Colors.COLOR_RESET}");
                Colors.SetPlayerVertexColor(kitty.Player, rgb);
            }
        );

        CommandsManager.RegisterCommand(
            name: "sendtostart",
            alias: "sts",
            tier: CommandTier.Admin,
            argDesc: "[resolvePlayerId]",
            description: "Sends the passed player to the start",
            action: (player, args) =>
            {
                CommandsManager.ResolvePlayerId(args[0], kitty =>
                {
                    if (kitty == null) return;
                    var spawnCenter = RegionList.SpawnRegions[1];
                    kitty.Unit.SetPosition(spawnCenter.Center.X, spawnCenter.Center.Y);
                });
            }
        );

        CommandsManager.RegisterCommand(
            name: "team",
            alias: "t",
            tier: CommandTier.All,
            argDesc: "[team #]",
            description: "Assigns you to the provided team arg #, (TEAM MODE ONLY)",
            action: (player, args) =>
            {
                if (args[0] == "")
                {
                    player.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_YELLOW_ORANGE}Usage: team [team #]{Colors.COLOR_RESET}");
                    return;
                }
                TeamHandler.Handler(player, int.Parse(args[0]));
            }
        );

        CommandsManager.RegisterCommand(
            name: "test5",
            alias: "t5",
            tier: CommandTier.Developer,
            argDesc: "",
            description: "Creates TeamDeathless Effect",
            action: (player, args) =>
            {
                Console.WriteLine($"{Colors.COLOR_TURQUOISE}# of Commands: {CommandsManager.Count}");
            }
        );

        CommandsManager.RegisterCommand(
            name: "deathless",
            alias: "dl",
            tier: CommandTier.Admin,
            argDesc: "[player]",
            description: "Teleports the ResolvePlayerId to each safezone all the way to the end",
            action: (player, args) =>
            {
                if (args[0] == "")
                {
                    player.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_YELLOW_ORANGE}Usage: -deathless [ResolvePlayerId]|r");
                    return;
                }
                CommandsManager.ResolvePlayerId(args[0], kitty =>
                {
                    if (kitty == null) return;
                    var safeZones = RegionList.SafeZones;
                    foreach (var safeZone in safeZones)
                    {
                        kitty.Unit.SetPosition(safeZone.Center.X, safeZone.Center.Y);
                    }
                });
            }
        );

        CommandsManager.RegisterCommand(
            name: "restart",
            alias: "rst",
            tier: CommandTier.Admin,
            argDesc: "",
            description: "Restarts the current round and time to 0:00",
            action: (player, args) =>
            {
                if (Globals.ROUND <= 0) return;
                Globals.GAME_SECONDS = Globals.GAME_SECONDS - GameTimer.RoundTime[Globals.ROUND];
                GameTimer.RoundTime[Globals.ROUND] = 0.0f; // reset the round end time
                GameTimer.FinishedTimes[Globals.ROUND] = 0.0f; // reset the finished time
                Globals.ROUND = 0;
                Utility.ResetAllKittiesLevelsGold(); // level 1 , resource gold.
                RoundManager.RoundEnd();
            }
        );

        CommandsManager.RegisterCommand(
            name: "disablekibble",
            alias: "dkb",
            tier: CommandTier.Red,
            argDesc: "[none]",
            description: "Disables/Reenables Kibble Spawning, flipping the current status.",
            action: (player, args) =>
            {
                Kibble.SpawningKibble = !Kibble.SpawningKibble;
                Console.WriteLine($"{Colors.COLOR_YELLOW_ORANGE}Kibble spawning is now: {Kibble.SpawningKibble}{Colors.COLOR_RESET}");
            }
        );

        CommandsManager.RegisterCommand(
            name: "weather",
            alias: "",
            tier: CommandTier.Red,
            argDesc: "[weather]",
            description: "Options: snow, hsnow, blizzard, rain, hrain, rays, moonlight, none",
            action: (player, args) =>
            {
                if (args[0] == "")
                {
                    player.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_YELLOW_ORANGE}Usage: weather [weather type]{Colors.COLOR_RESET}");
                    return;
                }
                SeasonalManager.SetWeather(args[0]);
            }
        );

        CommandsManager.RegisterCommand(
            name: "test9",
            alias: "",
            tier: CommandTier.Developer,
            argDesc: "[weather]",
            description: "Sand Test",
            action: (player, args) =>
            {
                TerrainChanger.ChangeMapTerrain(TerrainChanger.LastWolfTerrain, FourCC("Zdrg"));
                Console.WriteLine("Changed Terrain");
            }
        );

        CommandsManager.RegisterCommand(
            name: "test8",
            alias: "",
            tier: CommandTier.Developer,
            argDesc: "",
            description: "Puts an effect test on for some nitro thingy",
            action: (player, args) =>
            {
                var unitKitty = Globals.ALL_KITTIES[player].Unit;
                effect.Create("war3mapImported\\TemperedAura.mdx", unitKitty, "origin");
            }
        );

        CommandsManager.RegisterCommand(
            name: "resetleaguestats",
            alias: "rls",
            tier: CommandTier.Developer,
            argDesc: "",
            description: "Resets all league stats for the specified player.",
            action: (player, args) =>
            {
                CommandsManager.ResolvePlayerId(args[0], kitty =>
                {
                    if (kitty == null) return;
                    kitty.SaveData.LeagueSeasonData.ResetLeagueSeasonData();
                    player.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_GOLD}League stats reset for {Colors.PlayerNameColored(kitty.Player)}!{Colors.COLOR_RESET}");
                });
            }
        );

        CommandsManager.RegisterCommand(
            name: "kittylist",
            alias: "",
            tier: CommandTier.Developer,
            argDesc: "",
            description: "Puts an effect test on for some nitro thingy",
            action: (player, args) =>
            {
                string x = "";
                foreach (var k in Globals.ALL_KITTIES_LIST)
                {
                    x += $"{Colors.PlayerNameColored(k.Player)} ({k.Player.Id})\n";
                }
                Console.WriteLine(x);
            }
        );

        CommandsManager.RegisterCommand(
            name: "chainedtest",
            alias: "",
            tier: CommandTier.Developer,
            argDesc: "",
            description: "Starts chained together test",
            action: (player, args) =>
            {
                ChainedTogether.TriggerEvent();
                ChainedTogether.StartEvent();
            }
        );

        CommandsManager.RegisterCommand(
            name: "savetesting",
            alias: "ast",
            tier: CommandTier.Developer,
            argDesc: "",
            description: "Save Testing for Lane Times",
            action: (player, args) =>
            {
            }
        );

        CommandsManager.RegisterCommand(
            name: "chaineffect",
            alias: "",
            tier: CommandTier.Developer,
            argDesc: "",
            description: "Testing the chain effect model",
            action: (player, args) =>
            {
                var kitty = Globals.ALL_KITTIES[player];
                effect.Create("ChainTest.mdx", kitty.Unit, "origin");
            }
        );

        CommandsManager.RegisterCommand(
            name: "mockdata",
            alias: "mock,mockstats",
            tier: CommandTier.Developer,
            argDesc: "[resolvePlayerId] or [all]",
            description: "Generates mock save data for testing. Use 'all' for all players or specify a player.",
            action: (player, args) =>
            {
                CommandsManager.ResolvePlayerId(args[0], kitty =>
                {
                    if (kitty == null) return;
                    MockDataGenerator.GenerateMockSaveData(kitty);
                    player.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_GOLD}Mock data generated for {Colors.PlayerNameColored(kitty.Player)}!{Colors.COLOR_RESET}");
                });
            }
        );

        CommandsManager.RegisterCommand(
            name: "teammove",
            alias: "tm",
            tier: CommandTier.Admin,
            argDesc: "[ResolvePlayerId] [Team #]",
            description: "Swaps the passed ResolvePlayerId to the provided Team #, no restrictions",
            action: (player, args) =>
            {
                if (args.Length < 2 || args[0] == "" || args[1] == "")
                {
                    player.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_YELLOW_ORANGE}Usage: teammove [ResolvePlayerId] [Team #]{Colors.COLOR_RESET}");
                    return;
                }
                CommandsManager.ResolvePlayerId(args[0], kitty =>
                {
                    TeamHandler.Handler(kitty.Player, int.Parse(args[1]), true);
                });
            }
        );

        CommandsManager.RegisterCommand(
            name: "playersperteam",
            alias: "ppt",
            tier: CommandTier.Admin,
            argDesc: "[# Allowed Per Team]",
            description: "Sets the maximum # of people allowed per team to passed parm.",
            action: (player, args) =>
            {
                if (args[0] == "")
                {
                    player.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_YELLOW_ORANGE}Usage: playersperteam [# Allowed Per Team]{Colors.COLOR_RESET}");
                    return;
                }
                if (!int.TryParse(args[0], out int maxPlayersPerTeam) || maxPlayersPerTeam < 1 || maxPlayersPerTeam > 24)
                {
                    player.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_YELLOW_ORANGE}Invalid number of players per team. (1-24)|r");
                    return;
                }
                Gamemode.PlayersPerTeam = maxPlayersPerTeam;
                player.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_YELLOW_ORANGE}Max Players Per Team set to {maxPlayersPerTeam}|r");
            }
        );

        CommandsManager.RegisterCommand(
            name: "test10",
            alias: "",
            tier: CommandTier.Developer,
            argDesc: "",
            description: "Getting wolf timer address Information",
            action: (player, args) =>
            {
                var selectedUnit = CustomStatFrame.SelectedUnit[player];
                if (!Globals.ALL_WOLVES.ContainsKey(selectedUnit)) return;
                var wolf = Globals.ALL_WOLVES[selectedUnit];
                string timerAddress = $"WCTimerAddresses:{wolf.WanderTimer.Timer} : {wolf.EffectTimer.Timer}";
                Console.WriteLine($"{timerAddress}");
            }
        );

        CommandsManager.RegisterCommand(
            name: "getdate",
            alias: "",
            tier: CommandTier.All,
            argDesc: "",
            description: "Gets the current date, time, day, month, etc.",
            action: (player, args) =>
            {
                player.DisplayTimedTextTo(3.0f, $"{Colors.COLOR_YELLOW_ORANGE}Date: {DateTimeManager.DateTime.ToString()}");
            }
        );

        CommandsManager.RegisterCommand(
            name: "approved",
            alias: "appt",
            tier: CommandTier.Admin,
            argDesc: "[true][false]",
            description: "Approves the current TOURNAMENT_ID, this only needs to get approved once per tournament series.",
            action: (player, args) =>
            {
                bool approved = CommandsManager.GetBool(args[0]);

                var bitApproval = approved ? 1 : 0;
                TournamentSaver.Instance.ApprovedForUpload = bitApproval;
                string status = approved ? "Approved" : "Denied";
                player.DisplayTimedTextTo(3.0f, $"{Colors.COLOR_YELLOW_ORANGE}Tournament ID {status}: {TournamentSaver.Instance.TOURNAMENT_ID}{Colors.COLOR_RESET}");
            }
        );

        CommandsManager.RegisterCommand(
            name: "resettournamentdata",
            alias: "rtd",
            tier: CommandTier.Admin,
            argDesc: "[resolvePlayerId]",
            description: "Resets the resolvePlayerId Tournament Data",
            action: (player, args) =>
            {
                if (args[0] == "")
                {
                    player.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_YELLOW_ORANGE}Usage: resettournamentdata [ResolvePlayerId]{Colors.COLOR_RESET}");
                    return;
                }
                CommandsManager.ResolvePlayerId(args[0], kitty =>
                {
                    if (kitty == null) return;
                    TournamentSaver.Instance.ResetAllGamesData(kitty);
                    player.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_YELLOW_ORANGE}Tournament data reset for {Colors.PlayerNameColored(kitty.Player)}{Colors.COLOR_RESET}");
                });
            }
        );

        CommandsManager.RegisterCommand(
            name: "resetmytournamentdata",
            alias: "rmtd",
            tier: CommandTier.All,
            argDesc: "[]",
            description: "Resets your Tournament Data",
            action: (player, args) =>
            {
                var kitty = Globals.ALL_KITTIES[player];
                TournamentSaver.Instance.ResetAllGamesData(kitty);
                player.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_YELLOW_ORANGE}Tournament data reset for {Colors.PlayerNameColored(kitty.Player)}{Colors.COLOR_RESET}");
            }
        );

        CommandsManager.RegisterCommand(
            name: "setcommandtier",
            alias: "sct",
            tier: CommandTier.Admin,
            argDesc: "[resolvePlayerId] [CommandTier]",
            description: "Sets the CommandTier level of the passed ResolvePlayerId",
            action: (player, args) =>
            {
                var cmdPlayerKitty = Globals.ALL_KITTIES[player];
                CommandsManager.ResolvePlayerId(args[0], kitty =>
                {
                    if (!Enum.TryParse(args[1], true, out CommandTier newTier))
                    {
                        var tierList = $"{Colors.COLOR_WHITE}All{Colors.COLOR_RESET}, {Colors.COLOR_RED}Red{Colors.COLOR_RESET}, {Colors.COLOR_GOLD}VIP{Colors.COLOR_RESET}, {Colors.COLOR_PURPLE}Admin{Colors.COLOR_RESET}, {Colors.COLOR_TURQUOISE}Developer{Colors.COLOR_RESET}";
                        player.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_YELLOW_ORANGE}Invalid CommandTier. Valid options are: {tierList}");
                        return;
                    }

                    if (newTier >= cmdPlayerKitty.CommandTier)
                    {
                        player.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_YELLOW_ORANGE}You cannot set a CommandTier higher than your own ({cmdPlayerKitty.CommandTier}).{Colors.COLOR_RESET}");
                        return;
                    }

                    if (cmdPlayerKitty.CommandTier <= kitty.CommandTier)
                    {
                        player.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_YELLOW_ORANGE}You cannot set a CommandTier for someone with an equal or higher CommandTier than yourself ({cmdPlayerKitty.CommandTier}).{Colors.COLOR_RESET}");
                        return;
                    }

                    kitty.CommandTier = newTier;
                    kitty.Unit.Name = $"{Colors.PlayerNameColored(kitty.Player)} ({Colors.GetColoredCommandTier(newTier)})";
                    player.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_YELLOW_ORANGE}Set CommandTier for {Colors.PlayerNameColored(kitty.Player)} to {newTier}{Colors.COLOR_RESET}");
                });
            }
        );


        CommandsManager.RegisterCommand(
            name: "slidespeed",
            alias: "ss",
            tier: CommandTier.Admin,
            argDesc: "[speed] [player]",
            description: "Sets the absolute slide speed of the passed player, or yourself if no player is provided.",
            action: (player, args) =>
            {
                if (args[0] == "")
                {
                    player.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_YELLOW_ORANGE}Usage: slidespeed [speed] [player]|r");
                    return;
                }

                float speed = float.Parse(args[0]);
                if (args.Length < 2 || args[1] == "")
                {
                    Globals.ALL_KITTIES[player].Slider.absoluteSlideSpeed = speed > 0 ? speed : null;
                    player.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_YELLOW_ORANGE}Set your slide speed to {speed}|r");
                    return;
                }

                bool isMatch = false;

                CommandsManager.ResolvePlayerId(args[1], kitty =>
                {
                    if (kitty == null) return;
                    isMatch = true;
                    kitty.Slider.absoluteSlideSpeed = speed > 0 ? speed : null;
                });

                if (isMatch)
                {
                    player.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_YELLOW_ORANGE}Set their slide speed to {speed}|r");
                }
            }
        );

        CommandsManager.RegisterCommand(
           name: "movespeed",
           alias: "ms",
           tier: CommandTier.Admin,
           argDesc: "[speed] [player]",
           description: "Sets the absolute move speed of the passed player, or yourself if no player is provided.",
           action: (player, args) =>
           {
               if (args[0] == "")
               {
                   player.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_YELLOW_ORANGE}Usage: movespeed [speed] [player]|r");
                   return;
               }

               float speed = float.Parse(args[0]);
               if (args.Length < 2 || args[1] == "")
               {
                   Globals.ALL_KITTIES[player].RTR.absoluteMoveSpeed = speed > 0 ? speed : null;
                   player.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_YELLOW_ORANGE}Set your move speed to {speed}|r");
                   return;
               }

               bool isMatch = false;

               CommandsManager.ResolvePlayerId(args[1], kitty =>
               {
                   if (kitty == null) return;
                   isMatch = true;
                   kitty.RTR.absoluteMoveSpeed = speed > 0 ? speed : null;
               });

               if (isMatch)
               {
                   player.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_YELLOW_ORANGE}Set their move speed to {speed}|r");
               }
           }
       );

        CommandsManager.RegisterCommand(
            name: "speededit",
            alias: "se",
            tier: CommandTier.Admin,
            argDesc: "[on/off] [player]",
            description: "Turns on RTR and sets move speed to 800 for the specified player.",
            action: (player, args) =>
            {
                if (args[0] == "")
                {
                    player.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_YELLOW_ORANGE}Usage: speededit [on/off] [player]|r");
                    return;
                }

                bool mode = CommandsManager.GetBool(args[0]);

                if (args.Length < 2 || args[1] == "")
                {
                    // Apply to self
                    if (mode)
                    {
                        Globals.ALL_KITTIES[player].RTR.StartRTR();
                        Globals.ALL_KITTIES[player].RTR.absoluteMoveSpeed = 800f;
                        player.DisplayTextTo(Colors.COLOR_GOLD + "Speed Edit: On (RTR + 800 speed)");
                    }
                    else
                    {
                        Globals.ALL_KITTIES[player].RTR.StopRTR();
                        Globals.ALL_KITTIES[player].RTR.absoluteMoveSpeed = null;
                        player.DisplayTextTo(Colors.COLOR_GOLD + "Speed Edit: Off");
                    }
                    return;
                }

                bool isMatch = false;

                CommandsManager.ResolvePlayerId(args[1], kitty =>
                {
                    if (kitty == null) return;
                    isMatch = true;
                    if (mode)
                    {
                        kitty.RTR.StartRTR();
                        kitty.RTR.absoluteMoveSpeed = 800f;
                    }
                    else
                    {
                        kitty.RTR.StopRTR();
                        kitty.RTR.absoluteMoveSpeed = null;
                    }
                });

                if (isMatch)
                {
                    player.DisplayTextTo(Colors.COLOR_GOLD + $"Speed Edit set to {(mode ? "On (RTR + 800 speed)" : "Off")} for target player");
                }
            }
        );
    }
}

