using WCSharp.Api;
using static WCSharp.Api.Common;

public static class AwardingCmds
{
    /// <summary>
    /// Awards the owning player of the selected <paramref name="player"/> unit with the given reward input. Use ?award help to see all valid awards.
    /// </summary>
    /// <param name="player"></param>
    /// <param name="command"></param>
    public static void Awarding(player player, string[] args)
    {
        var award = args[0].ToLower();
        var selectedUnit = CustomStatFrame.SelectedUnit[player];
        var selectedPlayer = GetOwningPlayer(selectedUnit);

        if (args[0] == "") return;

        if (award.ToLower() == "help")
        {
            AwardingHelp(player);
            return;
        }

        if (award.ToLower() == "all")
        {
            AwardAll(player);
            return;
        }

        foreach (var category in Globals.GAME_AWARDS_SORTED.GetType().GetProperties())
        {
            var subCategory = category.GetValue(Globals.GAME_AWARDS_SORTED);
            foreach (var awd in subCategory.GetType().GetProperties())
            {
                var awardString = awd.Name.ToLower();
                var inputAward = award.ToLower();

                // Exact match
                if (awardString == inputAward)
                {
                    AwardManager.GiveReward(selectedPlayer, awd.Name);
                    return;
                }
            }
        }

        player.DisplayTimedTextTo(3.0f, $"{Colors.COLOR_YELLOW_ORANGE}No valid award found for input: |r{Colors.HighlightString(award)} {Colors.COLOR_YELLOW_ORANGE}try using ?award help|r");
    }

    private static void AwardingHelp(player player)
    {
        var combined = "";

        foreach (var category in Globals.GAME_AWARDS_SORTED.GetType().GetProperties())
        {
            var subCategory = category.GetValue(Globals.GAME_AWARDS_SORTED);
            foreach (var awd in subCategory.GetType().GetProperties())
            {
                combined += awd.Name + ", ";
            }
        }
        player.DisplayTimedTextTo(15.0f, $"{Colors.COLOR_YELLOW_ORANGE}Valid awards: {Colors.HighlightString(combined)}");
    }

    private static void AwardAll(player player)
    {
        foreach (var category in Globals.GAME_AWARDS_SORTED.GetType().GetProperties())
        {
            var subCategory = category.GetValue(Globals.GAME_AWARDS_SORTED);
            foreach (var property in subCategory.GetType().GetProperties())
            {
                AwardManager.GiveReward(player, property.Name);
            }
        }
    }

    /// <summary>
    /// Sets the specified game stat for the selected player. Use ?gamestats help to see all valid game stats.
    /// </summary>
    /// <param name="player"></param>
    /// <param name="command"></param>
    public static void SettingGameStats(player player, string[] args)
    {
        var stats = args[0].ToLower();
        var selectedUnit = CustomStatFrame.SelectedUnit[player];
        var selectedPlayer = selectedUnit.Owner;

        if (args[0] == "") return;

        if (stats.ToLower() == "help")
        {
            GameStatsHelp(player);
            return;
        }

        if (args.Length < 2) return;

        var value = args[1];

        // Search properties for the name.. If it doesnt exist, say invalid game stat.
        // Then check if the value is actually a proper value.
        foreach (var prop in Globals.GAME_STATS.GetType().GetProperties())
        {
            if (prop.Name.ToLower() == stats.ToLower())
            {
                if (!int.TryParse(value, out int val))
                {
                    player.DisplayTimedTextTo(3.0f, $"{Colors.COLOR_YELLOW_ORANGE}Invalid value:|r {Colors.HighlightString(value.ToString())}");
                    return;
                }

                var changeProp = Globals.ALL_KITTIES[selectedPlayer].SaveData.GameStats.GetType().GetProperty(prop.Name);
                changeProp.SetValue(Globals.ALL_KITTIES[selectedPlayer].SaveData.GameStats, val);
                player.DisplayTimedTextTo(3.0f,
                    $"{Colors.COLOR_YELLOW_ORANGE}Set {Colors.HighlightString(stats)} {Colors.COLOR_YELLOW_ORANGE}to|r {Colors.HighlightString(val.ToString())} {Colors.COLOR_YELLOW_ORANGE}for|r {Colors.PlayerNameColored(selectedPlayer)}");
                MultiboardUtil.RefreshMultiboards();
                return;
            }
        }
    }

    private static void GameStatsHelp(player player)
    {
        var combined = "";
        foreach (var property in Globals.GAME_STATS.GetType().GetProperties())
        {
            combined += property.Name + ", ";
        }
        player.DisplayTimedTextTo(15.0f, $"{Colors.COLOR_YELLOW_ORANGE}Valid game stats: {Colors.HighlightString(combined)}");
    }

