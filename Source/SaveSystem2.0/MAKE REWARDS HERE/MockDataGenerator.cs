using System;
using System.Collections.Generic;
using WCSharp.Api;

public static class MockDataGenerator
{
    private static Random _random => Globals.RANDOM_GEN;
    private static string _sharedTournamentId;
    private static string _sharedGame1Id;
    private static string _sharedGame2Id;
    private static string _sharedGame3Id;

    // Keeps every kitty's mock alias stable for the length of a mock "session" (i.e. until
    // GenerateMockDataForAllPlayers starts a fresh one). This is what lets team correlation
    // work regardless of which order players get mock-generated in - once a kitty (whether
    // the one being generated for, or a teammate just being looked up) has an alias, everyone
    // referencing them afterwards sees the same name.
    private static readonly Dictionary<Kitty, string> _mockAliasByKitty = new();

    public static void GenerateMockSaveData(Kitty kitty, GameMode? gamemode = null)
    {
        if (kitty?.SaveData == null)
        {
            Console.WriteLine("Kitty or SaveData is null");
            return;
        }

        // If no gamemode was explicitly requested, fall back to whatever is actually running.
        var resolvedGamemode = gamemode ?? Gamemode.CurrentGameMode;

        // If generating for a single player, create new IDs
        if (string.IsNullOrEmpty(_sharedTournamentId))
        {
            _sharedTournamentId = $"MOCK_TOURNAMENT_{_random.Next(1000, 99999)}";
            _sharedGame1Id = $"GAME_1_{_random.Next(1000, 99999)}";
            _sharedGame2Id = $"GAME_2_{_random.Next(1000, 99999)}";
            _sharedGame3Id = $"GAME_3_{_random.Next(1000, 99999)}";
        }

        // Generate (or reuse this session's existing) alias up front, before anything that might
        // reference this kitty's name - including this kitty's own team roster, and before any
        // teammate looks this kitty up while building their own TeamMembers list.
        var playerName = GetOrGenerateAlias(kitty);

        GenerateMockGameStats(kitty);
        GenerateMockRoundTimes(kitty);
        GenerateMockGameTimes(kitty);
        GenerateMockPersonalBests(kitty);
        GenerateMockCurrency(kitty);
        GenerateMockTournamentStats(kitty, resolvedGamemode, playerName);
        GenerateMockRewards(kitty);

        kitty.SaveData.Date = DateTimeManager.DateTime.ToString();

        Console.WriteLine($"{Colors.COLOR_GOLD}Mock save data generated for {kitty.SaveData.PlayerName}!{Colors.COLOR_RESET}");
    }

    /// <summary>
    /// Returns this kitty's mock alias for the current session, generating one (and applying it
    /// to Player.Name / SaveData.PlayerName) the first time it's needed - whether that's because
    /// this kitty is the one being mock-generated, or because a teammate is looking it up while
    /// building a TeamMembers list. Once assigned, the alias stays fixed until the session resets
    /// (see GenerateMockDataForAllPlayers), so every teammate's roster stays correlated.
    /// </summary>
    private static string GetOrGenerateAlias(Kitty kitty)
    {
        if (_mockAliasByKitty.TryGetValue(kitty, out var existing))
        {
            return existing;
        }

        var alias = GenerateFantasyName() + "#" + _random.Next(1000, 99999); // Add random number for uniqueness
        _mockAliasByKitty[kitty] = alias;

        kitty.SaveData.PlayerName = alias;
        kitty.Player.Name = alias;

        return alias;
    }

    private static readonly string[] Start =
    {
        "Ar","El","Li","Ka","Ma","Sa","Va","Cor","Ren","Jo",
        "Ta","Mi","Lo","Se","Fa","Da","Ri","Na","Ke","Tor"
    };

    private static readonly string[] Middle =
    {
        "ri","len","var","mir","dan","lor","ven","thal","rin","mar",
        "sol","der","ion","rel","nor","vyn","las","dor","ian","eth"
    };

    private static readonly string[] End =
    {
        "", "a", "en", "on", "is", "ar", "or", "in", "el", "us"
    };

