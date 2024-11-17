public static class ADMINDISABLE
{
    public static bool AdminOnly { get; private set; } = true;
    public static bool AdminsGame()
    {
        if (!AdminOnly) return true;
        foreach(var player in Globals.ALL_PLAYERS)
        {
            if (Utility.IsDeveloper(player)) return true;
        }
        foreach (var player in Globals.ALL_PLAYERS)
        {
            player.DisplayTimedTextTo(60.0f, $"{Colors.COLOR_RED}This map is in the testing phase. Admins only... Coming out soon.");
            player.Remove(WCSharp.Api.playergameresult.Defeat);
        }
        return false;
    }
}