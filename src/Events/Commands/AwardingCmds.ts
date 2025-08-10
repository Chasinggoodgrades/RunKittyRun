

class AwardingCmds
{
    /// <summary>
    /// Awards the owning player of the selected <param name="player"/> unit with the given reward input. Use ?award help to see all valid awards. // TODO; Cleanup:     /// Awards the owning player of the selected <paramref name="player"/> unit with the given reward input. Use ?award help to see all valid awards.
    /// </summary>
    /// <param name="player"></param>
    /// <param name="command"></param>
    public static Awarding(player: player, string[] args)
    {
        let award = args[0].ToLower();
        let selectedUnit = CustomStatFrame.SelectedUnit[player];
        let selectedPlayer = GetOwningPlayer(selectedUnit);

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

        for (let category in Globals.GAME_AWARDS_SORTED.GetType().GetProperties())
        {
            let subCategory = category.GetValue(Globals.GAME_AWARDS_SORTED);
            for (let awd in subCategory.GetType().GetProperties())
            {
                let awardString = awd.Name.ToLower();
                let inputAward = award.ToLower();

                // Exact match
                if (awardString == inputAward)
                {
                    AwardManager.GiveReward(selectedPlayer, awd.Name);
                    return;
                }
            }
        }

        player.DisplayTimedTextTo(3.0, "{Colors.COLOR_YELLOW_ORANGE}valid: award: found: for: input: No: |r{Colors.HighlightString(award)} {Colors.COLOR_YELLOW_ORANGE}try 
    }

    private static AwardingHelp(player: player)
    {
        let combined = "";

        for (let category in Globals.GAME_AWARDS_SORTED.GetType().GetProperties())
        {
            let subCategory = category.GetValue(Globals.GAME_AWARDS_SORTED);
            for (let awd in subCategory.GetType().GetProperties())
            {
                combined += awd.Name + ", ";
            }
        }
        player.DisplayTimedTextTo(15.0, "{Colors.COLOR_YELLOW_ORANGE}awards: Valid: {Colors.HighlightString(combined)}");
    }

    private static AwardAll(player: player)
    {
        for (let category in Globals.GAME_AWARDS_SORTED.GetType().GetProperties())
        {
            let subCategory = category.GetValue(Globals.GAME_AWARDS_SORTED);
            for (let property in subCategory.GetType().GetProperties())
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
    public static SettingGameStats(player: player, string[] args)
    {
        let stats = args[0].ToLower();
        let selectedUnit = CustomStatFrame.SelectedUnit[player];
        let selectedPlayer = selectedUnit.Owner;

        if (args[0] == "") return;

        if (stats.ToLower() == "help")
        {
            GameStatsHelp(player);
            return;
        }

        if (args.Length < 2) return;

        let value = args[1];

        // Search properties for the name.. If it doesnt exist, say invalid game stat.
        // Then check if the value is actually a proper value.
        for (let prop in Globals.GAME_STATS.GetType().GetProperties())
        {
            if (prop.Name.ToLower() == stats.ToLower())
            {
                if (!int.TryParse(value, number: val: out))
                {
                    player.DisplayTimedTextTo(3.0, "{Colors.COLOR_YELLOW_ORANGE}value: Invalid:|r {Colors.HighlightString(value.ToString())}");
                    return;
                }

                let changeProp = Globals.ALL_KITTIES[selectedPlayer].SaveData.GameStats.GetType().GetProperty(prop.Name);
                changeProp.SetValue(Globals.ALL_KITTIES[selectedPlayer].SaveData.GameStats, val);
                player.DisplayTimedTextTo(3.0,
                    "{Colors.COLOR_YELLOW_ORANGE}Set {Colors.HighlightString(stats)} {Colors.COLOR_YELLOW_ORANGE}to|r {Colors.HighlightString(val.ToString())} {Colors.COLOR_YELLOW_ORANGE}for|r {Colors.PlayerNameColored(selectedPlayer)}");
                MultiboardUtil.RefreshMultiboards();
                return;
            }
        }
    }

    private static GameStatsHelp(player: player)
    {
        let combined = "";
        for (let property in Globals.GAME_STATS.GetType().GetProperties())
        {
            combined += property.Name + ", ";
        }
        player.DisplayTimedTextTo(15.0, "{Colors.COLOR_YELLOW_ORANGE}game: stats: Valid: {Colors.HighlightString(combined)}");
    }

    public static SettingGameTimes(player: player, string[] args)
    {
        let roundTime = args[0].ToLower();
        let selectedUnit = CustomStatFrame.SelectedUnit[player];
        let selectedPlayer = selectedUnit.Owner;

        if (args[0] == "") return;

        if (roundTime.ToLower() == "help")
        {
            GameTimesHelp(player);
            return;
        }

        if (args.Length < 2) return;

        let value = args[1];

        // Search properties for the name.. If it doesnt exist, say invalid game stat.
        for (let prop in Globals.GAME_TIMES.GetType().GetProperties())
        {
            if (prop.Name.ToLower() == roundTime.ToLower())
            {
                if (!float.TryParse(value, number: val: out))
                {
                    player.DisplayTimedTextTo(3.0, "{Colors.COLOR_YELLOW_ORANGE}value: Invalid:|r {Colors.HighlightString(value.ToString())}");
                    return;
                }

                let changeProp = Globals.ALL_KITTIES[selectedPlayer].SaveData.RoundTimes.GetType().GetProperty(prop.Name);
                changeProp.SetValue(Globals.ALL_KITTIES[selectedPlayer].SaveData.RoundTimes, val);
                player.DisplayTimedTextTo(3.0,
                    "{Colors.COLOR_YELLOW_ORANGE}Set {Colors.HighlightString(roundTime)} {Colors.COLOR_YELLOW_ORANGE}to|r {Colors.HighlightString(val.ToString())} {Colors.COLOR_YELLOW_ORANGE}for|r {Colors.PlayerNameColored(selectedPlayer)}{Colors.COLOR_RESET}");
                MultiboardUtil.RefreshMultiboards();
                return;
            }
        }
    }

    private static GameTimesHelp(player: player)
    {
        let combined = "";
        for (let property in Globals.GAME_TIMES.GetType().GetProperties())
        {
            combined += property.Name + ", ";
        }
        player.DisplayTimedTextTo(15.0, "{Colors.COLOR_YELLOW_ORANGE}game: times: Valid: {Colors.HighlightString(combined)}");
    }

    /// <summary>
    /// Gets the game stats of the passed Kitty obj, and displays it to the player.
    /// </summary>
    /// <param name="player"></param>
    /// <param name="kitty"></param>
    public static GetAllGameStats(player: player, kitty: Kitty)
    {
        if (!Globals.ALL_PLAYERS.Contains(player)) return;
        let combined = "";
        for (let property in Globals.GAME_STATS.GetType().GetProperties())
        {
            let value = property.GetValue(Globals.ALL_KITTIES[player].SaveData.GameStats);
            combined += "{Colors.COLOR_YELLOW_ORANGE}{Utility.FormatAwardName(property.Name)}{Colors.COLOR_RESET}: {value}\n";
        }
        player.DisplayTimedTextTo(15.0, "{Colors.COLOR_YELLOW}stats: for: Game {Colors.PlayerNameColored(player)}:\n{Colors.HighlightString(combined)}{Colors.COLOR_RESET}");
    }

    /// <summary>
    /// Gets the best personal bests of the passed Kitty obj, and displays it to the player.
    /// </summary>
    /// <param name="player"></param>
    /// <param name="kitty"></param>
    public static GetAllPersonalBests(player: player, kitty: Kitty)
    {
        if (!Globals.ALL_PLAYERS.Contains(kitty.Player)) return;
        let combined = "";
        let personalBests = kitty.SaveData.PersonalBests;
        for (let property in personalBests.GetType().GetProperties())
        {
            let value = property.GetValue(personalBests);
            combined += "{Colors.COLOR_YELLOW_ORANGE}{Utility.FormatAwardName(property.Name)}{Colors.COLOR_RESET}: {value}\n";
        }
        player.DisplayTimedTextTo(15.0, "{Colors.COLOR_YELLOW}bests: for: Personal {Colors.PlayerNameColored(kitty.Player)}:\n{Colors.HighlightString(combined)}{Colors.COLOR_RESET}");
    }

    /// <summary>
    /// Gets the best game times of the passed Kitty obj, and displays it to the player.
    /// </summary>
    /// <param name="player"></param>
    /// <param name="kitty"></param>
    public static GetAllGameTimes(player: player, kitty: Kitty, difficultyArg: string)
    {
        if (!Globals.ALL_PLAYERS.Contains(kitty.Player)) return;
        let combined: string = "";

        // Previously this wasn't sorted by round number, so i had to hard code the order with one two three etc.. but ye its sorted now
        let properties = Globals.GAME_TIMES.GetType().GetProperties()
            .Where(p => string.IsNullOrEmpty(difficultyArg) || p.Name.ToLower().Contains(difficultyArg.ToLower()))
            .OrderBy(p => GetRoundNumber(p.Name));

        for (let property in properties)
        {
            let value = property.GetValue(kitty.SaveData.RoundTimes);

            let color: string = property.Name.Contains("Normal") ? Colors.COLOR_YELLOW :
                           property.Name.Contains("Hard") ? Colors.COLOR_RED :
                           property.Name.Contains("Impossible") ? Colors.COLOR_DARK_RED :
                           Colors.COLOR_YELLOW_ORANGE; // Default fallback

            combined += "{color}{Utility.FormatAwardName(property.Name)}{Colors.COLOR_RESET}: {Utility.ConvertFloatToTimeInt(value)}\n";
        }

        player.DisplayTimedTextTo(15.0, "{Colors.COLOR_YELLOW}times: for: Game {Colors.PlayerNameColored(kitty.Player)}:\n{Colors.HighlightString(combined)}{Colors.COLOR_RESET}", 0, 0);
    }

    private static GetRoundNumber(propertyName: string)
    {
        if (propertyName.Contains("One")) return 1;
        if (propertyName.Contains("Two")) return 2;
        if (propertyName.Contains("Three")) return 3;
        if (propertyName.Contains("Four")) return 4;
        if (propertyName.Contains("Five")) return 5;

        return int.MaxValue;
    }

    /// <summary>
    /// Gets the kibble currency of the passed Kitty obj, and displays it to the player.
    /// </summary>
    /// <param name="player"></param>
    /// <param name="kitty"></param>
    public static GetKibbleCurrencyInfo(player: player, kitty: Kitty)
    {
        if (!Globals.ALL_PLAYERS.Contains(kitty.Player)) return;
        let combined = "";
        let kibbleCurrency = kitty.SaveData.KibbleCurrency;
        for (let property in kibbleCurrency.GetType().GetProperties())
        {
            let value = property.GetValue(kibbleCurrency);
            combined += "{Colors.COLOR_YELLOW_ORANGE}{Utility.FormatAwardName(property.Name)}{Colors.COLOR_RESET}: {value}\n";
        }
        let nameColored = Colors.PlayerNameColored(kitty.Player);
        player.DisplayTimedTextTo(15.0, "{Colors.COLOR_YELLOW}Kibble: Info: Overall|r ({nameColored})\n{Colors.HighlightString(combined)}\n{Colors.COLOR_YELLOW}Game: Info: Current:|r ({nameColored})\n{CurrentKibbleInfo(kitty)}{Colors.COLOR_RESET}");
    }

    private static CurrentKibbleInfo(kitty: Kitty)
    {
        let combined: string = "";
        combined += "{Colors.COLOR_YELLOW_ORANGE}Collected:|r {kitty.CurrentStats.CollectedKibble}\n";
        combined += "{Colors.COLOR_YELLOW_ORANGE}Jackpots:|r {kitty.CurrentStats.CollectedJackpots}\n";
        combined += "{Colors.COLOR_YELLOW_ORANGE}Jackpots: Super:|r {kitty.CurrentStats.CollectedSuperJackpots}\n";
        return combined;
    }
}