    public static string GenerateFantasyName()
    {
        return Start[_random.Next(Start.Length)]
             + Middle[_random.Next(Middle.Length)]
             + End[_random.Next(End.Length)];
    }

    private static void GenerateMockGameStats(Kitty kitty)
    {
        var stats = kitty.SaveData.GameStats;

        stats.Saves = _random.Next(50, 500);
        stats.SaveStreak = _random.Next(0, 10);
        stats.HighestSaveStreak = _random.Next(stats.SaveStreak, 25);
        stats.NitrosObtained = _random.Next(20, 200);
        stats.Deaths = _random.Next(100, 2000);
        stats.WinStreak = _random.Next(0, 10);
        stats.HighestWinStreak = _random.Next(stats.WinStreak, 20);
        stats.NormalWins = _random.Next(10, 100);
        stats.HardWins = _random.Next(5, 50);
        stats.ImpossibleWins = _random.Next(0, 20);
        stats.NormalGames = stats.NormalWins + _random.Next(10, 50);
        stats.HardGames = stats.HardWins + _random.Next(5, 30);
        stats.ImpossibleGames = stats.ImpossibleWins + _random.Next(0, 30);
        stats.NightmareGames = _random.Next(0, 20);
        stats.NightmareWins = _random.Next(0, stats.NightmareGames);
        stats.ProgressiveGames = _random.Next(5, 50);
        stats.ProgressiveWins = _random.Next(0, stats.ProgressiveGames);
    }

    private static void GenerateMockRoundTimes(Kitty kitty)
    {
        var roundTimes = kitty.SaveData.RoundTimes;

        // Normal round times
        roundTimes.RoundOneNormal = 40f + (float)(_random.NextDouble() * 20);
        roundTimes.RoundTwoNormal = 70f + (float)(_random.NextDouble() * 30);
        roundTimes.RoundThreeNormal = 100f + (float)(_random.NextDouble() * 40);
        roundTimes.RoundFourNormal = 130f + (float)(_random.NextDouble() * 50);
        roundTimes.RoundFiveNormal = 140f + (float)(_random.NextDouble() * 60);

        // Hard round times
        roundTimes.RoundOneHard = 35f + (float)(_random.NextDouble() * 15);
        roundTimes.RoundTwoHard = 60f + (float)(_random.NextDouble() * 25);
        roundTimes.RoundThreeHard = 85f + (float)(_random.NextDouble() * 35);
        roundTimes.RoundFourHard = 110f + (float)(_random.NextDouble() * 45);
        roundTimes.RoundFiveHard = 120f + (float)(_random.NextDouble() * 55);

        // Impossible round times
        roundTimes.RoundOneImpossible = 30f + (float)(_random.NextDouble() * 12);
        roundTimes.RoundTwoImpossible = 55f + (float)(_random.NextDouble() * 20);
        roundTimes.RoundThreeImpossible = 75f + (float)(_random.NextDouble() * 30);
        roundTimes.RoundFourImpossible = 95f + (float)(_random.NextDouble() * 40);
        roundTimes.RoundFiveImpossible = 100f + (float)(_random.NextDouble() * 50);

        // Solo round times
        roundTimes.RoundOneSolo = 38f + (float)(_random.NextDouble() * 18);
        roundTimes.RoundTwoSolo = 68f + (float)(_random.NextDouble() * 28);
        roundTimes.RoundThreeSolo = 98f + (float)(_random.NextDouble() * 38);
        roundTimes.RoundFourSolo = 128f + (float)(_random.NextDouble() * 48);
        roundTimes.RoundFiveSolo = 138f + (float)(_random.NextDouble() * 58);

        // Nightmare round times
        roundTimes.RoundOneNightmare = 25f + (float)(_random.NextDouble() * 10);
        roundTimes.RoundTwoNightmare = 50f + (float)(_random.NextDouble() * 15);
        roundTimes.RoundThreeNightmare = 65f + (float)(_random.NextDouble() * 25);
        roundTimes.RoundFourNightmare = 80f + (float)(_random.NextDouble() * 35);
        roundTimes.RoundFiveNightmare = 80f + (float)(_random.NextDouble() * 45);

        // Progressive round times (only 3 rounds)
        roundTimes.RoundOneProgressive = 40f + (float)(_random.NextDouble() * 15);
        roundTimes.RoundTwoProgressive = 75f + (float)(_random.NextDouble() * 25);
        roundTimes.RoundThreeProgressive = 135f + (float)(_random.NextDouble() * 40);
    }

