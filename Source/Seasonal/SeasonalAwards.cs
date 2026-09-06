using WCSharp.Api;

public static class SeasonalAwards
{
    private static SeasonTheme _theme = SeasonThemeRegistry.None;

    /// <summary>
    /// Arms the freebie timer for whatever theme is currently active. Safe to call
    /// again whenever the season changes - themes with no rewards simply do nothing.
    /// </summary>
    public static void Initialize(SeasonTheme theme)
    {
        _theme = theme;
        if (_theme.FreebieRewardNames.Length == 0) return;
        Utility.SimpleTimer(180.0f, GiveFreebies);
    }

    private static void GiveFreebies()
    {
        if (!string.IsNullOrEmpty(_theme.FreebieAnnouncement))
        {
            Utility.TimedTextToAllPlayers(8.0f, _theme.FreebieAnnouncement);
        }

        var t = ObjectPool<AchesTimers>.GetEmptyObject();
        t.Timer.Start(1.0f, false, ErrorHandler.Wrap(() =>
        {
            for (var i = 0; i < _theme.FreebieRewardNames.Length; i++)
            {
                AwardManager.GiveRewardAll(_theme.FreebieRewardNames[i], false);
            }
            t.Dispose();
        }));
    }
}
