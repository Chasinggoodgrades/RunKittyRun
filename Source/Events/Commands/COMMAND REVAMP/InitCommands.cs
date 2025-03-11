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
            name: "test3",
            alias: "",
            group: "admin",
            argDesc: "",
            description: "Memory Handler Test",
            action: (player, args) =>
            {
                MemoryHandlerTest.PeriodicTest();
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
            name: "hidenames",
            alias: "hn",
            group: "all",
            argDesc: "",
            description: "Hide all floating name tags.",
            action: (player, args) => FloatingNameTag.HideAllNameTags(player)
        );

        CommandsManager.RegisterCommand(
            name: "shownames",
            alias: "sn",
            group: "all",
            argDesc: "",
            description: "Show all floating name tags.",
            action: (player, args) => FloatingNameTag.ShowAllNameTags(player)
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
                if (args.Length == 0)
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
            action: (player, args) => player.DisplayTimedTextTo(10.0f, UnitOrders.CalculateAllAPM())
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
                foreach (var playerx in Kibble.PickedUpKibble)
                {
                    if (playerx.Value == 0) continue;
                    kibbleList += $"{Colors.PlayerNameColored(playerx.Key)}: {playerx.Value}\n";
                }
                player.DisplayTimedTextTo(7.0f, $"{Colors.COLOR_GOLD}Kibble Collected:\n{kibbleList}");
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
                var glow = CommandsManager.IsBool(args[0]) != true || bool.Parse(args[0]);
                BlzShowUnitTeamGlow(Globals.ALL_KITTIES[player].Unit, glow);
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
                float speed = args.Length > 0 ? float.Parse(args[0]) : 0;
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
                _ = kitty.Unit.AddItem(FourCC("desc"));
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
                var difficulty = args.Length > 0 ? args[0] : "normal";
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
                if (args.Length == 0)
                {
                    Globals.ALL_KITTIES[player].ReviveKitty();
                    return;
                }
                CommandsManager.ResolvePlayerId(args[0], kitty => kitty.ReviveKitty());
            }
        );

        CommandsManager.RegisterCommand(
            name: "sharecontrol",
            alias: "share",
            group: "admin",
            argDesc: "",
            description: "Forces everyone to share control with you.",
            action: (player, args) =>
            {
                foreach (var p in Globals.ALL_PLAYERS)
                {
                    p.SetAlliance(player, ALLIANCE_SHARED_CONTROL, true);
                }
            }
        );

        CommandsManager.RegisterCommand(
            name: "wolfshare",
            alias: "wshare",
            group: "admin",
            argDesc: "",
            description: "Gives you control of all the wolves.",
            action: (player, args) =>
            {
                player.NeutralAggressive.SetAlliance(player, ALLIANCE_SHARED_CONTROL, true);
                player.NeutralExtra.SetAlliance(player, ALLIANCE_SHARED_CONTROL, true);
                player.NeutralPassive.SetAlliance(player, ALLIANCE_SHARED_CONTROL, true);
                player.NeutralVictim.SetAlliance(player, ALLIANCE_SHARED_CONTROL, true);

                for (var i = 0; i < 24; i++)
                {
                    var p = Player(i);
                    if (p.SlotState != playerslotstate.Playing)
                    {
                        p.SetAlliance(player, ALLIANCE_SHARED_CONTROL, true);
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
            name: "showcollision",
            alias: "col",
            group: "admin",
            argDesc: "",
            description: "Displays the current collision value.",
            action: (player, args) =>
            {
                var collisionValue = CollisionDetection.KITTY_COLLISION_RADIUS[player];
                player.DisplayTextTo($"Current Collision Value: {collisionValue}");
            }
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
            alias: "invul",
            group: "admin",
            argDesc: "[on/off]",
            description: "Gives invulnerability.",
            action: (player, args) =>
            {
                var setting = CommandsManager.IsBool(args[0]) != true || bool.Parse(args[0]);
                var kitty = Globals.ALL_KITTIES[player];
                if (setting)
                {
                    UnitWithinRange.DeRegisterUnitWithinRangeUnit(kitty.Unit);
                }
                else
                {
                    CollisionDetection.KittyRegisterCollisions(kitty);
                }
            }
        );

        CommandsManager.RegisterCommand(
            name: "pausewolves",
            alias: "pw,pause",
            group: "admin",
            argDesc: "",
            description: "Pauses all wolves.",
            action: (player, args) => Wolf.PauseAllWolves(true)
        );

        CommandsManager.RegisterCommand(
            name: "unpausewolves",
            alias: "uw,unpause",
            group: "admin",
            argDesc: "",
            description: "Unpauses all wolves.",
            action: (player, args) => Wolf.PauseAllWolves(false)
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
                var affixName = args.Length > 0 ? char.ToUpper(args[0][0]) + args[0].Substring(1).ToLower() : "Speedster";
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
                var affixName = args.Length > 0 ? char.ToUpper(args[0][0]) + args[0].Substring(1).ToLower() : "Speedster";
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
                var affixName = args.Length > 0 ? char.ToUpper(args[0][0]) + args[0].Substring(1).ToLower() : "";
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
                var name = args.Length > 0 ? args[0] : "??__";
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
                var value = args.Length > 0 ? float.Parse(args[0]) : 0.0f;
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
                var round = args.Length > 0 ? int.Parse(args[0]) : 1;
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
                var endValue = args.Length > 0 ? args[0] : "off";
                if (endValue == "on") Gameover.NoEnd = true;
                else if (endValue == "off") Gameover.NoEnd = false;
                player.DisplayTimedTextTo(1.0f, $"{Colors.COLOR_YELLOW}Game will {(endValue == "on" ? "no longer" : "")} end");
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
                var abilityId = args.Length > 0 ? args[0] : "";
                var kitty = Globals.ALL_KITTIES[player];
                if (GetUnitAbilityLevel(kitty.Unit, FourCC(abilityId)) > 0)
                {
                    _ = UnitRemoveAbility(kitty.Unit, FourCC(abilityId));
                    var abilityName = GetObjectName(FourCC(abilityId));
                    player.DisplayTimedTextTo(10.0f, $"{Colors.COLOR_YELLOW_ORANGE}Removed {abilityName}.");
                }
                else
                {
                    _ = UnitAddAbility(kitty.Unit, FourCC(abilityId));
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
                var scale = args.Length > 0 ? float.Parse(args[0]) : 0.6f;
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
                var script = args.Length > 0 ? string.Join(" ", args) : "";
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
                        _ = new Circle(compPlayer);
                        var newKitty = new Kitty(compPlayer);
                        _ = newKitty.Unit.AddItem(FourCC("bspd"));
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

                        if (player.SlotState == playerslotstate.Playing)
                        {
                            player.DisplayTimedTextTo(10.0f, $"{Colors.COLOR_YELLOW_ORANGE}Player is not a computer.");
                            continue;
                        }

                        _ = Globals.ALL_PLAYERS.Remove(compPlayer);

                        var compKitty = Globals.ALL_KITTIES[compPlayer];
                        compKitty?.Dispose();
                    }
                }
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
                var skin = args.Length > 0 ? FourCC(args[0]) : Constants.UNIT_KITTY;
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
            argDesc: "[dodgeRadius] [reviveRadius] [timerInterval]",
            description: "Sets up AI parameters.",
            action: (player, args) =>
            {
                if (args.Length == 0)
                {
                    player.DisplayTimedTextTo(10.0f, $"{Colors.COLOR_YELLOW_ORANGE}Usage: aisetup [dodgeRadius=160] [reviveRadius=1024] [timerInterval=0.2]");
                    return;
                }

                var dodgeRadius = args.Length > 0 ? float.Parse(args[0]) : 160.0f;
                var reviveRadius = args.Length > 1 ? float.Parse(args[1]) : 1024.0f;
                var timerInterval = args.Length > 2 ? float.Parse(args[2]) : 0.2f;

                foreach (var compKitty in Globals.ALL_KITTIES)
                {
                    if (compKitty.Value.aiController.IsEnabled())
                    {
                        compKitty.Value.aiController.DODGE_RADIUS = dodgeRadius;
                        compKitty.Value.aiController.REVIVE_RADIUS = reviveRadius;
                        compKitty.Value.aiController.timerInterval = timerInterval;
                    }
                }

                player.DisplayTimedTextTo(10.0f, $"{Colors.COLOR_YELLOW}AI setup: dodgeRadius={dodgeRadius}, reviveRadius={reviveRadius}, timerInterval={timerInterval}");
            }
        );

    }
}
