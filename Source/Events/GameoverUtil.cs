using System.Linq;
using WCSharp.Api;
public static class GameoverUtil
{
    public static void SetBestGameStats()
    {
        foreach(var kitty in Globals.ALL_KITTIES.Values)
        {
            switch (Difficulty.DifficultyValue)
            {
                case (int)DifficultyLevel.Normal:
                    SetNormalGameStats(kitty);
                    break;
                case (int)DifficultyLevel.Hard:
                    SetHardGameStats(kitty);
                    break;
                case (int)DifficultyLevel.Impossible:
                    SetImpossibleGameStats(kitty);
                    break;
            }
        }
    }

    private static void SetNormalGameStats(Kitty kitty)
    {
        var stats = kitty.SaveData.BestGameTimes.NormalGameTime;
        Logger.Verbose($"Normal Game Time: {stats.Time} | Remaining: {Globals.GAME_TIMER.Remaining}");
        if (Globals.GAME_TIMER.Remaining > stats.Time && stats.Time != 0) return;
        stats.Time = Globals.GAME_TIMER.Remaining;
        stats.TeamMembers = GetTeamMembers();
        stats.Date = DateTimeManager.DateTime.ToString();
    }

    private static void SetHardGameStats(Kitty kitty)
    {
        var stats = kitty.SaveData.BestGameTimes.HardGameTime;
        Logger.Verbose($"Hard Game Time: {stats.Time} | Remaining: {Globals.GAME_TIMER.Remaining}");
        if (Globals.GAME_TIMER.Remaining > stats.Time && stats.Time != 0) return;
        stats.Time = Globals.GAME_TIMER.Remaining;
        stats.TeamMembers = GetTeamMembers();
        stats.Date = DateTimeManager.DateTime.ToString();
    }

    private static void SetImpossibleGameStats(Kitty kitty)
    {
        var stats = kitty.SaveData.BestGameTimes.ImpossibleGameTime;
        Logger.Verbose($"Impossible Game Time: {stats.Time} | Remaining: {Globals.GAME_TIMER.Remaining}");
        if (Globals.GAME_TIMER.Remaining > stats.Time && stats.Time != 0) return;
        stats.Time = Globals.GAME_TIMER.Remaining;
        stats.TeamMembers = GetTeamMembers();
        stats.Date = DateTimeManager.DateTime.ToString();
    }

    private static string GetTeamMembers()
    {
        return string.Join(", ", Globals.ALL_PLAYERS.Select(player => player.Name));
    }


}