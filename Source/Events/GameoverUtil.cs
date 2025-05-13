using System.Linq;
using WCSharp.Api;

public static class GameoverUtil
{
    public static void SetBestGameStats()
    {
        foreach (var kitty in Globals.ALL_KITTIES)
        {
            switch (Difficulty.DifficultyValue)
            {
                case (int)DifficultyLevel.Normal:
                    SetNormalGameStats(kitty.Value);
                    break;

                case (int)DifficultyLevel.Hard:
                    SetHardGameStats(kitty.Value);
                    break;

                case (int)DifficultyLevel.Impossible:
                    SetImpossibleGameStats(kitty.Value);
                    break;
            }
        }
    }

    public static void SetColorData()
    {
        foreach (var kitty in Globals.ALL_KITTIES.Values)
        {
            Colors.PopulateColorsData(kitty); // make sure its populated
            Colors.UpdateColors(kitty); // 
            Colors.GetMostPlayedColor(kitty);
        }
    }

    private static void SetNormalGameStats(Kitty kitty)
    {
        var stats = kitty.SaveData.BestGameTimes.NormalGameTime;
        if (Globals.GAME_TIMER.Remaining > stats.Time && stats.Time != 0) return;
        stats.Time = Globals.GAME_TIMER.Remaining;
        stats.Date = DateTimeManager.DateTime.ToString();
        stats.TeamMembers = GetTeamMembers();
    }

    private static void SetHardGameStats(Kitty kitty)
    {
        var stats = kitty.SaveData.BestGameTimes.HardGameTime;
        if (Globals.GAME_TIMER.Remaining > stats.Time && stats.Time != 0) return;
        stats.Time = Globals.GAME_TIMER.Remaining;
        stats.Date = DateTimeManager.DateTime.ToString();
        stats.TeamMembers = GetTeamMembers();
    }

    private static void SetImpossibleGameStats(Kitty kitty)
    {
        var stats = kitty.SaveData.BestGameTimes.ImpossibleGameTime;
        if (Globals.GAME_TIMER.Remaining > stats.Time && stats.Time != 0) return;
        stats.Time = Globals.GAME_TIMER.Remaining;
        stats.Date = DateTimeManager.DateTime.ToString();
        stats.TeamMembers = GetTeamMembers();
    }

    private static string GetTeamMembers()
    {
        return string.Join(", ", Globals.ALL_PLAYERS.Where(player => player.Controller != mapcontrol.Computer).Select(player => player.Name));
    }
}
