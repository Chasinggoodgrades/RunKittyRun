using System;
using WCSharp.Api;
using WCSharp.DateTime;
public static class DateTimeManager
{
    public static WcDateTime DateTime { get; private set; }
    public static int CurrentMonth { get; private set; }

    public static void Initialize()
    {
        WcDateTime.GetCurrentTime(SetDateTime);
    }

    private static void SetDateTime(WcDateTime time)
    {
        Console.WriteLine($"{Colors.COLOR_YELLOW_ORANGE}Lobby date:|r {Colors.COLOR_LAVENDER}{time.ToString()}");
        DateTime = time;
        CurrentMonth = DateTime.Month;
    }


}