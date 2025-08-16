import { CurrentGameMode } from 'src/Gamemodes/CurrentGameMode'
import { GameMode } from 'src/Gamemodes/GameModeEnum'
import { Globals } from 'src/Global/Globals'
import { WeatherEffect } from 'w3ts'
import { DateTimeManager } from './DateTimeManager'
import { DoodadChanger } from './Doodads/DoodadChanger'
import { SeasonalAwards } from './SeasonalAwards'
import { ShopChanger } from './Shop/ShopChanger'
import { TerrainChanger } from './Terrain/TerrainChanger'

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
    private static CurrentWeather: WeatherEffect

    /// <summary>
    /// Must be standard mode for seasonal changes to occur.
    /// </summary>
    public static Initialize() {
        SeasonalManager.CurrentMonth = DateTimeManager.DateTime.month
        SeasonalManager.DetermineSeason()
        SeasonalManager.SetMinimap()
        SeasonalManager.SetWeather()
        DoodadChanger.Initialize()
        TerrainChanger.Initialize()
        SeasonalAwards.Initialize()
        ShopChanger.Initialize()
    }

    public static DetermineSeason() {
        if (CurrentGameMode.active !== GameMode.Standard) {
            SeasonalManager.Season = HolidaySeasons.None
            return
        }
        switch (SeasonalManager.CurrentMonth) {
            case 12:
                SeasonalManager.Season = HolidaySeasons.Christmas
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
                SeasonalManager.Season = HolidaySeasons.None
                break
        }
    }

    /// <summary>
    /// Admin command to activate Christmas season. Only works in standard mode.
    /// </summary>
    public static ActivateChristmas() {
        if (CurrentGameMode.active !== GameMode.Standard) return
        SeasonalManager.Season = HolidaySeasons.Christmas
        TerrainChanger.ActivateChristmasTerrain()
        DoodadChanger.ChristmasDoodads()
        ShopChanger.SetSeasonalShop()
        SeasonalManager.SetWeather()
        SeasonalManager.SetMinimap()
    }

    /// <summary>
    /// Admin Command for no seasons. Works regardless of mode.
    /// </summary>
    public static NoSeason() {
        SeasonalManager.Season = HolidaySeasons.None
        TerrainChanger.NoSeason()
        DoodadChanger.NoSeasonDoodads()
        ShopChanger.SetSeasonalShop()
        SeasonalManager.SetMinimap()
        SeasonalManager.SetWeather()
    }

    private static SetMinimap() {
        switch (SeasonalManager.Season) {
            case HolidaySeasons.Christmas:
                BlzChangeMinimapTerrainTex('snowMap.blp')
                break

            default:
                BlzChangeMinimapTerrainTex('war3mapMap.blp')
                break
        }
    }

    private static SetWeather() {
        if (SeasonalManager.Season === HolidaySeasons.Christmas) {
            SeasonalManager.CurrentWeather ??= WeatherEffect.create(Globals.WORLD_BOUNDS, SeasonalManager.SnowEffect)!
            SetFloatGameState(GAME_STATE_TIME_OF_DAY, 23)
            SuspendTimeOfDay(true)
            SeasonalManager.CurrentWeather.enable(true)
        } else if (SeasonalManager.Season === HolidaySeasons.None) {
            SeasonalManager.CurrentWeather?.destroy()
            SetFloatGameState(GAME_STATE_TIME_OF_DAY, 12)
            SuspendTimeOfDay(true)
            SeasonalManager.CurrentWeather = null as never
        }
    }

    public static SetWeatherArg(weather: string) {
        if (SeasonalManager.CurrentWeather !== null) {
            SeasonalManager.CurrentWeather.destroy()
            SeasonalManager.CurrentWeather = null as never
        }

        switch (weather.toLowerCase()) {
            case 'none':
                SetFloatGameState(GAME_STATE_TIME_OF_DAY, 12)
                SuspendTimeOfDay(true)
                break
            case 'snow':
                SeasonalManager.CurrentWeather = WeatherEffect.create(Globals.WORLD_BOUNDS, SeasonalManager.SnowEffect)!
                break
            case 'hrain':
                SeasonalManager.CurrentWeather = WeatherEffect.create(Globals.WORLD_BOUNDS, SeasonalManager.HeavyRain)!
                break
            case 'rain':
                SeasonalManager.CurrentWeather = WeatherEffect.create(Globals.WORLD_BOUNDS, SeasonalManager.LightRain)!
                break
            case 'blizzard':
                SeasonalManager.CurrentWeather = WeatherEffect.create(
                    Globals.WORLD_BOUNDS,
                    SeasonalManager.BlizzardEffect
                )!
                break
            case 'hsnow':
                SeasonalManager.CurrentWeather = WeatherEffect.create(
                    Globals.WORLD_BOUNDS,
                    SeasonalManager.HeavySnowEffect
                )!
                break
            case 'rays':
                SeasonalManager.CurrentWeather = WeatherEffect.create(
                    Globals.WORLD_BOUNDS,
                    SeasonalManager.RaysOfLight
                )!
                break
            case 'moonlight':
                SeasonalManager.CurrentWeather = WeatherEffect.create(
                    Globals.WORLD_BOUNDS,
                    SeasonalManager.RaysOfMoonlight
                )!
                break
            case 'dalaran':
                SeasonalManager.CurrentWeather = WeatherEffect.create(
                    Globals.WORLD_BOUNDS,
                    SeasonalManager.DalaranShield
                )!
                break
            default:
                return
        }

        SeasonalManager.CurrentWeather.enable(true)
    }
}
