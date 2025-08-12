class SeasonalAwards {
    private static Season: HolidaySeasons

    public static Initialize() {
        Season = SeasonalManager.Season
        if (Season == HolidaySeasons.None) return
        Utility.SimpleTimer(180.0, FreebeSeasonalAwards)
    }

    public static FreebeSeasonalAwards() {
        if (Season == HolidaySeasons.Christmas) ChristmasFreebies()
    }

    private static ChristmasFreebies() {
        Utility.TimedTextToAllPlayers(
            8.0,
            '{Colors.COLOR_YELLOW}thanks: to: every: for: playing: this: holiday: season: Special! players: have: All been awarded the snow trail and snow wings from 2023 :){Colors.COLOR_RESET}'
        )
        let t = ObjectPool.GetEmptyObject<AchesTimers>()
        t.Timer.Start(
            1.0,
            false,
            ErrorHandler.Wrap(() => {
                AwardManager.GiveRewardAll('SnowTrail2023', false)
                AwardManager.GiveRewardAll('SnowWings2023', false)
                t.Dispose()
            })
        )
    }
}
