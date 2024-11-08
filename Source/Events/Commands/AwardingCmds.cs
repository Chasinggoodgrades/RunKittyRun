using System;
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
        var selectedUnit = CustomStatFrame.SelectedUnit[player.Id];
        var selectedPlayer = GetOwningPlayer(selectedUnit);

        if (award.ToLower() == "help")
        {
            AwardingHelp(player);
            return;
        }

        if(award.ToLower() == "all")
        {
            AwardAll(player);
            return;
        }

        foreach (var awd in Enum.GetValues(typeof(Awards)))
        {
            var awardString = Enum.GetName(typeof(Awards), awd).ToLower();
            var inputAward = award.ToLower();

            // Exact match
            if (awardString == inputAward)
            {
                AwardManager.GiveReward(selectedPlayer, (Awards)awd);
                return;
            }
        }

        player.DisplayTimedTextTo(3.0f, $"{Colors.COLOR_YELLOW_ORANGE}No valid award found for input: |r{Colors.HighlightString(award)} {Colors.COLOR_YELLOW_ORANGE}try using ?award help|r");
    }

    private static void AwardingHelp(player player)
    {
        var combined = "";
        foreach (var awd in Enum.GetValues(typeof(Awards)))
        {
            var awardString = Enum.GetName(typeof(Awards), awd);
            combined += awardString + ", ";
        }
        player.DisplayTimedTextTo(15.0f, $"{Colors.COLOR_YELLOW_ORANGE}Valid awards: {Colors.HighlightString(combined)}");
    }

    private static void AwardAll(player player)
    {
        foreach(var award in Enum.GetValues(typeof(Awards)))
        {
            AwardManager.GiveReward(player, (Awards)award);
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
        var selectedUnit = CustomStatFrame.SelectedUnit[player.Id];
        var selectedPlayer = selectedUnit.Owner;

        if (stats.ToLower() == "help")
        {
            GameStatsHelp(player);
            return;
        }

        var value = command.Split(" ")[2];

        if (!Enum.TryParse(stats, true, out StatTypes stat))
        {
            player.DisplayTimedTextTo(3.0f, $"{Colors.COLOR_YELLOW_ORANGE}Invalid game stat:|r {Colors.HighlightString(stats)}");
            return;
        }

        if (!int.TryParse(value, out int val))
        {
            player.DisplayTimedTextTo(3.0f, $"{Colors.COLOR_YELLOW_ORANGE}Invalid value:|r {Colors.HighlightString(value.ToString())}");
            return;
        }

        Globals.ALL_KITTIES[selectedPlayer].SaveData.GameStats[stat] = val;
        player.DisplayTimedTextTo(3.0f, 
            $"{Colors.COLOR_YELLOW_ORANGE}Set {Colors.HighlightString(stats)} {Colors.COLOR_YELLOW_ORANGE}to|r {Colors.HighlightString(val.ToString())} {Colors.COLOR_YELLOW_ORANGE}for|r {Colors.PlayerNameColored(selectedPlayer)}");
    }

    private static void GameStatsHelp(player player)
    {
        var combined = "";
        foreach (var stat in Enum.GetValues(typeof(StatTypes)))
        {
            var statString = Enum.GetName(typeof(StatTypes), stat);
            combined += statString + ", ";
        }
        player.DisplayTimedTextTo(15.0f, $"{Colors.COLOR_YELLOW_ORANGE}Valid game stats: {Colors.HighlightString(combined)}");
    }

}