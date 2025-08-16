export enum HolidaySeasons {
    Christmas,
    Halloween,
    Easter,
    Valentines,
    None,
}

export class Seasons {
    private static currentSeason: HolidaySeasons = HolidaySeasons.None

    public static getCurrentSeason(): HolidaySeasons {
        return Seasons.currentSeason
    }

    public static setCurrentSeason(season: HolidaySeasons): void {
        Seasons.currentSeason = season
    }
}
