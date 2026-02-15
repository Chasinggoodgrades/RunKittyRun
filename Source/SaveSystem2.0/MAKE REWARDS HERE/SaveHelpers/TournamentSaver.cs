using System;
using System.Globalization;

public class TournamentSaver
{
    private static TournamentSaver _instance;
    public static TournamentSaver Instance => _instance ??= new TournamentSaver();

    public void SaveTournamentData()
    {
        foreach (var kitty in Globals.ALL_KITTIES_LIST)
        {
            if (Gamemode.CurrentGameMode == GameMode.Standard) return;
            if (kitty == null) return;

            var stats = kitty.SaveData?.TournamentStats;
            if (stats == null) return;

            if (string.IsNullOrWhiteSpace(stats.PlayerName))
                stats.PlayerName = kitty.Player.Name;

            if (string.IsNullOrWhiteSpace(stats.DateTime))
                stats.DateTime = DateTimeManager.DateTime.ToString();

            if (string.IsNullOrWhiteSpace(stats.Region))
                stats.Region = "Unknown";

            stats.Gamemode = Gamemode.CurrentGameMode.ToString();
            stats.GameType = Gamemode.CurrentGameModeType;

            if (Gamemode.CurrentGameMode == GameMode.TeamTournament && kitty.TeamID > 0)
            {
                stats.Team = TeamsUtil.GetTeamColor(kitty);
                stats.TeamMembers = TeamsUtil.GetTeamMembers(kitty);
            }
            else if (Gamemode.CurrentGameMode == GameMode.SoloTournament)
                stats.Team = "Solo";

            SaveRoundTime(kitty);
            SaveRoundProgress(kitty);
            SaveRoundSaves(kitty);
            SaveRoundDeaths(kitty);
            SaveRoundLevel(kitty);

            UpdateTotals(kitty);
        }
    }

    public void NewTournamentResetData()
    {
        foreach (var kitty in Globals.ALL_KITTIES_LIST)
        {
            if (Gamemode.CurrentGameMode == GameMode.Standard) return;
            if (kitty == null) return;
            var stats = kitty.SaveData?.TournamentStats;
            if (stats == null) return;
            stats.DateTime = string.Empty;
            stats.Region = string.Empty;
            stats.Gamemode = string.Empty;
            stats.GameType = string.Empty;
            stats.Team = string.Empty;
            stats.Round_1.Reset();
            stats.Round_2.Reset();
            stats.Round_3.Reset();
            stats.Round_4.Reset();
            stats.Round_5.Reset();
            stats.TotalTime = 0f;
            stats.TotalProgress = 0f;
            stats.TotalSaves = 0;
            stats.TotalDeaths = 0;
        }
    }

    private void SaveRoundTime(Kitty kitty)
    {
        var roundData = GetCurrentRoundData(kitty);
        if (roundData == null) return;

        if (Gamemode.CurrentGameMode == GameMode.TeamTournament
            && Globals.PLAYERS_TEAMS.TryGetValue(kitty.Player, out var team)
            && team.TeamTimes.TryGetValue(Globals.ROUND, out var teamTime))
        {
            roundData.RoundTime = teamTime;
            return;
        }

        roundData.RoundTime = kitty.TimeProg.GetRoundTime(Globals.ROUND);
    }

    private void SaveRoundProgress(Kitty kitty)
    {
        var roundData = GetCurrentRoundData(kitty);
        if (roundData == null) return;

        if (Gamemode.CurrentGameMode == GameMode.TeamTournament
            && Globals.PLAYERS_TEAMS.TryGetValue(kitty.Player, out var team)
            && team.RoundProgress.TryGetValue(Globals.ROUND, out var teamProgress)
            && float.TryParse(teamProgress, NumberStyles.Float, CultureInfo.InvariantCulture, out var progress))
        {
            roundData.Progress = progress;
            return;
        }

        roundData.Progress = kitty.TimeProg.GetRoundProgress(Globals.ROUND);
    }

    private void SaveRoundSaves(Kitty kitty)
    {
        var roundData = GetCurrentRoundData(kitty);
        if (roundData == null) return;

        roundData.Saves = kitty.CurrentStats.RoundSaves;
    }

    private void SaveRoundDeaths(Kitty kitty)
    {
        var roundData = GetCurrentRoundData(kitty);
        if (roundData == null) return;

        roundData.Deaths = kitty.CurrentStats.RoundDeaths;
    }

    private void SaveRoundLevel(Kitty kitty)
    {
        var roundData = GetCurrentRoundData(kitty);
        if (roundData == null) return;

        roundData.Level = kitty.Unit.HeroLevel;
    }

    private void UpdateTotals(Kitty kitty)
    {
        var stats = kitty.SaveData?.TournamentStats;
        if (stats == null) return;
        stats.TotalTime = stats.Round_1.RoundTime + stats.Round_2.RoundTime + stats.Round_3.RoundTime + stats.Round_4.RoundTime + stats.Round_5.RoundTime;
        stats.TotalProgress = stats.Round_1.Progress + stats.Round_2.Progress + stats.Round_3.Progress + stats.Round_4.Progress + stats.Round_5.Progress;
        stats.TotalSaves = stats.Round_1.Saves + stats.Round_2.Saves + stats.Round_3.Saves + stats.Round_4.Saves + stats.Round_5.Saves;
        stats.TotalDeaths = stats.Round_1.Deaths + stats.Round_2.Deaths + stats.Round_3.Deaths + stats.Round_4.Deaths + stats.Round_5.Deaths;
    }

    // Get current round TournamentData property
    // When calling SaveRoundTime, we should be able to call this method to get the current round's TournamentData property to update Round_1 or Round_2 etc.. with proper time.

    private TournamentRoundData GetCurrentRoundData(Kitty kitty)
    {
        var stats = kitty.SaveData.TournamentStats;
        if (stats == null) return null;

        switch (Globals.ROUND)
        {
            case 1:
                return stats.Round_1;
            case 2:
                return stats.Round_2;
            case 3:
                return stats.Round_3;
            case 4:
                return stats.Round_4;
            case 5:
                return stats.Round_5;
            default:
                return null;
        }
    }
}
