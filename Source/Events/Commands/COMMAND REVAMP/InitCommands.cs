using System;
using System.Linq;
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
            group: "all",
            argDesc: "",
            description: "Displays all available commands.",
            action: (player, args) =>
            {
                CommandsManager.HelpCommands(player, args?.FirstOrDefault());
            }
        );

        CommandsManager.RegisterCommand(
            name: "memtest",
            alias: "",
            group: "admin",
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
            group: "all",
            argDesc: "",
            description: "Save your current game stats.",
            action: (player, args) => Globals.SaveSystem.Save(player)
        );

        CommandsManager.RegisterCommand(
            name: "wolfeffects",
            alias: "we,wolfe",
            group: "admin",
            argDesc: "[true][false]",
            description: "Disables the wolves overhead ! effects",
            action: (player, args) => Wolf.DisableEffects = CommandsManager.GetBool(args[0])
        );

        CommandsManager.RegisterCommand(
            name: "clear",
            alias: "clear,clr,c",
            group: "all",
            argDesc: "",
            description: "Clears your screen.",
            action: (player, args) => Utility.ClearScreen(player)
        );

        CommandsManager.RegisterCommand(
            name: "gold",
            alias: "g",
            group: "admin",
            argDesc: "amount",
            description: "Gives the player gold.",
            action: (player, args) =>
            {
                if (!int.TryParse(args[0], out int amount))
                {
                    player.DisplayTimedTextTo(5.0f, "Invalid amount.");
                    return;
                }
                player.Gold += amount;
            }
        );

        CommandsManager.RegisterCommand(
            name: "colors",
            alias: "",
            group: "all",
            argDesc: "",
            description: "Display all available colors.",
            action: (player, args) => Colors.ListColorCommands(player)
        );

        CommandsManager.RegisterCommand(
            name: "color",
            alias: "",
            group: "all",
            argDesc: "[color]",
            description: "Set your player color.",
            action: (player, args) => Colors.SetPlayerColor(player, args?[0])
        );

        CommandsManager.RegisterCommand(
            name: "kick",
            alias: "k",
            group: "all",
            argDesc: "[playerNumber]",
            description: "Initiate a votekick against a player.",
            action: (player, args) => Votekick.InitiateVotekick(player, args?[0])
        );

        CommandsManager.RegisterCommand(
            name: "voteend",
            alias: "ve",
            group: "all",
            argDesc: "",
            description: "Initiate a vote to end the round (Solo Tournament Only).",
            action: (player, args) => VoteEndRound.InitiateVote(player)
        );

        CommandsManager.RegisterCommand(
            name: "yes",
            alias: "y",
            group: "all",
            argDesc: "",
            description: "Vote yes for the current vote.",
            action: (player, args) =>
            {
                Votekick.IncrementTally();
                VoteEndRound.IncrementVote(player);
            }
        );

        CommandsManager.RegisterCommand(
            name: "affixinfo",
            alias: "",
            group: "all",
            argDesc: "",
            description: "Displays current round affixes.",
            action: (player, args) =>
            {
                var affixes = AffixFactory.CalculateAffixes();
                player.DisplayTextTo(Colors.COLOR_GOLD + "Current Affixes:\n" + string.Join("\n", affixes) + $"\n{Colors.COLOR_LAVENDER}Total: {AffixFactory.AllAffixes.Count}");
            }
        );

        CommandsManager.RegisterCommand(
            name: "wolfinfo",
            alias: "lnbm",
            group: "all",
            argDesc: "",
            description: "Displays the current wolf count.",
            action: (player, args) =>
            {
                var nbWolfs = Globals.ALL_WOLVES.Count;
                player.DisplayTextTo(Colors.COLOR_GOLD + "Current Wolf Count: " + nbWolfs);
            }
        );

        CommandsManager.RegisterCommand(
            name: "setcolor",
            alias: "sc,vc",
            group: "all",
            argDesc: "[rgb]",
            description: "Set your player vertex color.",
            action: (player, args) => Colors.SetPlayerVertexColor(player, args)
        );

        CommandsManager.RegisterCommand(
            name: "wild",
            alias: "",
            group: "all",
            argDesc: "",
            description: "Set a random vertex color.",
            action: (player, args) => Colors.SetPlayerRandomVertexColor(player)
        );

        CommandsManager.RegisterCommand(
            name: "names",
            alias: "n",
            group: "all",
            argDesc: "",
            description: "Hide all floating name tags.",
            action: (player, args) => FloatingNameTag.ShowAllNameTags(player, CommandsManager.GetBool(args[0]))
        );

        CommandsManager.RegisterCommand(
            name: "zoom",
            alias: "cam",
            group: "all",
            argDesc: "[xxxx]",
            description: "Adjust the camera zoom level.",
            action: (player, args) => CameraUtil.HandleZoomCommand(player, args)
        );

        CommandsManager.RegisterCommand(
            name: "lockcamera",
            alias: "lc,spectate",
            group: "all",
            argDesc: "",
            description: "Locks your camera to a unit.",
            action: (player, args) =>
            {
                if (args[0] == "")
                {
                    CameraUtil.LockCamera(player);
                    return;
                }
                /*                CommandsManager.ResolvePlayerId(args[0], kitty =>
                                {
                                    CameraUtil.LockCamera(kitty.Player);
                                });*/
            }
        );

        CommandsManager.RegisterCommand(
            name: "firstperson",
            alias: "fpc,firstpersoncamera",
            group: "all",
            argDesc: "",
            description: "Toggle first person camera.",
            action: (player, args) => FirstPersonCameraManager.ToggleFirstPerson(player)
        );

        CommandsManager.RegisterCommand(
            name: "reset",
            alias: "",
            group: "all",
            argDesc: "",
            description: "Resets your camera to default.",
            action: (player, args) =>
            {
                CameraUtil.UnlockCamera(player);
                FrameManager.InitalizeButtons();
            }
        );

        CommandsManager.RegisterCommand(
            name: "kc",
            alias: "",
            group: "all",
            argDesc: "",
            description: "Kicks yourself from the game.",
            action: (player, args) =>
            {
                PlayerLeaves.PlayerLeavesActions(player);
                Blizzard.CustomDefeatBJ(player, $"{Colors.COLOR_RED}You kicked yourself!|r");
            }
        );

        CommandsManager.RegisterCommand(
            name: "oldcode",
            alias: "",
            group: "all",
            argDesc: "",
            description: "Loads a previous save from RKR 4.2.0+.",
            action: (player, args) => Savecode.LoadString()
        );

        CommandsManager.RegisterCommand(
            name: "apm",
            alias: "",
            group: "all",
            argDesc: "",
            description: "Displays your APM for ACTIVE game time. (not counting intermissions)",
            action: (player, args) => player.DisplayTimedTextTo(10.0f, APMTracker.CalculateAllAPM())
        );

        CommandsManager.RegisterCommand(
            name: "stats",
            alias: "",
            group: "all",
            argDesc: "",
            description: "Displays game stats of whoever you currently have selected.",
            action: (player, args) => AwardingCmds.GetAllGameStats(player)
        );

        CommandsManager.RegisterCommand(
            name: "kibble",
            alias: "",
            group: "all",
            argDesc: "",
            description: "Displays the kibble collected by each player.",
            action: (player, args) =>
            {
                var kibbleList = "";
                foreach (var kitty in Globals.ALL_KITTIES)
                {
                    var kibblePicker = kitty.Value.Player;
                    var kibbleCollected = kitty.Value.CurrentStats.CollectedKibble;
                    kibbleList += $"{Colors.PlayerNameColored(kibblePicker)}: {kibbleCollected}\n";
                }
                player.DisplayTimedTextTo(7.0f, $"{Colors.COLOR_GOLD}Kibble Collected:\n{kibbleList}|r");
            }
        );

        CommandsManager.RegisterCommand(
            name: "watcher",
            alias: "watching",
            group: "all",
            argDesc: "",
            description: "Removes all units from game and you become an observer/spectator.",
            action: (player, args) => Utility.MakePlayerSpectator(player)
        );

        CommandsManager.RegisterCommand(
            name: "overheadcam",
            alias: "overhead,topdown,ohc",
            group: "all",
            argDesc: "",
            description: "Gives an overhead view.",
            action: (player, args) => CameraUtil.OverheadCamera(player, 280f)
        );

        CommandsManager.RegisterCommand(
            name: "komotocam",
            alias: "",
            group: "all",
            argDesc: "",
            description: "Toggle KomotoCam.",
            action: (player, args) => CameraUtil.ToggleKomotoCam(player)
        );

        CommandsManager.RegisterCommand(
            name: "glow",
            alias: "",
            group: "all",
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
            group: "all",
            argDesc: "",
            description: "Toggle mirror mode.",
            action: (player, args) =>
            {
                if (Globals.ALL_KITTIES[player].Slider.IsOnSlideTerrain())
                {
                    player.DisplayTextTo(Colors.COLOR_YELLOW_ORANGE + "You can't toggle mirror mode while sliding!");
                    return;
                }
                Globals.ALL_KITTIES[player].Slider.ToggleMirror();
                player.DisplayTextTo(Colors.COLOR_GOLD + "Mirror: " + (Globals.ALL_KITTIES[player].Slider.IsMirror() ? "On" : "Off"));
            }
        );

        CommandsManager.RegisterCommand(
            name: "disco",
            alias: "",
            group: "all",
            argDesc: "",
            description: "Toggle disco mode.",
            action: (player, args) => Globals.ALL_KITTIES[player].ToggleDisco()
        );

        CommandsManager.RegisterCommand(
            name: "animate",
            alias: "animation,an",
            group: "all",
            argDesc: "[index]",
            description: "Set unit animation by index.",
            action: (player, args) => SetUnitAnimationByIndex(Globals.ALL_KITTIES[player].Unit, int.Parse(args[0]))
        );

        CommandsManager.RegisterCommand(
            name: "spincam",
            alias: "",
            group: "all",
            argDesc: "[speed]",
            description: "Toggle SpinCam.",
            action: (player, args) =>
            {
                float speed = args[0] != "" ? float.Parse(args[0]) : 0;
                Globals.ALL_KITTIES[player].ToggleSpinCam(speed);
                player.DisplayTextTo(Colors.COLOR_GOLD + "SpinCam: " + (Globals.ALL_KITTIES[player].IsSpinCamActive() ? "On" : "Off"));
            }
        );

        CommandsManager.RegisterCommand(
            name: "activatebarrier",
            alias: "ab",
            group: "admin",
            argDesc: "",
            description: "Activates the barrier.",
            action: (player, args) => BarrierSetup.ActivateBarrier()
        );

        CommandsManager.RegisterCommand(
            name: "deactivatebarrier",
            alias: "db",
            group: "admin",
            argDesc: "",
            description: "Deactivates the barrier.",
            action: (player, args) => BarrierSetup.DeactivateBarrier()
        );

        CommandsManager.RegisterCommand(
            name: "endround",
            alias: "er",
            group: "admin",
            argDesc: "",
            description: "Ends the current round.",
            action: (player, args) => RoundManager.RoundEnd()
        );

        CommandsManager.RegisterCommand(
            name: "level",
            alias: "lvl",
            group: "admin",
            argDesc: "[level][player/selected]",
            description: "Sets the level of the selected unit.",
            action: (player, args) =>
            {
                if (args.Length < 2)
                {
                    var kitty = Globals.ALL_KITTIES[player].Unit.HeroLevel = int.Parse(args[0]);
                    return;
                }
                CommandsManager.ResolvePlayerId(args[1], kitty =>
                {
                    kitty.Unit.HeroLevel = int.Parse(args[0]);
                });
            }
        );

        CommandsManager.RegisterCommand(
            name: "blink",
            alias: "tele",
            group: "admin",
            argDesc: "",
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
            group: "admin",
            argDesc: "[difficulty]",
            description: "Changes the game difficulty.",
            action: (player, args) =>
            {
                var difficulty = args[0] != "" ? args[0] : "normal";
                Difficulty.ChangeDifficulty(difficulty);
                AffixFactory.DistributeAffixes();
                MultiboardUtil.RefreshMultiboards();
                NitroChallenges.SetNitroRoundTimes();
            }
        );

        CommandsManager.RegisterCommand(
            name: "revive",
            alias: "rpos",
            group: "admin",
            argDesc: "",
            description: "Revives yourself.",
            action: (player, args) =>
            {
                // if args is null or empty, revive self
                // else resolve playerid
                if (args[0] == "")
                {
                    Globals.ALL_KITTIES[player].ReviveKitty();
                    return;
                }

                CommandsManager.ResolvePlayerId(args[0], kitty => kitty.ReviveKitty());
            }
        );

        CommandsManager.RegisterCommand(
            name: "reviveto",
            alias: "rto,rposto",
            group: "admin",
            argDesc: "",
            description: "Revives your hero to an other hero, with the same facing angle.",
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
            group: "admin",
            argDesc: "",
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
            group: "admin",
            argDesc: "[player] [on][off]",
            description: "Sets whether or not to force the player to share control [default: off]",
            action: (player, args) =>
            {
                if (args.Length < 2)
                {
                    player.DisplayTimedTextTo(5.0f, $"{Colors.COLOR_YELLOW_ORANGE}Invalid arguments. Usage: sharecontrol [player] [on/off]");
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
            name: "wolfshare",
            alias: "wshare",
            group: "admin",
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
            group: "admin",
            argDesc: "",
            description: "Resets the cooldowns of the selected unit.",
            action: (player, args) => CustomStatFrame.SelectedUnit[player].ResetCooldowns()
        );

        CommandsManager.RegisterCommand(
            name: "activatechristmas",
            alias: "christmas",
            group: "admin",
            argDesc: "",
            description: "Activates the Christmas terrain.",
            action: (player, args) => SeasonalManager.ActivateChristmas()
        );

        CommandsManager.RegisterCommand(
            name: "deactivateseason",
            alias: "noseason",
            group: "admin",
            argDesc: "",
            description: "Deactivates any current seasons.",
            action: (player, args) => SeasonalManager.NoSeason()
        );

        CommandsManager.RegisterCommand(
            name: "award",
            alias: "",
            group: "admin",
            argDesc: "[name]",
            description: "Award currently selected player using award [name].",
            action: (player, args) => AwardingCmds.Awarding(player, args[0])
        );

        CommandsManager.RegisterCommand(
            name: "stat",
            alias: "",
            group: "admin",
            argDesc: "[stat] [value]",
            description: "Sets the specified game stat for the selected player.",
            action: (player, args) => AwardingCmds.SettingGameStats(player, args[0])
        );

        CommandsManager.RegisterCommand(
            name: "time",
            alias: "",
            group: "admin",
            argDesc: "[time]",
            description: "Sets the specified game time for the selected player.",
            action: (player, args) => AwardingCmds.SettingGameTimes(player, args[0])
        );

        CommandsManager.RegisterCommand(
            name: "invulnerability",
            alias: "invul,godmode,god",
            group: "admin",
            argDesc: "[player][on/off]",
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
            group: "admin",
            argDesc: "[on][off]",
            description: "Pauses all wolves. Defaults to [on]",
            action: (player, args) =>
            {
                var status = args[0] != "" ? CommandsManager.GetBool(args[0]) : true;
                Wolf.PauseAllWolves(status);
            }
        );

        CommandsManager.RegisterCommand(
            name: "wolfpause",
            alias: "wp",
            group: "admin",
            argDesc: "[on][off]",
            description: "Pauses selected wolf. Defaults to [on]",
            action: (player, args) =>
            {
                var status = args[0] != "" ? CommandsManager.GetBool(args[0]) : true;
                Wolf.PauseSelectedWolf(CustomStatFrame.SelectedUnit[player], status);
            }
        );

        CommandsManager.RegisterCommand(
            name: "wolfwalk",
            alias: "ww",
            group: "admin",
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
            group: "admin",
            argDesc: "",
            description: "Moves all kitties to the spawn location.",
            action: (player, args) =>
            {
                var spawnCenter = RegionList.SpawnRegions[1];
                foreach (var kitty in Globals.ALL_KITTIES)
                {
                    kitty.Value.Unit.SetPosition(spawnCenter.Center.X, spawnCenter.Center.Y);
                }
            }
        );

        CommandsManager.RegisterCommand(
            name: "pauseround",
            alias: "roundpause,rp",
            group: "admin",
            argDesc: "",
            description: "Pauses the round timer.",
            action: (player, args) => RoundTimer.StartRoundTimer.Pause()
        );

        CommandsManager.RegisterCommand(
            name: "unpauseround",
            alias: "roundunpause,rup",
            group: "admin",
            argDesc: "",
            description: "Unpauses the round timer.",
            action: (player, args) => RoundTimer.StartRoundTimer.Resume()
        );

        CommandsManager.RegisterCommand(
            name: "en",
            alias: "hidelanes",
            group: "admin",
            argDesc: "",
            description: "Hides the lanes.",
            action: (player, args) => WolfLaneHider.LanesHider()
        );

        CommandsManager.RegisterCommand(
            name: "applyaffixall",
            alias: "affixall,aa",
            group: "admin",
            argDesc: "[affix]",
            description: "Applies the specified affix to all wolves.",
            action: (player, args) =>
            {
                var affixName = args[0] != "" ? char.ToUpper(args[0][0]) + args[0].Substring(1).ToLower() : "Speedster";
                Console.WriteLine($"Applying {affixName} to all wolves.");
                foreach (var wolf in Globals.ALL_WOLVES)
                {
                    if (NamedWolves.DNTNamedWolves.Contains(wolf.Value)) continue;
                    var affix = AffixFactory.CreateAffix(wolf.Value, affixName);
                    wolf.Value.AddAffix(affix);
                }
            }
        );

        CommandsManager.RegisterCommand(
            name: "applyaffix",
            alias: "affix,a",
            group: "admin",
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
            group: "admin",
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
            group: "admin",
            argDesc: "",
            description: "Clears all affixes from all wolves.",
            action: (player, args) =>
            {
                foreach (var wolf in Globals.ALL_WOLVES)
                {
                    wolf.Value.RemoveAllWolfAffixes();
                }
            }
        );

        CommandsManager.RegisterCommand(
            name: "observer",
            alias: "obs",
            group: "admin",
            argDesc: "[playerNameMatch]",
            description: "Forces a player into observer mode.",
            action: (player, args) =>
            {
                var name = args[0] != "" ? args[0] : "??__";
                foreach (var p in Globals.ALL_PLAYERS)
                {
                    if (p.Name.ToLower().StartsWith(name))
                    {
                        Utility.MakePlayerSpectator(p);
                        break;
                    }
                }
            }
        );

        CommandsManager.RegisterCommand(
            name: "summonall",
            alias: "",
            group: "admin",
            argDesc: "",
            description: "Summons all players to your location.",
            action: (player, args) =>
            {
                var kitty = Globals.ALL_KITTIES[player];
                foreach (var k in Globals.ALL_KITTIES)
                {
                    if (k.Value.Unit.Owner == player) continue;
                    k.Value.Unit.SetPosition(kitty.Unit.X, kitty.Unit.Y);
                }
            }
        );

        CommandsManager.RegisterCommand(
            name: "camfield",
            alias: "",
            group: "admin",
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
            group: "admin",
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
            group: "admin",
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
            group: "admin",
            argDesc: "[abilityId]",
            description: "Adds or removes an ability from the kitty.",
            action: (player, args) =>
            {
                var abilityId = args[0] != "" ? args[0] : "";
                var kitty = Globals.ALL_KITTIES[player];
                if (GetUnitAbilityLevel(kitty.Unit, FourCC(abilityId)) > 0)
                {
                    UnitRemoveAbility(kitty.Unit, FourCC(abilityId));
                    var abilityName = GetObjectName(FourCC(abilityId));
                    player.DisplayTimedTextTo(10.0f, $"{Colors.COLOR_YELLOW_ORANGE}Removed {abilityName}.");
                }
                else
                {
                    UnitAddAbility(kitty.Unit, FourCC(abilityId));
                    var abilityName = GetObjectName(FourCC(abilityId));
                    player.DisplayTimedTextTo(10.0f, $"{Colors.COLOR_YELLOW_ORANGE}Added {abilityName}.");
                }
            }
        );

        CommandsManager.RegisterCommand(
            name: "scale",
            alias: "",
            group: "admin",
            argDesc: "[scale]",
            description: "Sets the scale of the kitty.",
            action: (player, args) =>
            {
                var scale = args[0] != "" ? float.Parse(args[0]) : 0.6f;
                var kitty = Globals.ALL_KITTIES[player];
                kitty.Unit.SetScale(scale, scale, scale);
            }
        );

        CommandsManager.RegisterCommand(
            name: "day",
            alias: "",
            group: "red",
            argDesc: "",
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
            group: "red",
            argDesc: "",
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
            group: "admin",
            argDesc: "",
            description: "Prints debug names.",
            action: (player, args) =>
            {
                _G["trackPrintMap"] = true;
                try
                {
                    DebugUtilities.DebugPrinter.PrintDebugNames("globals");
                }
                catch (Exception e)
                {
                    Console.WriteLine(e.Message);
                    Console.WriteLine(e.StackTrace);
                    throw;
                }
            }
        );

        CommandsManager.RegisterCommand(
            name: "aishare",
            alias: "",
            group: "admin",
            argDesc: "",
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
            group: "admin",
            argDesc: "",
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
            group: "admin",
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
                        new Circle(compPlayer);
                        var newKitty = new Kitty(compPlayer);
                        newKitty.Unit.AddItem(FourCC("bspd"));
                    }
                }
            }
        );

        CommandsManager.RegisterCommand(
            name: "deletehero",
            alias: "delh",
            group: "admin",
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
            group: "admin",
            argDesc: "[skinId]",
            description: "Sets the skin of the kitty.",
            action: (player, args) =>
            {
                var skin = 0;
                if (args[0] == "") skin = Constants.UNIT_KITTY;
                else skin = FourCC(args[0]);
                BlzSetUnitSkin(Globals.ALL_KITTIES[player].Unit, skin);
            }
        );

        CommandsManager.RegisterCommand(
            name: "ai",
            alias: "",
            group: "admin",
            argDesc: "[playerNumber]",
            description: "Toggles AI for the specified player.",
            action: (player, args) =>
            {
                for (var i = 0; i < 24; i++)
                {
                    int target = args.Length > 0 && args[0] != "all" ? int.Parse(args[0]) - 1 : (args.Length > 0 && args[0] == "all" ? i : -1);

                    if (target == i || args[0] == "all")
                    {
                        var compPlayer = Player(target);

                        if (!Globals.ALL_KITTIES.ContainsKey(compPlayer))
                        {
                            player.DisplayTimedTextTo(10.0f, $"{Colors.COLOR_YELLOW_ORANGE}Player does not have a hero.");
                            continue;
                        }

                        var compKitty = Globals.ALL_KITTIES[compPlayer];

                        if (compKitty.aiController.IsEnabled())
                        {
                            compKitty.aiController.StopAi();
                            player.DisplayTimedTextTo(1.0f, $"{Colors.COLOR_YELLOW}AI deactivated.");
                        }
                        else
                        {
                            compKitty.aiController.StartAi();
                            player.DisplayTimedTextTo(1.0f, $"{Colors.COLOR_YELLOW}AI activated.");
                        }
                    }
                }
            }
        );

        CommandsManager.RegisterCommand(
            name: "aisetup",
            alias: "",
            group: "admin",
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
            group: "admin",
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
            group: "admin",
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
            group: "admin",
            argDesc: "resolve playerID",
            description: "Kills urself by default, or enter name/number/selected, parm. ONLY KITTIES",
            action: (player, args) =>
            {
                if (args[0] == "")
                {
                    Globals.ALL_KITTIES[player].KillKitty();
                    return;
                }
                CommandsManager.ResolvePlayerId(args[0], kitty => kitty.KillKitty());
            }
        );

        CommandsManager.RegisterCommand(
            name: "kibblecurrency",
            alias: "kibbleinfo,kbinfo",
            group: "all",
            argDesc: "player name, #, selected, or self",
            description: "Gets the Kibble Currency information on the given player.",
            action: (player, args) =>
            {
                CommandsManager.ResolvePlayerId(args[0], kitty => AwardingCmds.GetKibbleCurrencyInfo(player, kitty));
            }
        );
    }
}
