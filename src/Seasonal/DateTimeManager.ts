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
        print(
            `${Colors.COLOR_YELLOW_ORANGE}Lobby date:|r ${Colors.COLOR_LAVENDER}${time.hour}:${time.min}:${time.sec} ${time.day}/${time.month}/${time.year}`
        )
        DateTimeManager.DateTime = time
        DateTimeManager.CurrentMonth = time.month
        DateTimeManager.CurrentDay = time.day
        Globals.DATE_TIME_LOADED = true
    }
}
