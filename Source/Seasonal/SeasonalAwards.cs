using WCSharp.Api;

public static class SeasonalAwards
{

    private static HolidaySeasons Season { get; set; }

    public static void Initialize()
    {
        Season = SeasonalManager.Season;
        if (Season == HolidaySeasons.None) return;
        Utility.SimpleTimer(180.0f, FreebeSeasonalAwards);
    }

    public static void FreebeSeasonalAwards()
    {
        if (Season == HolidaySeasons.Christmas) ChristmasFreebies();
    }

    private static void ChristmasFreebies()
    {
        Utility.TimedTextToAllPlayers(8.0f, $"{Colors.COLOR_YELLOW}Special thanks to every for playing this holiday season! All players have been awarded the snow trail and snow wings from 2023 :){Colors.COLOR_RESET}");
        var t = timer.Create();
        t.Start(1.0f, false, () =>
        {
            AwardManager.GiveRewardAll(nameof(Globals.GAME_AWARDS.SnowTrail2023), false);
            AwardManager.GiveRewardAll(nameof(Globals.GAME_AWARDS.SnowWings2023), false);
            GC.RemoveTimer(ref t);
        });
    }
}