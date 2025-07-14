using WCSharp.Api;

public static class MultiboardUtil
{
    /// <summary>
    /// Simply updates or refreshes the multiboards.
    /// </summary>
    public static void RefreshMultiboards()
    {
        RefreshStandardMbs();
        RefreshSoloMbs();
    }

    private static void RefreshStandardMbs()
    {
        if (Gamemode.CurrentGameMode != GameMode.Standard) return;
        if (!Difficulty.IsDifficultyChosen) return; // Init first.
        StandardMultiboard.UpdateStandardCurrentStatsMB();
        StandardMultiboard.UpdateOverallStatsMB();
        StandardMultiboard.UpdateBestTimesMB();
    }

    private static void RefreshSoloMbs()
    {
        if (Gamemode.CurrentGameMode != GameMode.SoloTournament) return; // Solo Tournament
        SoloMultiboard.UpdateOverallStatsMB();
        SoloMultiboard.UpdateBestTimesMB();
    }

    /// <summary>
    /// Minimize or maximize all multiboards for the <paramref name="player"/>
    /// </summary>
    /// <param name="player">the player object.</param>
    /// <param name="minMax">true to minimize, false to maximize</param>
    public static void MinMultiboards(player player, bool minimize)
    {
        if (!player.IsLocal) return;
        MinStandardMultiboards(minimize);
    }

    private static void MinStandardMultiboards(bool minimize)
    {
        if (Gamemode.CurrentGameMode != GameMode.Standard) return;
        StandardMultiboard.CurrentStats.IsMinimized = minimize; // Possible Desync
        StandardMultiboard.BestTimes.IsMinimized = minimize; // Possible Desync
        StandardMultiboard.OverallStats.IsMinimized = minimize; // Possible Desync
    }

    /// <summary>
    /// Fills the players going down the rows on most left side of multiboard. Passing thru rowIndex for which starting row.
    /// </summary>
    /// <param name="mb"></param>
    /// <param name="rowIndex"></param>
    public static void FillPlayers(multiboard mb, int rowIndex = 2)
    {
        foreach (var player in Globals.ALL_PLAYERS)
        {
            var name = player.Name.Length > 8 ? player.Name.Substring(0, 8) : player.Name;
            mb.GetItem(rowIndex, 0).SetText($"{Colors.GetStringColorOfPlayer(player.Id + 1)}{name}|r");
            mb.GetItem(rowIndex, 0).SetWidth(0.07f);
            rowIndex++;
        }
    }
}