    public static void SettingGameTimes(player player, string[] args)
    {
        var roundTime = args[0].ToLower();
        var selectedUnit = CustomStatFrame.SelectedUnit[player];
        var selectedPlayer = selectedUnit.Owner;

        if (args[0] == "") return;

        if (roundTime.ToLower() == "help")
        {
            GameTimesHelp(player);
            return;
        }

        if (args.Length < 2) return;

        var value = args[1];

        // Search properties for the name.. If it doesnt exist, say invalid game stat.
        foreach (var prop in Globals.GAME_TIMES.GetType().GetProperties())
        {
            if (prop.Name.ToLower() == roundTime.ToLower())
            {
                if (!float.TryParse(value, out float val))
                {
                    player.DisplayTimedTextTo(3.0f, $"{Colors.COLOR_YELLOW_ORANGE}Invalid value:|r {Colors.HighlightString(value.ToString())}");
                    return;
                }

                var changeProp = Globals.ALL_KITTIES[selectedPlayer].SaveData.RoundTimes.GetType().GetProperty(prop.Name);
                changeProp.SetValue(Globals.ALL_KITTIES[selectedPlayer].SaveData.RoundTimes, val);
                player.DisplayTimedTextTo(3.0f,
                    $"{Colors.COLOR_YELLOW_ORANGE}Set {Colors.HighlightString(roundTime)} {Colors.COLOR_YELLOW_ORANGE}to|r {Colors.HighlightString(val.ToString())} {Colors.COLOR_YELLOW_ORANGE}for|r {Colors.PlayerNameColored(selectedPlayer)}{Colors.COLOR_RESET}");
                MultiboardUtil.RefreshMultiboards();
                return;
            }
        }
    }

    private static void GameTimesHelp(player player)
    {
        var combined = "";
        foreach (var property in Globals.GAME_TIMES.GetType().GetProperties())
        {
            combined += property.Name + ", ";
        }
        player.DisplayTimedTextTo(15.0f, $"{Colors.COLOR_YELLOW_ORANGE}Valid game times: {Colors.HighlightString(combined)}");
    }

    /// <summary>
    /// Gets the game stats of the passed Kitty obj, and displays it to the player.
    /// </summary>
    /// <param name="player"></param>
    /// <param name="kitty"></param>
    public static void GetAllGameStats(player player, Kitty kitty)
    {
        if (!Globals.ALL_PLAYERS.Contains(player)) return;
        var combined = "";
        foreach (var property in Globals.GAME_STATS.GetType().GetProperties())
        {
            var value = property.GetValue(Globals.ALL_KITTIES[player].SaveData.GameStats);
            combined += $"{Colors.COLOR_YELLOW_ORANGE}{Utility.FormatAwardName(property.Name)}{Colors.COLOR_RESET}: {value}\n";
        }
        player.DisplayTimedTextTo(15.0f, $"{Colors.COLOR_YELLOW}Game stats for {Colors.PlayerNameColored(player)}:\n{Colors.HighlightString(combined)}{Colors.COLOR_RESET}");
    }

    /// <summary>
    /// Gets the best personal bests of the passed Kitty obj, and displays it to the player.
    /// </summary>
    /// <param name="player"></param>
    /// <param name="kitty"></param>
    public static void GetAllPersonalBests(player player, Kitty kitty)
    {
        if (!Globals.ALL_PLAYERS.Contains(kitty.Player)) return;
        var combined = "";
        var personalBests = kitty.SaveData.PersonalBests;
        foreach (var property in personalBests.GetType().GetProperties())
        {
            var value = property.GetValue(personalBests);
            combined += $"{Colors.COLOR_YELLOW_ORANGE}{Utility.FormatAwardName(property.Name)}{Colors.COLOR_RESET}: {value}\n";
        }
        player.DisplayTimedTextTo(15.0f, $"{Colors.COLOR_YELLOW}Personal bests for {Colors.PlayerNameColored(kitty.Player)}:\n{Colors.HighlightString(combined)}{Colors.COLOR_RESET}");
    }

    /// <summary>
    /// Gets the best game times of the passed Kitty obj, and displays it to the player.
    /// </summary>
    /// <param name="player"></param>
    /// <param name="kitty"></param>
    public static void GetAllGameTimes(player player, Kitty kitty)
    {
        if (!Globals.ALL_PLAYERS.Contains(kitty.Player)) return;
        var combined = "";
        foreach (var property in Globals.GAME_TIMES.GetType().GetProperties())
        {
            var value = property.GetValue(kitty.SaveData.RoundTimes);
            combined += $"{Colors.COLOR_YELLOW_ORANGE}{Utility.FormatAwardName(property.Name)}{Colors.COLOR_RESET}: {Utility.ConvertFloatToTimeInt((float)value)}\n";
        }
        player.DisplayTimedTextTo(15.0f, $"{Colors.COLOR_YELLOW}Game times for {Colors.PlayerNameColored(kitty.Player)}:\n{Colors.HighlightString(combined)}{Colors.COLOR_RESET}", 0, 1);
    }

    /// <summary>
    /// Gets the kibble currency of the passed Kitty obj, and displays it to the player.
    /// </summary>
    /// <param name="player"></param>
    /// <param name="kitty"></param>
    public static void GetKibbleCurrencyInfo(player player, Kitty kitty)
    {
        if (!Globals.ALL_PLAYERS.Contains(kitty.Player)) return;
        var combined = "";
        var kibbleCurrency = kitty.SaveData.KibbleCurrency;
        foreach (var property in kibbleCurrency.GetType().GetProperties())
        {
            var value = property.GetValue(kibbleCurrency);
            combined += $"{Colors.COLOR_YELLOW_ORANGE}{Utility.FormatAwardName(property.Name)}{Colors.COLOR_RESET}: {value}\n";
        }
        player.DisplayTimedTextTo(15.0f, $"{Colors.COLOR_YELLOW}Kibble currency for {Colors.PlayerNameColored(kitty.Player)}:\n{Colors.HighlightString(combined)}{Colors.COLOR_RESET}");
    }
}
