using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;

public class Program2
{
    public enum StatTypes
    {
        Saves,
        Deaths,
        NormalGames,
        HardGames,
        ImpossibleGames,
        HighestSaveStreak,
        HighestWinStreak,
        NormalWins,
        HardWins,
        ImpossibleWins
    }

    public enum RoundTimes
    {
        RoundOneNormal,
        RoundTwoNormal,
        RoundThreeNormal,
        RoundFourNormal,
        RoundFiveNormal,
        RoundOneHard,
        RoundTwoHard,
        RoundThreeHard,
        RoundFourHard,
        RoundFiveHard,
        RoundOneImpossible,
        RoundTwoImpossible,
        RoundThreeImpossible,
        RoundFourImpossible,
        RoundFiveImpossible,
        RoundOneSolo,
        RoundTwoSolo,
        RoundThreeSolo,
        RoundFourSolo,
        RoundFiveSolo
    }

    public static void StartSomething()
    {
        // Mock data for demonstration
        string battletag = "exampleTag";
        var gameStats = new Dictionary<StatTypes, int>
        {
            { StatTypes.Saves, 100 },
            { StatTypes.Deaths, 50 },
            { StatTypes.NormalGames, 20 },
            { StatTypes.HardGames, 15 },
            { StatTypes.ImpossibleGames, 5 },
            { StatTypes.HighestSaveStreak, 10 },
            { StatTypes.HighestWinStreak, 8 },
            { StatTypes.NormalWins, 18 },
            { StatTypes.HardWins, 12 },
            { StatTypes.ImpossibleWins, 3 }
        };

        var roundTimes = new Dictionary<RoundTimes, double>
        {
            { RoundTimes.RoundOneNormal, 120.5 },
            { RoundTimes.RoundTwoNormal, 110.3 },
            { RoundTimes.RoundThreeNormal, 130.1 },
            { RoundTimes.RoundFourNormal, 140.0 },
            { RoundTimes.RoundFiveNormal, 150.2 },
            { RoundTimes.RoundOneHard, 160.5 },
            { RoundTimes.RoundTwoHard, 170.3 },
            { RoundTimes.RoundThreeHard, 180.1 },
            { RoundTimes.RoundFourHard, 190.0 },
            { RoundTimes.RoundFiveHard, 200.2 },
            { RoundTimes.RoundOneImpossible, 210.5 },
            { RoundTimes.RoundTwoImpossible, 220.3 },
            { RoundTimes.RoundThreeImpossible, 230.1 },
            { RoundTimes.RoundFourImpossible, 240.0 },
            { RoundTimes.RoundFiveImpossible, 250.2 },
            { RoundTimes.RoundOneSolo, 260.5 },
            { RoundTimes.RoundTwoSolo, 270.3 },
            { RoundTimes.RoundThreeSolo, 280.1 },
            { RoundTimes.RoundFourSolo, 290.0 },
            { RoundTimes.RoundFiveSolo, 300.2 }
        };

        var statColumnMap = new Dictionary<StatTypes, string>
        {
            { StatTypes.Saves, "Saves" },
            { StatTypes.Deaths, "Deaths" },
            { StatTypes.NormalGames, "Normal Games" },
            { StatTypes.HardGames, "Hard Games" },
            { StatTypes.ImpossibleGames, "Impossible Games" },
            { StatTypes.HighestSaveStreak, "Highest Save Streak" },
            { StatTypes.HighestWinStreak, "Highest Win Streak" },
            { StatTypes.NormalWins, "Normal Wins" },
            { StatTypes.HardWins, "Hard Wins" },
            { StatTypes.ImpossibleWins, "Impossible Wins" }
        };

        var roundTimeColumnMap = new Dictionary<RoundTimes, string>
        {
            { RoundTimes.RoundOneNormal, "Round 1 Time : Normal" },
            { RoundTimes.RoundTwoNormal, "Round 2 Time : Normal" },
            { RoundTimes.RoundThreeNormal, "Round 3 Time : Normal" },
            { RoundTimes.RoundFourNormal, "Round 4 Time : Normal" },
            { RoundTimes.RoundFiveNormal, "Round 5 Time : Normal" },
            { RoundTimes.RoundOneHard, "Round 1 Time : Hard" },
            { RoundTimes.RoundTwoHard, "Round 2 Time : Hard" },
            { RoundTimes.RoundThreeHard, "Round 3 Time : Hard" },
            { RoundTimes.RoundFourHard, "Round 4 Time : Hard" },
            { RoundTimes.RoundFiveHard, "Round 5 Time : Hard" },
            { RoundTimes.RoundOneImpossible, "Round 1 Time : Impossible" },
            { RoundTimes.RoundTwoImpossible, "Round 2 Time : Impossible" },
            { RoundTimes.RoundThreeImpossible, "Round 3 Time : Impossible" },
            { RoundTimes.RoundFourImpossible, "Round 4 Time : Impossible" },
            { RoundTimes.RoundFiveImpossible, "Round 5 Time : Impossible" },
            { RoundTimes.RoundOneSolo, "Round 1 Time : Solo" },
            { RoundTimes.RoundTwoSolo, "Round 2 Time : Solo" },
            { RoundTimes.RoundThreeSolo, "Round 3 Time : Solo" },
            { RoundTimes.RoundFourSolo, "Round 4 Time : Solo" },
            { RoundTimes.RoundFiveSolo, "Round 5 Time : Solo" }
        };

        string query = GenerateInsertOrUpdateQuery(battletag, gameStats, roundTimes, statColumnMap, roundTimeColumnMap);
        Console.WriteLine(query);
    }

    public static string GenerateInsertOrUpdateQuery(string battletag, Dictionary<StatTypes, int> gameStats, Dictionary<RoundTimes, double> roundTimes, Dictionary<StatTypes, string> statColumnMap, Dictionary<RoundTimes, string> roundTimeColumnMap)
    {
        var columns = new List<string> { "BattleTag" };
        var values = new List<string> { $"'{battletag}'" };
        var updates = new List<string>();

        foreach (var stat in gameStats)
        {
            columns.Add($"`{statColumnMap[stat.Key]}`");
            values.Add(stat.Value.ToString());
            updates.Add($"`{statColumnMap[stat.Key]}` = VALUES(`{statColumnMap[stat.Key]}`)");
        }

        foreach (var time in roundTimes)
        {
            columns.Add($"`{roundTimeColumnMap[time.Key]}`");
            values.Add(time.Value.ToString());
            updates.Add($"`{roundTimeColumnMap[time.Key]}` = VALUES(`{roundTimeColumnMap[time.Key]}`)");
        }

        string columnsPart = string.Join(", ", columns);
        string valuesPart = string.Join(", ", values);
        string updatesPart = string.Join(", ", updates);

        return $"INSERT INTO newstats ({columnsPart}) VALUES ({valuesPart}) ON DUPLICATE KEY UPDATE {updatesPart};";
    }
}