    private static void GenerateMockGameTimes(Kitty kitty)
    {
        var times = kitty.SaveData.BestGameTimes;
        string mockDate = DateTimeManager.DateTime.ToString();

        // Normal Game Times
        times.NormalGameTime.Date = mockDate;
        times.NormalGameTime.TeamMembers = "Mock Player 1, Mock Player 2";
        times.NormalGameTime.RoundOneTime = 40f + (float)(_random.NextDouble() * 20);
        times.NormalGameTime.RoundTwoTime = 70f + (float)(_random.NextDouble() * 30);
        times.NormalGameTime.RoundThreeTime = 100f + (float)(_random.NextDouble() * 40);
        times.NormalGameTime.RoundFourTime = 130f + (float)(_random.NextDouble() * 50);
        times.NormalGameTime.RoundFiveTime = 140f + (float)(_random.NextDouble() * 60);
        times.NormalGameTime.Time = times.NormalGameTime.RoundOneTime + times.NormalGameTime.RoundTwoTime +
                                     times.NormalGameTime.RoundThreeTime + times.NormalGameTime.RoundFourTime +
                                     times.NormalGameTime.RoundFiveTime;

        // Hard Game Times
        times.HardGameTime.Date = mockDate;
        times.HardGameTime.TeamMembers = "Mock Player 1";
        times.HardGameTime.RoundOneTime = 35f + (float)(_random.NextDouble() * 15);
        times.HardGameTime.RoundTwoTime = 60f + (float)(_random.NextDouble() * 25);
        times.HardGameTime.RoundThreeTime = 85f + (float)(_random.NextDouble() * 35);
        times.HardGameTime.RoundFourTime = 110f + (float)(_random.NextDouble() * 45);
        times.HardGameTime.RoundFiveTime = 120f + (float)(_random.NextDouble() * 55);
        times.HardGameTime.Time = times.HardGameTime.RoundOneTime + times.HardGameTime.RoundTwoTime +
                                  times.HardGameTime.RoundThreeTime + times.HardGameTime.RoundFourTime +
                                  times.HardGameTime.RoundFiveTime;

        // Impossible Game Times
        times.ImpossibleGameTime.Date = mockDate;
        times.ImpossibleGameTime.TeamMembers = "Mock Player 1";
        times.ImpossibleGameTime.RoundOneTime = 30f + (float)(_random.NextDouble() * 12);
        times.ImpossibleGameTime.RoundTwoTime = 55f + (float)(_random.NextDouble() * 20);
        times.ImpossibleGameTime.RoundThreeTime = 75f + (float)(_random.NextDouble() * 30);
        times.ImpossibleGameTime.RoundFourTime = 95f + (float)(_random.NextDouble() * 40);
        times.ImpossibleGameTime.RoundFiveTime = 100f + (float)(_random.NextDouble() * 50);
        times.ImpossibleGameTime.Time = times.ImpossibleGameTime.RoundOneTime + times.ImpossibleGameTime.RoundTwoTime +
                                        times.ImpossibleGameTime.RoundThreeTime + times.ImpossibleGameTime.RoundFourTime +
                                        times.ImpossibleGameTime.RoundFiveTime;

        // Nightmare Game Times
        times.NightmareGameTime.Date = mockDate;
        times.NightmareGameTime.TeamMembers = "Mock Player 1, Mock Player 2, Mock Player 3";
        times.NightmareGameTime.RoundOneTime = 25f + (float)(_random.NextDouble() * 10);
        times.NightmareGameTime.RoundTwoTime = 50f + (float)(_random.NextDouble() * 15);
        times.NightmareGameTime.RoundThreeTime = 65f + (float)(_random.NextDouble() * 25);
        times.NightmareGameTime.RoundFourTime = 80f + (float)(_random.NextDouble() * 35);
        times.NightmareGameTime.RoundFiveTime = 80f + (float)(_random.NextDouble() * 45);
        times.NightmareGameTime.Time = times.NightmareGameTime.RoundOneTime + times.NightmareGameTime.RoundTwoTime +
                                       times.NightmareGameTime.RoundThreeTime + times.NightmareGameTime.RoundFourTime +
                                       times.NightmareGameTime.RoundFiveTime;

        // Progressive Game Times
        times.ProgressiveGameTime.Date = mockDate;
        times.ProgressiveGameTime.TeamMembers = "Mock Player 1";
        times.ProgressiveGameTime.RoundOneTime = 40f + (float)(_random.NextDouble() * 15);
        times.ProgressiveGameTime.RoundTwoTime = 75f + (float)(_random.NextDouble() * 25);
        times.ProgressiveGameTime.RoundThreeTime = 135f + (float)(_random.NextDouble() * 40);
        times.ProgressiveGameTime.Time = times.ProgressiveGameTime.RoundOneTime + times.ProgressiveGameTime.RoundTwoTime +
                                         times.ProgressiveGameTime.RoundThreeTime;
    }

