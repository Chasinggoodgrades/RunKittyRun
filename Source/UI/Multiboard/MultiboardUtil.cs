using WCSharp.Api;

public static class MultiboardUtil
{
    /// <summary>
    /// Simply updates or refreshes the multiboards.
    /// </summary>
    public static void RefreshMultiboards()
    {
        RefreshStandardMbs();
    }

    private static void RefreshStandardMbs()
    {
        if (Gamemode.CurrentGameMode != "Standard") return;
        StandardMultiboard.UpdateStandardCurrentStatsMB();
        StandardMultiboard.UpdateOverallStatsMB();
        StandardMultiboard.UpdateBestTimesMB();
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
        if (Gamemode.CurrentGameMode != "Standard") return;
        StandardMultiboard.CurrentStats.IsMinimized = minimize;
        StandardMultiboard.BestTimes.IsMinimized = minimize;
        StandardMultiboard.OverallStats.IsMinimized = minimize;
    }
}