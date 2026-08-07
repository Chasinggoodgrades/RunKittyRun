using WCSharp.Api;

public static class ClearScreen
{
    private static trigger Trigger = trigger.Create();

    public static void Initialize()
    {
        foreach (var player in Globals.ALL_PLAYERS)
            Trigger.RegisterPlayerKeyEvent(player, oskeytype.Oem3, 0, true); // `  backtick key
        Trigger.AddAction(ESCPressed);
    }

    private static void ESCPressed()
    {
        Utility.ClearScreen(@event.Player);
    }

}
