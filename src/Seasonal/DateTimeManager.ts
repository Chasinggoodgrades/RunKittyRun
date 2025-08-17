import { Globals } from 'src/Global/Globals'
import { Colors } from 'src/Utility/Colors/Colors'

export class DateTimeManager {
    public static DateTime: LuaDateInfoResult
    public static CurrentMonth: number
    public static CurrentDay: number
    public static Test: Date

    public static Initialize = () => {
        // Get the current date/time table directly from Lua
        const now = os.date('*t') as LuaDateInfoResult
        DateTimeManager.SetDateTime(now)
    }

    private static SetDateTime(time: LuaDateInfoResult) {
        DateTimeManager.DateTime = time
        DateTimeManager.CurrentMonth = time.month
        DateTimeManager.CurrentDay = time.day
        Globals.DATE_TIME_LOADED = true
        print(
            `${Colors.COLOR_YELLOW_ORANGE}Lobby date:${Colors.COLOR_RESET} ${Colors.COLOR_LAVENDER}${DateTimeManager.GetStringDateFormat()}${Colors.COLOR_RESET}`
        )
    }
    //     "Date": "2025-08-09 20:45:51",

    public static GetStringDateFormat = () => {
        return `${DateTimeManager.DateTime.year}-${DateTimeManager.DateTime.month}-${DateTimeManager.DateTime.day} ${DateTimeManager.DateTime.hour}:${DateTimeManager.DateTime.min}:${DateTimeManager.DateTime.sec}`
    }
}
