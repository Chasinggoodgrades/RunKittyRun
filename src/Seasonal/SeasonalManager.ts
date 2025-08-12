export enum HolidaySeasons {
    Christmas,
    Halloween,
    Easter,
    Valentines,
    None,
}

export class SeasonalManager {
    public static Season: HolidaySeasons
    private static CurrentMonth: number
    private static SnowEffect: number = FourCC('SNls') // light snow
    private static BlizzardEffect: number = FourCC('SNbs') // blizzard
    private static HeavySnowEffect: number = FourCC('SNhs') // heavy snow
    private static HeavyRain: number = FourCC('RLhr') // heavy rain
    private static LightRain: number = FourCC('RLlr') // light rain
    private static RaysOfLight: number = FourCC('LRaa') // rays of light
    private static RaysOfMoonlight: number = FourCC('LRma') // rays of moonlight
    private static DalaranShield: number = FourCC('MEds') // Dalaran shield
    private static CurrentWeather: weathereffect

    /// <summary>
    /// Must be standard mode for seasonal changes to occur.
    /// </summary>
    public static Initialize() {
        CurrentMonth = DateTimeManager.DateTime.Month
        DetermineSeason()
        SetMinimap()
        SetWeather()
        DoodadChanger.Initialize()
        TerrainChanger.Initialize()
        SeasonalAwards.Initialize()
        ShopChanger.Initialize()
    }

    public static DetermineSeason() {
        if (Gamemode.CurrentGameMode != GameMode.Standard) {
            Season = HolidaySeasons.None
            return
        }
        switch (CurrentMonth) {
            case 12:
                Season = HolidaySeasons.Christmas
                break
            /*            case 10:
                            Season = HolidaySeasons.Halloween;
                            break;

                        case 4:
                            Season = HolidaySeasons.Easter;
                            break;

                        case 2:
                            Season = HolidaySeasons.Valentines;
                            break;*/
            default:
                Season = HolidaySeasons.None
                break
        }
    }

    /// <summary>
    /// Admin command to activate Christmas season. Only works in standard mode.
    /// </summary>
    public static ActivateChristmas() {
        if (Gamemode.CurrentGameMode != GameMode.Standard) return
        Season = HolidaySeasons.Christmas
        TerrainChanger.ActivateChristmasTerrain()
        DoodadChanger.ChristmasDoodads()
        ShopChanger.SetSeasonalShop()
        SetWeather()
        SetMinimap()
    }

    /// <summary>
    /// Admin Command for no seasons. Works regardless of mode.
    /// </summary>
    public static NoSeason() {
        Season = HolidaySeasons.None
        TerrainChanger.NoSeason()
        DoodadChanger.NoSeasonDoodads()
        ShopChanger.SetSeasonalShop()
        SetMinimap()
        SetWeather()
    }

    private static SetMinimap() {
        switch (Season) {
            case HolidaySeasons.Christmas:
                BlzChangeMinimapTerrainTex('snowMap.blp')
                break

            default:
                BlzChangeMinimapTerrainTex('war3mapMap.blp')
                break
        }
    }

    private static SetWeather() {
        if (Season == HolidaySeasons.Christmas) {
            CurrentWeather ??= weathereffect.Create(Globals.WORLD_BOUNDS, SnowEffect)
            SetFloatGameState(GAME_STATE_TIME_OF_DAY, 23)
            SuspendTimeOfDay(true)
            CurrentWeather.Enable()
        } else if (Season == HolidaySeasons.None) {
            CurrentWeather?.Dispose()
            SetFloatGameState(GAME_STATE_TIME_OF_DAY, 12)
            SuspendTimeOfDay(true)
            CurrentWeather = null
        }
    }

    public static SetWeather(weather: string) {
        if (CurrentWeather != null) {
            CurrentWeather.Dispose()
            CurrentWeather = null
        }
        switch (weather.ToLower()) {
            case 'none':
                SetFloatGameState(GAME_STATE_TIME_OF_DAY, 12)
                SuspendTimeOfDay(true)
                break
            case 'snow':
                CurrentWeather = weathereffect.Create(Globals.WORLD_BOUNDS, SnowEffect)
                break
            case 'hrain':
                CurrentWeather = weathereffect.Create(Globals.WORLD_BOUNDS, HeavyRain)
                break
            case 'rain':
                CurrentWeather = weathereffect.Create(Globals.WORLD_BOUNDS, LightRain)
                break
            case 'blizzard':
                CurrentWeather = weathereffect.Create(Globals.WORLD_BOUNDS, BlizzardEffect)
                break
            case 'hsnow':
                CurrentWeather = weathereffect.Create(Globals.WORLD_BOUNDS, HeavySnowEffect)
                break
            case 'rays':
                CurrentWeather = weathereffect.Create(Globals.WORLD_BOUNDS, RaysOfLight)
                break
            case 'moonlight':
                CurrentWeather = weathereffect.Create(Globals.WORLD_BOUNDS, RaysOfMoonlight)
                break
            case 'dalaran':
                CurrentWeather = weathereffect.Create(Globals.WORLD_BOUNDS, DalaranShield)
                break
            default:
                return
        }
        CurrentWeather.Enable()
    }
}
