using System;
using System.Globalization;
using System.Linq;
using WCSharp.DateTime;

public class TournamentSaver
{
    private static TournamentSaver _instance;
    public string GAME_ID { get; private set; }
    public string TOURNAMENT_ID { get; private set; }
    public static TournamentSaver Instance => _instance ??= new TournamentSaver();
    public string REGION { get; private set; } = "";
    public int ApprovedForUpload { get; set; } = 0;

    public TournamentSaver()
    {
        GAME_ID ??= GenerateUniqueGameID();
        TOURNAMENT_ID ??= GenerateUniqueTournamentID();
    }

    public void SetRegion(string region)
    {
        REGION = region;
    }

    /// <summary>
    /// Saves tournament stats for all active kitties during non-standard modes.
    /// </summary>
    public void SaveTournamentData()
    {
        try
        {
            if (Gamemode.CurrentGameMode == GameMode.Standard) return;

            foreach (var kitty in Globals.ALL_KITTIES_LIST)
            {
                if (kitty == null) return;

                var stats = kitty.SaveData?.TournamentStats;
                if (stats == null) return;

                var currentGame = GetCurrentGameData(kitty);
                if (currentGame == null) return;

                if (string.IsNullOrWhiteSpace(stats.Tournament_ID))
                    stats.Tournament_ID = TOURNAMENT_ID;

                if (string.IsNullOrWhiteSpace(stats.PlayerName))
                    stats.PlayerName = kitty.Player.Name;

                if (string.IsNullOrWhiteSpace(stats.DateTime))
                    stats.DateTime = DateTimeManager.DateTime.ToString();

                if (string.IsNullOrWhiteSpace(stats.Region))
                    stats.Region = REGION;

                if (stats.AdminApproved == 0 && ApprovedForUpload == 1)
                    stats.AdminApproved = ApprovedForUpload;

                stats.Gamemode = Gamemode.CurrentGameMode.ToString();
                stats.GameType = Gamemode.CurrentGameModeType;

                if (Gamemode.CurrentGameMode == GameMode.Team && kitty.TeamID > 0)
                {
                    currentGame.Team = TeamsUtil.GetTeamColor(kitty);
                    currentGame.TeamMembers = TeamsUtil.GetTeamMembers(kitty);
                }
                else if (Gamemode.CurrentGameMode == GameMode.Solo)
                    currentGame.Team = "Solo";

                SaveRoundTime(kitty, currentGame);
                SaveRoundProgress(kitty, currentGame);
                SaveRoundSaves(kitty, currentGame);
                SaveRoundDeaths(kitty, currentGame);
                SaveRoundLevel(kitty, currentGame);

                UpdateTotals(currentGame);

            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error saving tournament data: {ex.Message} " + ex.StackTrace);
        }
    }

    /// <summary>
    /// Saves the current round time into the active tournament game.
    /// </summary>
    private void SaveRoundTime(Kitty kitty, TournamentGameData currentGame)
    {
        var roundData = GetCurrentRoundData(currentGame);
        if (roundData == null) return;

        if (Gamemode.CurrentGameMode == GameMode.Team
            && Globals.PLAYERS_TEAMS.TryGetValue(kitty.Player, out var team)
            && team.TeamTimes.TryGetValue(Globals.ROUND, out var teamTime))
        {
            roundData.RoundTime = teamTime;
            return;
        }

        roundData.RoundTime = kitty.TimeProg.GetRoundTime(Globals.ROUND);
    }

    /// <summary>
    /// Saves the current round progress into the active tournament game.
    /// </summary>
    private void SaveRoundProgress(Kitty kitty, TournamentGameData currentGame)
    {
        var roundData = GetCurrentRoundData(currentGame);
        if (roundData == null) return;

        if (Gamemode.CurrentGameMode == GameMode.Team
            && Globals.PLAYERS_TEAMS.TryGetValue(kitty.Player, out var team)
            && team.RoundProgress.TryGetValue(Globals.ROUND, out var teamProgress)
            && float.TryParse(teamProgress, NumberStyles.Float, CultureInfo.InvariantCulture, out var progress))
        {
            roundData.Progress = progress;
            return;
        }

        roundData.Progress = kitty.TimeProg.GetRoundProgress(Globals.ROUND);
    }

    /// <summary>
    /// Saves the current round saves into the active tournament game.
    /// </summary>
    private void SaveRoundSaves(Kitty kitty, TournamentGameData currentGame)
    {
        var roundData = GetCurrentRoundData(currentGame);
        if (roundData == null) return;

        roundData.Saves = kitty.CurrentStats.RoundSaves;
    }

    /// <summary>
    /// Saves the current round deaths into the active tournament game.
    /// </summary>
    private void SaveRoundDeaths(Kitty kitty, TournamentGameData currentGame)
    {
        var roundData = GetCurrentRoundData(currentGame);
        if (roundData == null) return;

        roundData.Deaths = kitty.CurrentStats.RoundDeaths;
    }

    /// <summary>
    /// Saves the current round hero level into the active tournament game.
    /// </summary>
    private void SaveRoundLevel(Kitty kitty, TournamentGameData currentGame)
    {
        var roundData = GetCurrentRoundData(currentGame);
        if (roundData == null) return;

        roundData.Level = kitty.Unit.HeroLevel;
    }

    /// <summary>
    /// Recalculates totals for the active tournament game.
    /// </summary>
    private void UpdateTotals(TournamentGameData currentGame)
    {
        if (currentGame == null) return;
        currentGame.TotalTime = currentGame.Round_1.RoundTime + currentGame.Round_2.RoundTime + currentGame.Round_3.RoundTime + currentGame.Round_4.RoundTime + currentGame.Round_5.RoundTime;
        currentGame.TotalProgress = currentGame.Round_1.Progress + currentGame.Round_2.Progress + currentGame.Round_3.Progress + currentGame.Round_4.Progress + currentGame.Round_5.Progress;
        currentGame.TotalSaves = currentGame.Round_1.Saves + currentGame.Round_2.Saves + currentGame.Round_3.Saves + currentGame.Round_4.Saves + currentGame.Round_5.Saves;
        currentGame.TotalDeaths = currentGame.Round_1.Deaths + currentGame.Round_2.Deaths + currentGame.Round_3.Deaths + currentGame.Round_4.Deaths + currentGame.Round_5.Deaths;
    }

    /// <summary>
    /// Gets the tournament round data for the active game and current round.
    /// </summary>
    private TournamentRoundData GetCurrentRoundData(TournamentGameData currentGame)
    {
        if (currentGame == null) return null;

        switch (Globals.ROUND)
        {
            case 1:
                return currentGame.Round_1;
            case 2:
                return currentGame.Round_2;
            case 3:
                return currentGame.Round_3;
            case 4:
                return currentGame.Round_4;
            case 5:
                return currentGame.Round_5;
            default:
                return null;
        }
    }

    /// <summary>
    /// Determines which tournament game slot should receive data based on last played time.
    /// </summary>
    private TournamentGameData GetCurrentGameData(Kitty kitty)
    {
        var stats = kitty.SaveData.TournamentStats;
        if (stats == null) return null;

        // Get current game if possible
        var inProgressGame = GetInProgressGame(stats);
        if (inProgressGame != null) return inProgressGame;

        var currentTime = DateTimeManager.DateTime;
        if (!TryGetLastGameTime(stats.DateTime, currentTime, out var lastGameTime))
        {
            Logger.Debug($"Failed to parse last game time for player {kitty.Player.Name}. Defaulting to current time.");
            stats.DateTime = currentTime.ToString();
        }

        // Over 12 hours, reset all games

        Logger.Debug($"Current Time: {currentTime}, Last Game Time: {lastGameTime}, Elapsed Seconds: {(currentTime.TotalSeconds - lastGameTime.TotalSeconds)}");

        var elapsedSeconds = currentTime.TotalSeconds - lastGameTime.TotalSeconds;
        if (elapsedSeconds >= 12 * 3600) // 12 hours
        {
            ResetAllGamesData(stats, currentTime);
            return stats.Game_1;
        }

        // If gamemodes or types arent matching.. then reset.
        if (stats.Gamemode != Gamemode.CurrentGameMode.ToString() || stats.GameType != Gamemode.CurrentGameModeType)
        {
            ResetAllGamesData(stats, currentTime);
            return stats.Game_1;
        }

        // if no slots availalbe, just reset it all
        var currentGame = GetNextAvailableGame(stats);
        if (currentGame == null)
        {
            ResetAllGamesData(stats, currentTime);
            return stats.Game_1;
        }
        currentGame.Reset(); // reset game slot to clear residue data.
        currentGame.Game_ID = GAME_ID;

        return currentGame;
    }

    /// <summary>
    /// Resets all tournament game slots and stamps the new game timestamp.
    /// </summary>
    private bool ResetAllGamesData(TournamentStats stats, WcDateTime currentTime)
    {
        stats.Reset();
        stats.DateTime = currentTime.ToString();
        stats.Game_1.Game_ID = GAME_ID;
        return true;
    }

    /// <summary>
    /// Resets all tournament game slots and stamps the new game timestamp.
    /// </summary>
    public bool ResetAllGamesData(Kitty kitty)
    {
        var stats = kitty?.SaveData?.TournamentStats;
        if (stats == null) return false;
        stats.Reset();
        stats.DateTime = DateTimeManager.DateTime.ToString();
        stats.Game_1.Game_ID = GAME_ID;
        return true;
    }

    /// <summary>
    /// Attempts to parse the saved game timestamp into a WcDateTime instance.
    /// </summary>
    private bool TryGetLastGameTime(string savedTime, WcDateTime fallbackTime, out WcDateTime lastGameTime)
    {
        if (string.IsNullOrWhiteSpace(savedTime))
        {
            lastGameTime = fallbackTime;
            return false;
        }

        try
        {
            if (TryParseSavedDateTime(savedTime, out lastGameTime))
            {
                return true;
            }

            lastGameTime = fallbackTime;
            return false;
        }
        catch (Exception)
        {
            lastGameTime = fallbackTime;
            return false;
        }
    }

    private static bool TryParseSavedDateTime(string savedTime, out WcDateTime parsedDateTime)
    {
        parsedDateTime = null;
        if (string.IsNullOrWhiteSpace(savedTime)) return false;

        var trimmed = savedTime.Trim();
        if (trimmed.Length < 19) return false;

        if (trimmed[4] != '-' || trimmed[7] != '-' || (trimmed[10] != ' ' && trimmed[10] != 'T') || trimmed[13] != ':' || trimmed[16] != ':')
            return false;

        if (!int.TryParse(trimmed.Substring(0, 4), NumberStyles.None, CultureInfo.InvariantCulture, out var year)) return false;
        if (!int.TryParse(trimmed.Substring(5, 2), NumberStyles.None, CultureInfo.InvariantCulture, out var month)) return false;
        if (!int.TryParse(trimmed.Substring(8, 2), NumberStyles.None, CultureInfo.InvariantCulture, out var day)) return false;
        if (!int.TryParse(trimmed.Substring(11, 2), NumberStyles.None, CultureInfo.InvariantCulture, out var hour)) return false;
        if (!int.TryParse(trimmed.Substring(14, 2), NumberStyles.None, CultureInfo.InvariantCulture, out var minute)) return false;
        if (!int.TryParse(trimmed.Substring(17, 2), NumberStyles.None, CultureInfo.InvariantCulture, out var second)) return false;

        parsedDateTime = new WcDateTime(year, month, day, hour, minute, second);
        return true;
    }

    /// <summary>
    /// Gets the next available tournament game slot.
    /// </summary>
    private TournamentGameData GetNextAvailableGame(TournamentStats stats)
    {
        if (IsGameEmpty(stats.Game_1))
        {
            ResetAllGamesData(stats, DateTimeManager.DateTime); // includes tournament_ID to reset.
            return stats.Game_1;
        }
        if (IsGameEmpty(stats.Game_2)) return stats.Game_2;
        if (IsGameEmpty(stats.Game_3)) return stats.Game_3;
        return null;
    }

    /// <summary>
    /// Finds an active game slot that already has data recorded.
    /// </summary>
    private TournamentGameData GetInProgressGame(TournamentStats stats)
    {
        // returning the game slot that has the same Game_ID as the current GAME_ID, if none match, return null
        if (stats.Game_1 != null && stats.Game_1.Game_ID == GAME_ID) return stats.Game_1;
        if (stats.Game_2 != null && stats.Game_2.Game_ID == GAME_ID) return stats.Game_2;
        if (stats.Game_3 != null && stats.Game_3.Game_ID == GAME_ID) return stats.Game_3;
        return null;
    }

    /// <summary>
    /// Determines whether a game slot has any stored data.
    /// </summary>
    private bool IsGameEmpty(TournamentGameData game)
    {
        if (game == null) return true;
        if (IsRoundEmpty(game.Round_1)
            || IsRoundEmpty(game.Round_2)
            || IsRoundEmpty(game.Round_3)
            || IsRoundEmpty(game.Round_4)
            || IsRoundEmpty(game.Round_5))
            return true;

        if (!string.IsNullOrWhiteSpace(game.Game_ID)) return false;

        return game.TotalTime <= 0.0f
            && game.TotalProgress <= 0.0f
            && game.TotalSaves == 0
            && game.TotalDeaths == 0;
    }

    private bool IsRoundEmpty(TournamentRoundData round)
    {
        if (round == null) return true;

        return round.RoundTime <= 0.0f
            && round.Progress <= 0.0f
            && round.Saves == 0
            && round.Deaths == 0;
    }

    /// <summary>
    /// Generates a short unique game ID using the current timestamp.
    /// </summary>
    private string GenerateUniqueGameID()
    {
        var currentTime = DateTimeManager.DateTime;
        var guid = GenerateGUID();
        var stringToConvert = $"{guid}{currentTime.ToString()}";
        var base64String = WCSharp.Shared.Base64.ToBase64(stringToConvert);
        return base64String.Substring(0, base64String.Length - 2);
    }

    private string GenerateUniqueTournamentID()
    {
        var currentTime = DateTimeManager.DateTime;
        var guid = GenerateGUID();
        var stringToConvert = $"{guid}{currentTime.ToString()}";
        var base64String = WCSharp.Shared.Base64.ToBase64(stringToConvert);
        return base64String.Substring(0, base64String.Length - 2);
    }

    private static string GenerateGUID()
    {
        byte[] b = new byte[16];
        Globals.RANDOM_GEN_02.NextBytes(b);

        // UUIDv4
        b[6] = (byte)((b[6] & 0x0F) | 0x40);
        b[8] = (byte)((b[8] & 0x3F) | 0x80);

        // formats into hex string with dashes
        return string.Format(
            "{0:x2}{1:x2}{2:x2}{3:x2}-" +
            "{4:x2}{5:x2}-" +
            "{6:x2}{7:x2}-" +
            "{8:x2}{9:x2}-" +
            "{10:x2}{11:x2}{12:x2}{13:x2}{14:x2}{15:x2}",
            b[0], b[1], b[2], b[3],
            b[4], b[5],
            b[6], b[7],
            b[8], b[9],
            b[10], b[11], b[12], b[13], b[14], b[15]
        );
    }


}
