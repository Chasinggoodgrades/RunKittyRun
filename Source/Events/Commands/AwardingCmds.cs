using System.Linq;
using System.Reflection;
using System.Text;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class AwardingCmds
{
    private static readonly string[] CategoryColors =
    {
        Colors.COLOR_TURQUOISE, Colors.COLOR_GOLD,    Colors.COLOR_PURPLE,
        Colors.COLOR_LAVENDER,  Colors.COLOR_YELLOW,  Colors.COLOR_PINK,
        Colors.COLOR_RED,       Colors.COLOR_GREEN,   Colors.COLOR_CYAN,
    };

    private static readonly StringBuilder _sb = new StringBuilder();
    private static readonly StringBuilder _inner = new StringBuilder();

    /// <summary>
    /// Awards the resolved player with the given reward. Use ?award help to see valid awards grouped by category.
    /// </summary>
    public static void Awarding(player player, string[] args)
    {
        if (args[0] == "") return;

        var award = args[0].ToLower();

        if (award == "help")
        {
            AwardingHelp(player, args.Length > 1 ? args[1] : "");
            return;
        }

        if (award == "all")
        {
            CommandsManager.ResolvePlayerId(args.Length > 1 ? args[1] : "", kitty => AwardAll(kitty.Player));
            return;
        }

        var foundAward = FindAwardName(award);
        if (foundAward == null)
        {
            player.DisplayTimedTextTo(3.0f, $"{Colors.COLOR_YELLOW_ORANGE}No valid award found for: |r{Colors.HighlightString(award)} {Colors.COLOR_YELLOW_ORANGE}— try ?award help|r");
            return;
        }

        CommandsManager.ResolvePlayerId(args.Length > 1 ? args[1] : "", kitty =>
        {
            if (kitty == null) return;
            AwardManager.GiveReward(kitty.Player, foundAward);
            player.DisplayTimedTextTo(3.0f, $"{Colors.COLOR_YELLOW_ORANGE}Awarded {Colors.HighlightString(foundAward)} to {Colors.PlayerNameColored(kitty.Player)}|r");
        });
    }

    /// <summary>
    /// Removes the specified award from the resolved player. Args: [award name] [player?]
    /// </summary>
    public static void RemovingAward(player player, string[] args)
    {
        if (args[0] == "")
        {
            player.DisplayTimedTextTo(3.0f, $"{Colors.COLOR_YELLOW_ORANGE}Usage: removeaward [award name] [player?]|r");
            return;
        }

        var foundAward = FindAwardName(args[0].ToLower());
        if (foundAward == null)
        {
            player.DisplayTimedTextTo(3.0f, $"{Colors.COLOR_YELLOW_ORANGE}No valid award found for: |r{Colors.HighlightString(args[0])} {Colors.COLOR_YELLOW_ORANGE}— try ?award help|r");
            return;
        }

        CommandsManager.ResolvePlayerId(args.Length > 1 ? args[1] : "", kitty =>
        {
            if (kitty == null) return;
            AwardManager.RemoveReward(kitty.Player, foundAward);
            player.DisplayTimedTextTo(3.0f, $"{Colors.COLOR_YELLOW_ORANGE}Removed {Colors.HighlightString(foundAward)} from {Colors.PlayerNameColored(kitty.Player)}|r");
        });
    }

    /// <summary>
    /// Sets the specified game stat for the resolved player. Args: [stat] [value] [player?]. Use ?stat help to see all valid stats.
    /// </summary>
    public static void SettingGameStats(player player, string[] args)
    {
        if (args[0] == "") return;

        var stat = args[0].ToLower();

        if (stat == "help")
        {
            GameStatsHelp(player);
            return;
        }

        if (args.Length < 2) return;

        var prop = FindProperty(Globals.GAME_STATS, stat);
        if (prop == null)
        {
            player.DisplayTimedTextTo(3.0f, $"{Colors.COLOR_YELLOW_ORANGE}No valid stat found for: |r{Colors.HighlightString(stat)} {Colors.COLOR_YELLOW_ORANGE}— try ?stat help|r");
            return;
        }

        if (!int.TryParse(args[1], out int val))
        {
            player.DisplayTimedTextTo(3.0f, $"{Colors.COLOR_YELLOW_ORANGE}Invalid value:|r {Colors.HighlightString(args[1])}");
            return;
        }

        CommandsManager.ResolvePlayerId(args.Length > 2 ? args[2] : "", kitty =>
        {
            if (kitty == null) return;
            prop.SetValue(kitty.SaveData.GameStats, val);
            player.DisplayTimedTextTo(3.0f,
                $"{Colors.COLOR_YELLOW_ORANGE}Set {Colors.HighlightString(stat)} {Colors.COLOR_YELLOW_ORANGE}to|r {Colors.HighlightString(val.ToString())} {Colors.COLOR_YELLOW_ORANGE}for|r {Colors.PlayerNameColored(kitty.Player)}");
            MultiboardUtil.RefreshMultiboards();
        });
    }

    /// <summary>
    /// Sets the specified game time for the resolved player. Args: [time] [value] [player?]. Use ?time help to see all valid times.
    /// </summary>
    public static void SettingGameTimes(player player, string[] args)
    {
        if (args[0] == "") return;

        var roundTime = args[0].ToLower();

        if (roundTime == "help")
        {
            GameTimesHelp(player);
            return;
        }

        if (args.Length < 2) return;

        var prop = FindProperty(Globals.GAME_TIMES, roundTime);
        if (prop == null)
        {
            player.DisplayTimedTextTo(3.0f, $"{Colors.COLOR_YELLOW_ORANGE}No valid time found for: |r{Colors.HighlightString(roundTime)} {Colors.COLOR_YELLOW_ORANGE}— try ?time help|r");
            return;
        }

        if (!float.TryParse(args[1], out float val))
        {
            player.DisplayTimedTextTo(3.0f, $"{Colors.COLOR_YELLOW_ORANGE}Invalid value:|r {Colors.HighlightString(args[1])}");
            return;
        }

        CommandsManager.ResolvePlayerId(args.Length > 2 ? args[2] : "", kitty =>
        {
            if (kitty == null) return;
            prop.SetValue(kitty.SaveData.RoundTimes, val);
            player.DisplayTimedTextTo(3.0f,
                $"{Colors.COLOR_YELLOW_ORANGE}Set {Colors.HighlightString(roundTime)} {Colors.COLOR_YELLOW_ORANGE}to|r {Colors.HighlightString(val.ToString())} {Colors.COLOR_YELLOW_ORANGE}for|r {Colors.PlayerNameColored(kitty.Player)}{Colors.COLOR_RESET}");
            MultiboardUtil.RefreshMultiboards();
        });
    }

    /// <summary>
    /// Gets the game stats of the passed Kitty and displays them to the player.
    /// </summary>
    public static void GetAllGameStats(player player, Kitty kitty)
    {
        if (!Globals.ALL_PLAYERS.Contains(kitty.Player)) return;
        _sb.Clear();
        foreach (var property in kitty.SaveData.GameStats.GetType().GetProperties())
        {
            var value = property.GetValue(kitty.SaveData.GameStats);
            _sb.Append($"{Colors.COLOR_YELLOW_ORANGE}{Utility.FormatAwardName(property.Name)}{Colors.COLOR_RESET}: {value}\n");
        }
        player.DisplayTimedTextTo(15.0f, $"{Colors.COLOR_YELLOW}Game stats for {Colors.PlayerNameColored(kitty.Player)}:\n{Colors.HighlightString(_sb.ToString())}{Colors.COLOR_RESET}", 0, 10);
    }

    /// <summary>
    /// Gets the personal bests of the passed Kitty and displays them to the player.
    /// </summary>
    public static void GetAllPersonalBests(player player, Kitty kitty)
    {
        if (!Globals.ALL_PLAYERS.Contains(kitty.Player)) return;
        _sb.Clear();
        var personalBests = kitty.SaveData.PersonalBests;
        foreach (var property in personalBests.GetType().GetProperties())
        {
            var value = property.GetValue(personalBests);
            _sb.Append($"{Colors.COLOR_YELLOW_ORANGE}{Utility.FormatAwardName(property.Name)}{Colors.COLOR_RESET}: {value}\n");
        }
        player.DisplayTimedTextTo(15.0f, $"{Colors.COLOR_YELLOW}Personal bests for {Colors.PlayerNameColored(kitty.Player)}:\n{Colors.HighlightString(_sb.ToString())}{Colors.COLOR_RESET}");
    }

    /// <summary>
    /// Gets the game times of the passed Kitty, optionally filtered by difficulty, and displays them to the player.
    /// </summary>
    public static void GetAllGameTimes(player player, Kitty kitty, string difficultyArg)
    {
        if (!Globals.ALL_PLAYERS.Contains(kitty.Player)) return;
        _sb.Clear();

        var properties = Globals.GAME_TIMES.GetType().GetProperties()
            .Where(p => string.IsNullOrEmpty(difficultyArg) || p.Name.ToLower().Contains(difficultyArg.ToLower()))
            .OrderBy(p => GetRoundNumber(p.Name));

        foreach (var property in properties)
        {
            var value = property.GetValue(kitty.SaveData.RoundTimes);

            string color = property.Name.Contains("Normal")     ? Colors.COLOR_YELLOW :
                           property.Name.Contains("Hard")       ? Colors.COLOR_RED :
                           property.Name.Contains("Impossible") ? Colors.COLOR_DARK_RED :
                           Colors.COLOR_YELLOW_ORANGE;

            _sb.Append($"{color}{Utility.FormatAwardName(property.Name)}{Colors.COLOR_RESET}: {Utility.ConvertFloatToTimeInt((float)value)}\n");
        }

        player.DisplayTimedTextTo(15.0f, $"{Colors.COLOR_YELLOW}Game times for {Colors.PlayerNameColored(kitty.Player)}:\n{Colors.HighlightString(_sb.ToString())}{Colors.COLOR_RESET}", 0, 0);
    }

    /// <summary>
    /// Gets the kibble currency info of the passed Kitty and displays it to the player.
    /// </summary>
    public static void GetKibbleCurrencyInfo(player player, Kitty kitty)
    {
        if (!Globals.ALL_PLAYERS.Contains(kitty.Player)) return;
        _sb.Clear();
        var kibbleCurrency = kitty.SaveData.KibbleCurrency;
        foreach (var property in kibbleCurrency.GetType().GetProperties())
        {
            var value = property.GetValue(kibbleCurrency);
            _sb.Append($"{Colors.COLOR_YELLOW_ORANGE}{Utility.FormatAwardName(property.Name)}{Colors.COLOR_RESET}: {value}\n");
        }
        var nameColored = Colors.PlayerNameColored(kitty.Player);
        player.DisplayTimedTextTo(15.0f, $"{Colors.COLOR_YELLOW}Overall Kibble Info|r ({nameColored})\n{Colors.HighlightString(_sb.ToString())}\n{Colors.COLOR_YELLOW}Current Game Info:|r ({nameColored})\n{CurrentKibbleInfo(kitty)}{Colors.COLOR_RESET}");
    }

    private static void AwardAll(player target)
    {
        if (!Globals.ALL_KITTIES.ContainsKey(target)) return;
        foreach (var category in Globals.GAME_AWARDS_SORTED.GetType().GetProperties())
        {
            var subCategory = category.GetValue(Globals.GAME_AWARDS_SORTED);
            foreach (var property in subCategory.GetType().GetProperties())
                AwardManager.GiveReward(target, property.Name);
        }
    }

    private static void AwardingHelp(player player, string filter = "")
    {
        _sb.Clear();
        int i = 0;
        int y = filter == "" ? 10 : 0;
        foreach (var category in Globals.GAME_AWARDS_SORTED.GetType().GetProperties())
        {
            var color = CategoryColors[i++ % CategoryColors.Length];
            var subCategory = category.GetValue(Globals.GAME_AWARDS_SORTED);
            _inner.Clear();
            foreach (var awd in subCategory.GetType().GetProperties())
            {
                if (string.IsNullOrEmpty(filter) || awd.Name.ToLower().Contains(filter.ToLower()))
                    _inner.Append(awd.Name).Append(' ');
            }
            if (_inner.Length > 0)
                _sb.Append($"{color}[{category.Name}]|r {_inner}\n");
        }
        player.DisplayTimedTextTo(15.0f, $"{Colors.COLOR_GOLD}Awards by Category:\n{_sb}", 0, y);
    }

    private static void GameStatsHelp(player player)
    {
        _sb.Clear();
        foreach (var property in Globals.GAME_STATS.GetType().GetProperties())
            _sb.Append(property.Name).Append(", ");
        player.DisplayTimedTextTo(15.0f, $"{Colors.COLOR_YELLOW_ORANGE}Valid game stats: {Colors.HighlightString(_sb.ToString())}");
    }

    private static void GameTimesHelp(player player)
    {
        _sb.Clear();
        foreach (var property in Globals.GAME_TIMES.GetType().GetProperties())
            _sb.Append(property.Name).Append(", ");
        player.DisplayTimedTextTo(15.0f, $"{Colors.COLOR_YELLOW_ORANGE}Valid game times: {Colors.HighlightString(_sb.ToString())}");
    }

    private static string CurrentKibbleInfo(Kitty kitty)
    {
        _inner.Clear();
        _inner.Append($"{Colors.COLOR_YELLOW_ORANGE}Collected:|r {kitty.CurrentStats.CollectedKibble}\n");
        _inner.Append($"{Colors.COLOR_YELLOW_ORANGE}Jackpots:|r {kitty.CurrentStats.CollectedJackpots}\n");
        _inner.Append($"{Colors.COLOR_YELLOW_ORANGE}Super Jackpots:|r {kitty.CurrentStats.CollectedSuperJackpots}\n");
        return _inner.ToString();
    }

    private static string FindAwardName(string input)
    {
        foreach (var category in Globals.GAME_AWARDS_SORTED.GetType().GetProperties())
        {
            var subCategory = category.GetValue(Globals.GAME_AWARDS_SORTED);
            foreach (var awd in subCategory.GetType().GetProperties())
                if (awd.Name.ToLower() == input) return awd.Name;
        }
        return null;
    }

    private static PropertyInfo FindProperty(object target, string nameLower)
    {
        foreach (var prop in target.GetType().GetProperties())
            if (prop.Name.ToLower() == nameLower) return prop;
        return null;
    }

    private static int GetRoundNumber(string propertyName)
    {
        if (propertyName.Contains("One"))   return 1;
        if (propertyName.Contains("Two"))   return 2;
        if (propertyName.Contains("Three")) return 3;
        if (propertyName.Contains("Four"))  return 4;
        if (propertyName.Contains("Five"))  return 5;
        return int.MaxValue;
    }
}

