using WCSharp.Api;

public static class SeasonalAwards
{

    private static HolidaySeasons Season { get; set; }

    public static void Initialize()
    {
        Season = SeasonalManager.Season;
        if (Season == HolidaySeasons.None) return;
        Utility.SimpleTimer(30.0f, FreebeSeasonalAwards);
    }

    public static void FreebeSeasonalAwards()
    {
        if (Season == HolidaySeasons.Christmas) ChristmasFreebies();
    }

    private static void ChristmasFreebies()
    {
        Utility.TimedTextToAllPlayers(8.0f, $"{Colors.COLOR_YELLOW}Special thanks to every for playing this holiday season!{Colors.COLOR_RESET}");
        var t = timer.Create();
        t.Start(5.0f, false, () =>
        {
            AwardManager.GiveRewardAll(Awards.Snow_Trail_2023);
            AwardManager.GiveRewardAll(Awards.Snow_Wings_2023);
            t.Dispose();
            t = null;
        });
    }
}