    private static void GenerateMockPersonalBests(Kitty kitty)
    {
        var bests = kitty.SaveData.PersonalBests;

        bests.Saves = _random.Next(10, 100);
        bests.Deaths = _random.Next(0, 10);
        bests.Score = _random.Next(1000, 10000);
        bests.KibbleCollected = _random.Next(50, 300);
    }

    private static void GenerateMockCurrency(Kitty kitty)
    {
        var currency = kitty.SaveData.KibbleCurrency;

        currency.Collected = _random.Next(100, 10000);
        currency.Jackpots = _random.Next(5, 50);
        currency.SuperJackpots = _random.Next(0, 10);
    }

    private static void GenerateMockTournamentStats(Kitty kitty, GameMode gamemode, string aliasName)
    {
        var tournamentStats = kitty.SaveData.TournamentStats;

        // Use shared tournament and game IDs
        tournamentStats.Tournament_ID = _sharedTournamentId;
        tournamentStats.AdminApproved = 1;
        tournamentStats.PlayerName = aliasName;
        tournamentStats.Region = "NA";
        tournamentStats.Gamemode = gamemode.ToString();
        tournamentStats.GameType = "Race";
        tournamentStats.DateTime = DateTimeManager.DateTime.ToString();

        // Game 1 - Generate round data that sums properly
        GenerateMockTournamentGame(kitty, tournamentStats.Game_1, 1, _sharedGame1Id, gamemode, aliasName);

        // Game 2
        GenerateMockTournamentGame(kitty, tournamentStats.Game_2, 2, _sharedGame2Id, gamemode, aliasName);

        // Game 3
        GenerateMockTournamentGame(kitty, tournamentStats.Game_3, 3, _sharedGame3Id, gamemode, aliasName);
    }

