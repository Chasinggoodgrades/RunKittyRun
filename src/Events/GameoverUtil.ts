

class GameoverUtil
{
    public static SetBestGameStats()
    {
        for (let kitty in Globals.ALL_KITTIES)
        {
            switch (Difficulty.DifficultyValue)
            {
                case DifficultyLevel.Normal:
                    SetNormalGameStats(kitty.Value);
                    break;

                case DifficultyLevel.Hard:
                    SetHardGameStats(kitty.Value);
                    break;

                case DifficultyLevel.Impossible:
                    SetImpossibleGameStats(kitty.Value);
                    break;
                case DifficultyLevel.Nightmare:
                    SetNightmareGameStats(kitty.Value);
                    break;
            }
        }
    }

    public static SetColorData()
    {
        for (let kitty in Globals.ALL_KITTIES.Values)
        {
            Colors.PopulateColorsData(kitty); // make sure its populated
            Colors.UpdateColors(kitty); // 
            Colors.GetMostPlayedColor(kitty);
        }
    }

    public static SetFriendData()
    {
        let friendDict : {[x: string]: number} = {}

        for (let kitty in Globals.ALL_KITTIES)
        {
            let friendsPlayedWith = kitty.Value.SaveData.FriendsData.FriendsPlayedWith;

            friendDict.Clear();

            // Splitting / Parsing the data of playerName:count pairs
            if (!string.IsNullOrWhiteSpace(friendsPlayedWith))
            {
                for (let entry in friendsPlayedWith.split(  ',' ,).filter(Boolean))
                {
                    let parts = entry.split(':');
                    if (parts.Length == 2 && int.TryParse(parts[1].Trim(), out int count))
                    {
                        friendDict[parts[0].Trim()] = count;
                    }
                }
            }

            // takes all in-game kitties, increments count if they're present in dictionary else set to 1
            for (let other in Globals.ALL_KITTIES)
            {
                if (other.Value == kitty.Value) continue;
                let friendName: string = other.Value.Player.Name; // Get their full battle tag

                if (friendDict.ContainsKey(friendName))
                {
                    friendDict[friendName]++;
                }
                else
                {
                    friendDict[friendName] = 1;
                }
            }

            // Yoshi said if this wasn't sorted she was gonna hurt me, SO HERE IT IS .. Order By DESC!!
            kitty.Value.SaveData.FriendsData.FriendsPlayedWith =
                string.Join(", ",
                    friendDict.OrderByDescending(kvp => kvp.Value)
                              .Select(kvp => "{kvp.Key}:{kvp.Value}"));
        }
    }

    private static SetNormalGameStats(kitty: Kitty)
    {
        let stats = kitty.SaveData.BestGameTimes.NormalGameTime;
        if (Globals.GAME_TIMER.Remaining > stats.Time && stats.Time != 0) return;
        stats.Time = Globals.GAME_TIMER.Remaining;
        stats.Date = DateTimeManager.DateTime.ToString();
        stats.TeamMembers = GetTeamMembers();
    }

    private static SetHardGameStats(kitty: Kitty)
    {
        let stats = kitty.SaveData.BestGameTimes.HardGameTime;
        if (Globals.GAME_TIMER.Remaining > stats.Time && stats.Time != 0) return;
        stats.Time = Globals.GAME_TIMER.Remaining;
        stats.Date = DateTimeManager.DateTime.ToString();
        stats.TeamMembers = GetTeamMembers();
    }

    private static SetImpossibleGameStats(kitty: Kitty)
    {
        let stats = kitty.SaveData.BestGameTimes.ImpossibleGameTime;
        if (Globals.GAME_TIMER.Remaining > stats.Time && stats.Time != 0) return;
        stats.Time = Globals.GAME_TIMER.Remaining;
        stats.Date = DateTimeManager.DateTime.ToString();
        stats.TeamMembers = GetTeamMembers();
    }

    private static SetNightmareGameStats(kitty: Kitty)
    {
        let stats = kitty.SaveData.BestGameTimes.NightmareGameTime;
        if (Globals.GAME_TIMER.Remaining > stats.Time && stats.Time != 0) return;
        stats.Time = Globals.GAME_TIMER.Remaining;
        stats.Date = DateTimeManager.DateTime.ToString();
        stats.TeamMembers = GetTeamMembers();
    }

    private static GetTeamMembers(): string
    {
        return string.Join(", ", Globals.ALL_PLAYERS.Where(player => player.Controller != mapcontrol.Computer).Select(player => player.Name));
    }
}
