using System;
using WCSharp.Api;

public static class PlayerLeaves
{
    private static trigger Trigger = trigger.Create();

    public static void Initialize()
    {
        RegisterTrigger();
    }

    private static void RegisterTrigger()
    {
        foreach (var player in Globals.ALL_PLAYERS)
        {
            Trigger.RegisterPlayerEvent(player, playerevent.Leave);
        }
        Trigger.AddAction(ErrorHandler.Wrap(() => PlayerLeavesActions()));
    }

    public static void PlayerLeavesActions(player player = null)
    {
        try
        {
            var leavingPlayer = @event.Player;
            if (player != null) leavingPlayer = player;
            if (!Globals.ALL_PLAYERS.Contains(leavingPlayer)) return;
            var kitty = Globals.ALL_KITTIES[leavingPlayer];
            Gamemode.Current.OnPlayerLeft(leavingPlayer);
            kitty?.Dispose(); // disposes of circle and nametag now
            if (!Gameover.WinGame) Globals.ALL_PLAYERS.Remove(leavingPlayer);
            Console.WriteLine(Colors.PlayerNameColored(leavingPlayer) + Colors.COLOR_YELLOW_ORANGE + " has left the game.");
            RoundManager.RoundEndCheck();
            if (Gameover.WinGame) return;
            MultiboardUtil.RefreshMultiboards();
        }
        catch (Exception e)
        {
            Console.WriteLine("Error in PlayerLeavesActions: " + e.Message);
        }
    }
}