    private static void GenerateMockTournamentGame(Kitty kitty, TournamentGameData gameData, int gameNumber, string gameId, GameMode gamemode, string aliasName)
    {
        gameData.Game_ID = gameId;
        SetGameTeamInfo(kitty, gameData, gamemode, aliasName);

        // Generate round times
        float round1Time = 40f + (float)(_random.NextDouble() * 20);
        float round2Time = 70f + (float)(_random.NextDouble() * 30);
        float round3Time = 100f + (float)(_random.NextDouble() * 40);
        float round4Time = 130f + (float)(_random.NextDouble() * 50);
        float round5Time = 140f + (float)(_random.NextDouble() * 60);

        // Round 1
        gameData.Round_1.RoundTime = round1Time;
        gameData.Round_1.Progress = 20f;
        gameData.Round_1.Saves = _random.Next(1, 5);
        gameData.Round_1.Deaths = _random.Next(0, 3);
        gameData.Round_1.Level = _random.Next(1, 3);

        // Round 2
        gameData.Round_2.RoundTime = round2Time;
        gameData.Round_2.Progress = 20f;
        gameData.Round_2.Saves = _random.Next(1, 5);
        gameData.Round_2.Deaths = _random.Next(0, 3);
        gameData.Round_2.Level = _random.Next(3, 5);

        // Round 3
        gameData.Round_3.RoundTime = round3Time;
        gameData.Round_3.Progress = 20f;
        gameData.Round_3.Saves = _random.Next(1, 5);
        gameData.Round_3.Deaths = _random.Next(0, 3);
        gameData.Round_3.Level = _random.Next(5, 7);

        // Round 4
        gameData.Round_4.RoundTime = round4Time;
        gameData.Round_4.Progress = 20f;
        gameData.Round_4.Saves = _random.Next(1, 5);
        gameData.Round_4.Deaths = _random.Next(0, 3);
        gameData.Round_4.Level = _random.Next(7, 9);

        // Round 5
        gameData.Round_5.RoundTime = round5Time;
        gameData.Round_5.Progress = 20f;
        gameData.Round_5.Saves = _random.Next(1, 5);
        gameData.Round_5.Deaths = _random.Next(0, 2);
        gameData.Round_5.Level = _random.Next(9, 11);

        // Set totals (properly aligned)
        gameData.TotalTime = round1Time + round2Time + round3Time + round4Time + round5Time;
        gameData.TotalProgress = 100f; // 5 rounds * 20% each
        gameData.TotalSaves = gameData.Round_1.Saves + gameData.Round_2.Saves + gameData.Round_3.Saves +
                              gameData.Round_4.Saves + gameData.Round_5.Saves;
        gameData.TotalDeaths = gameData.Round_1.Deaths + gameData.Round_2.Deaths + gameData.Round_3.Deaths +
                               gameData.Round_4.Deaths + gameData.Round_5.Deaths;
    }

    /// <summary>
    /// Sets the Team and TeamMembers fields on a mock tournament game. For Team mode this
    /// pulls the kitty's actual team color from TeamRegistry and builds TeamMembers out of
    /// each teammate's mock alias (generating one on the fly for any teammate that hasn't
    /// been mock-generated yet), so the roster always shows fake names correlated across the
    /// whole team instead of real WC3 player names/slots; other gamemodes get simple
    /// placeholder values.
    /// </summary>
    private static void SetGameTeamInfo(Kitty kitty, TournamentGameData gameData, GameMode gamemode, string aliasName)
    {
        if (gamemode == GameMode.Team)
        {
            if (TeamRegistry.TryGetTeamForPlayer(kitty.Player, out var team))
            {
                gameData.Team = TeamRegistry.GetTeamColor(kitty);
                gameData.TeamMembers = BuildTeamMemberAliases(team);
                return;
            }

            // Kitty isn't actually on a registered team (e.g. Team mode isn't currently
            // active), so fall back to a placeholder instead of leaving these blank.
            Console.WriteLine($"{Colors.COLOR_YELLOW_ORANGE}Mock data: {aliasName} has no registered team, using placeholder team info.{Colors.COLOR_RESET}");
            gameData.Team = "Team Mock";
            gameData.TeamMembers = aliasName;
            return;
        }

        gameData.Team = gamemode == GameMode.Solo ? "Solo" : gamemode.ToString();
        gameData.TeamMembers = aliasName;
    }

    /// <summary>
    /// Builds the comma-separated TeamMembers string for a team, using each member's mock
    /// alias (see GetOrGenerateAlias) rather than their live player name.
    /// </summary>
    private static string BuildTeamMemberAliases(Team team)
    {
        var names = new List<string>(team.Teammembers.Count);
        foreach (var member in team.Teammembers)
        {
            names.Add(GetOrGenerateAlias(member));
        }
        return string.Join(", ", names);
    }

