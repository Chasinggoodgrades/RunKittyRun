import { AwardManager } from 'src/Rewards/Rewards/AwardManager'
import { Colors } from 'src/Utility/Colors/Colors'
import { ErrorHandler } from 'src/Utility/ErrorHandler'
import { createAchesTimer } from 'src/Utility/MemoryHandler/AchesTimers'
import { Utility } from 'src/Utility/Utility'
import { HolidaySeasons, Seasons } from './Seasons'

export class SeasonalAwards {
    private static Season: HolidaySeasons

    public static Initialize = () => {
        SeasonalAwards.Season = Seasons.getCurrentSeason()
        if (SeasonalAwards.Season === HolidaySeasons.None) return
        Utility.SimpleTimer(180.0, SeasonalAwards.FreebeSeasonalAwards)
    }

    public static FreebeSeasonalAwards = () => {
        if (SeasonalAwards.Season === HolidaySeasons.Christmas) SeasonalAwards.ChristmasFreebies()
    }

    private static ChristmasFreebies = () => {
        Utility.TimedTextToAllPlayers(
            8.0,
            `${Colors.COLOR_YELLOW}Special thanks to everyone for playing this holiday season! All players have been awarded the snow trail and snow wings from 2023 :)${Colors.COLOR_RESET}`
        )
        const t = createAchesTimer()
        t.Timer.start(
            1.0,
            false,
            ErrorHandler.Wrap(() => {
                AwardManager.GiveRewardAll('SnowTrail2023', false)
                AwardManager.GiveRewardAll('SnowWings2023', false)
                t.dispose()
            })
        )
    }
}
