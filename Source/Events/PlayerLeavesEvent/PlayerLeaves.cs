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
        Trigger.AddAction(() => PlayerLeavesActions());
    }

    public static void TeamRemovePlayer(player player)
    {
        if (Gamemode.CurrentGameMode != Globals.GAME_MODES[2]) return;
        Globals.PLAYERS_TEAMS[player].RemoveMember(player);
    }

    public static void PlayerLeavesActions(player player = null)
    {
        try
        {
            var leavingPlayer = @event.Player;
            if (player != null) leavingPlayer = player;
            if (!Globals.ALL_PLAYERS.Contains(leavingPlayer)) return;
            var kitty = Globals.ALL_KITTIES[leavingPlayer];
            var circle = Globals.ALL_CIRCLES[leavingPlayer];
            var nameTag = FloatingNameTag.PlayerNameTags[leavingPlayer];
            TeamRemovePlayer(leavingPlayer);
            kitty.Dispose();
            circle.Dispose();
            nameTag.Dispose();
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
