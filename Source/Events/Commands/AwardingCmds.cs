using WCSharp.Api;
using static WCSharp.Api.Common;

public static class AwardingCmds
{
    /// <summary>
    /// Awards the owning player of the selected <paramref name="player"/> unit with the given reward input. Use ?award help to see all valid awards.
    /// </summary>
    /// <param name="player"></param>
    /// <param name="command"></param>
    public static void Awarding(player player, string command)
    {
        var award = command.Split(" ")[1];
        var selectedUnit = CustomStatFrame.SelectedUnit[player];
        var selectedPlayer = GetOwningPlayer(selectedUnit);

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
    public static void SettingGameStats(player player, string command)
    {
        var stats = command.Split(" ")[1];
        var selectedUnit = CustomStatFrame.SelectedUnit[player];
        var selectedPlayer = selectedUnit.Owner;

        if (stats.ToLower() == "help")
        {
            GameStatsHelp(player);
            return;
        }

        var value = command.Split(" ")[2];

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

    public static void SettingGameTimes(player player, string command)
    {
        var roundTime = command.Split(" ")[1];
        var selectedUnit = CustomStatFrame.SelectedUnit[player];
        var selectedPlayer = selectedUnit.Owner;

        if (roundTime.ToLower() == "help")
        {
            GameTimesHelp(player);
            return;
        }

        var value = command.Split(" ")[2];

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

    public static void GetAllGameStats(player player)
    {
        var selectedUnit = CustomStatFrame.SelectedUnit[player];
        var selectedPlayer = selectedUnit.Owner;
        if (!Globals.ALL_PLAYERS.Contains(selectedPlayer)) return;
        var combined = "";
        foreach (var property in Globals.GAME_STATS.GetType().GetProperties())
        {
            var value = property.GetValue(Globals.ALL_KITTIES[selectedPlayer].SaveData.GameStats);
            combined += $"{Colors.COLOR_YELLOW_ORANGE}{Utility.FormatAwardName(property.Name)}{Colors.COLOR_RESET}: {value}\n";
        }
        player.DisplayTimedTextTo(15.0f, $"{Colors.COLOR_YELLOW}Game stats for {Colors.PlayerNameColored(selectedPlayer)}:\n{Colors.HighlightString(combined)}{Colors.COLOR_RESET}");
    }
}