    private static void GenerateMockRewards(Kitty kitty)
    {
        var rewards = kitty.SaveData.GameAwardsSorted;

        // Auras - randomly unlock some (0 = locked, 1 = unlocked)
        rewards.Auras.SpecialAura = _random.Next(0, 2);
        rewards.Auras.StarlightAura = _random.Next(0, 2);
        rewards.Auras.ManaAura = _random.Next(0, 2);
        rewards.Auras.SpectacularAura = _random.Next(0, 2);
        rewards.Auras.ButterflyAura = _random.Next(0, 2);
        rewards.Auras.FreezeAura = _random.Next(0, 2);
        rewards.Auras.ChainedImpossibleAura = _random.Next(0, 2);
        rewards.Auras.ChainedNightmareAura = _random.Next(0, 2);
        rewards.Auras.ChainedHardAura = _random.Next(0, 2);
        rewards.Auras.ChainedNormalAura = _random.Next(0, 2);

        // Hats
        rewards.Hats.Bandana = _random.Next(0, 2);
        rewards.Hats.PirateHat = _random.Next(0, 2);
        rewards.Hats.ChefHat = _random.Next(0, 2);
        rewards.Hats.TikiMask = _random.Next(0, 2);
        rewards.Hats.SamuraiHelm = _random.Next(0, 2);
        rewards.Hats.SantaHat = _random.Next(0, 2);

        // Nitros
        rewards.Nitros.Nitro = _random.Next(0, 2);
        rewards.Nitros.NitroBlue = _random.Next(0, 2);
        rewards.Nitros.NitroRed = _random.Next(0, 2);
        rewards.Nitros.NitroGreen = _random.Next(0, 2);
        rewards.Nitros.NitroPurple = _random.Next(0, 2);
        rewards.Nitros.DivineLight = _random.Next(0, 2);
        rewards.Nitros.CrimsonLight = _random.Next(0, 2);
        rewards.Nitros.AzureLight = _random.Next(0, 2);
        rewards.Nitros.VioletLight = _random.Next(0, 2);
        rewards.Nitros.EmeraldLight = _random.Next(0, 2);
        rewards.Nitros.PatrioticLight = _random.Next(0, 2);

        // Skins
        rewards.Skins.UndeadKitty = _random.Next(0, 2);
        rewards.Skins.HighelfKitty = _random.Next(0, 2);
        rewards.Skins.AstralKitty = _random.Next(0, 2);
        rewards.Skins.SatyrKitty = _random.Next(0, 2);
        rewards.Skins.AncientKitty = _random.Next(0, 2);
        rewards.Skins.ZandalariKitty = _random.Next(0, 2);
        rewards.Skins.HuntressKitty = _random.Next(0, 2);
        rewards.Skins.KibbleSkin = _random.Next(0, 2) == 1 ? 1 : -1;

        // Trails
        rewards.Trails.PurpleFire = _random.Next(0, 2);
        rewards.Trails.BlueFire = _random.Next(0, 2);
        rewards.Trails.TurquoiseFire = _random.Next(0, 2);
        rewards.Trails.PinkFire = _random.Next(0, 2);
        rewards.Trails.WhiteFire = _random.Next(0, 2);
        rewards.Trails.BlueLightning = _random.Next(0, 2);
        rewards.Trails.RedLightning = _random.Next(0, 2);
        rewards.Trails.PurpleLightning = _random.Next(0, 2);
        rewards.Trails.YellowLightning = _random.Next(0, 2);
        rewards.Trails.GreenLightning = _random.Next(0, 2);
        rewards.Trails.SnowTrail2023 = _random.Next(0, 2);

        // Windwalks
        rewards.Windwalks.WWBlood = _random.Next(0, 2);
        rewards.Windwalks.WWBlue = _random.Next(0, 2);
        rewards.Windwalks.WWFire = _random.Next(0, 2);
        rewards.Windwalks.WWNecro = _random.Next(0, 2);
        rewards.Windwalks.WWSwift = _random.Next(0, 2);
        rewards.Windwalks.WWViolet = _random.Next(0, 2);
        rewards.Windwalks.WWDivine = _random.Next(0, 2);

        // Tournament
        rewards.Tournament.TurquoiseNitro = _random.Next(0, 2);
        rewards.Tournament.TurquoiseWings = _random.Next(0, 2);
        rewards.Tournament.VioletWings = _random.Next(0, 2);
        rewards.Tournament.VioletAura = _random.Next(0, 2);
        rewards.Tournament.PenguinSkin = _random.Next(0, 2);
        rewards.Tournament.LightningSpeed = _random.Next(0, 2) == 1 ? 1 : -1;

        // Deathless
        rewards.Deathless.NormalDeathless1 = _random.Next(0, 2);
        rewards.Deathless.NormalDeathless2 = _random.Next(0, 2);
        rewards.Deathless.NormalDeathless3 = _random.Next(0, 2);
        rewards.Deathless.NormalDeathless4 = _random.Next(0, 2);
        rewards.Deathless.NormalDeathless5 = _random.Next(0, 2);
        rewards.Deathless.HardDeathless1 = _random.Next(0, 2) == 1 ? 1 : -1;
        rewards.Deathless.HardDeathless2 = _random.Next(0, 2) == 1 ? 1 : -1;
        rewards.Deathless.HardDeathless3 = _random.Next(0, 2) == 1 ? 1 : -1;
        rewards.Deathless.HardDeathless4 = _random.Next(0, 2) == 1 ? 1 : -1;
        rewards.Deathless.HardDeathless5 = _random.Next(0, 2) == 1 ? 1 : -1;
        rewards.Deathless.ImpossibleDeathless1 = _random.Next(0, 2) == 1 ? 1 : -1;
        rewards.Deathless.ImpossibleDeathless2 = _random.Next(0, 2) == 1 ? 1 : -1;
        rewards.Deathless.ImpossibleDeathless3 = _random.Next(0, 2) == 1 ? 1 : -1;
        rewards.Deathless.ImpossibleDeathless4 = _random.Next(0, 2) == 1 ? 1 : -1;
        rewards.Deathless.ImpossibleDeathless5 = _random.Next(0, 2) == 1 ? 1 : -1;
        rewards.Deathless.NormalTeamDeathless = _random.Next(0, 2);
        rewards.Deathless.HardTeamDeathless = _random.Next(0, 2);
        rewards.Deathless.ImpossibleTeamDeathless = _random.Next(0, 2);

        // Wings
        rewards.Wings.PhoenixWings = _random.Next(0, 2);
        rewards.Wings.FairyWings = _random.Next(0, 2);
        rewards.Wings.NightmareWings = _random.Next(0, 2);
        rewards.Wings.ArchangelWings = _random.Next(0, 2);
        rewards.Wings.VoidWings = _random.Next(0, 2);
        rewards.Wings.CosmicWings = _random.Next(0, 2);
        rewards.Wings.ChaosWings = _random.Next(0, 2);
        rewards.Wings.PinkWings = _random.Next(0, 2);
        rewards.Wings.NatureWings = _random.Next(0, 2);
        rewards.Wings.RedTendrils = _random.Next(0, 2);
        rewards.Wings.WhiteTendrils = _random.Next(0, 2);
        rewards.Wings.DivinityTendrils = _random.Next(0, 2);
        rewards.Wings.GreenTendrils = _random.Next(0, 2);
        rewards.Wings.PatrioticTendrils = _random.Next(0, 2);
        rewards.Wings.SnowWings2023 = _random.Next(0, 2);
    }

    public static void GenerateMockDataForAllPlayers(GameMode? gamemode = null)
    {
        // Generate shared IDs for the tournament and games
        _sharedTournamentId = $"MOCK_TOURNAMENT_{_random.Next(1000, 99999)}";
        _sharedGame1Id = $"GAME_1_{_random.Next(1000, 99999)}";
        _sharedGame2Id = $"GAME_2_{_random.Next(1000, 99999)}";
        _sharedGame3Id = $"GAME_3_{_random.Next(1000, 99999)}";

        // Fresh session, fresh aliases for everyone.
        _mockAliasByKitty.Clear();

        foreach (var kitty in Globals.ALL_KITTIES_LIST)
        {
            GenerateMockSaveData(kitty, gamemode);
        }
        Console.WriteLine($"{Colors.COLOR_GOLD}Mock save data generated for all players!{Colors.COLOR_RESET}");
    }
}
