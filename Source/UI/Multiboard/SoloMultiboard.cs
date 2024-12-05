using WCSharp.Api;

public static class SoloMultiboard
{
    private static multiboard SoloOverallStatsMB;
    private static multiboard SoloBestTimesMB;
    private static trigger ESCTrigger;

    /// <summary>
    /// Initializes the solo multiboards. Only works in tournament solo mode.
    /// </summary>
    public static void Initialize()
    {
        if (Gamemode.CurrentGameMode != Globals.GAME_MODES[1]) return;
        SoloOverallStatsMB = multiboard.Create();
        SoloBestTimesMB = multiboard.Create();
        CreateMultiboards();
        RegisterTriggers();
    }

    private static void CreateMultiboards()
    {

    }

    private static void RegisterTriggers()
    {
        ESCTrigger = trigger.Create();
        foreach (var player in Globals.ALL_PLAYERS)
            ESCTrigger.RegisterPlayerEvent(player, playerevent.EndCinematic);
        ESCTrigger.AddAction(ESCPressed);
    }

    private static void ESCPressed()
    {
        var player = @event.Player;
        if (Gamemode.CurrentGameMode != Globals.GAME_MODES[1]) return; // Solo mode
        if (!@event.Player.IsLocal) return;
    }

}