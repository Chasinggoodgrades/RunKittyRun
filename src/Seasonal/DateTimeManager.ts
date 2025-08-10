class DateTimeManager {
    public static DateTime: WcDateTime
    public static CurrentMonth: number
    public static CurrentDay: number

    public static Initialize() {
        WcDateTime.GetCurrentTime(SetDateTime)
    }

    private static SetDateTime(time: WcDateTime) {
        Console.WriteLine('{Colors.COLOR_YELLOW_ORANGE}date: Lobby:|r {Colors.COLOR_LAVENDER}{time.ToString()}')
        DateTime = time
        CurrentMonth = DateTime.Month
        CurrentDay = DateTime.Day
        Globals.DATE_TIME_LOADED = true
    }
}
