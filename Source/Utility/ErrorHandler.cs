using System;
using static WCSharp.Api.Common;
using WCSharp.Api;

public static class ErrorHandler
{
    /// <summary>
    /// Players need MORE than this many games played to receive error messages. Newer players are spared the noise.
    /// </summary>
    public const int ExperiencedGamesThreshold = 10;

    private static readonly bool[] showErrorsTo = new bool[24];
    private static bool evaluated = false;

    // Per-player choice made with -error on/off. null = no choice made, so the experience default applies.
    private static readonly bool?[] playerOverride = new bool?[24];

    public static void SetPlayerOverride(player player, bool show)
    {
        if (player.Id < 0 || player.Id >= playerOverride.Length) return;
        playerOverride[player.Id] = show;
    }

    /// <summary>
    /// Snapshots who should see error messages. Called once at the start of the game, before this game's count is incremented.
    /// </summary>
    public static void EvaluatePlayers()
    {
        if (evaluated) return;
        for (int i = 0; i < Globals.ALL_PLAYERS.Count; i++)
        {
            var player = Globals.ALL_PLAYERS[i];
            showErrorsTo[player.Id] = IsExperienced(player);
        }
        evaluated = true;
    }

    public static bool ShouldShowErrors(player player)
    {
        if (player.Id < 0 || player.Id >= showErrorsTo.Length) return false;
        if (playerOverride[player.Id].HasValue) return playerOverride[player.Id].Value; // explicit -error on/off wins
        return evaluated ? showErrorsTo[player.Id] : IsExperienced(player); // before the snapshot, fall back to a live check
    }

    private static bool IsExperienced(player player)
    {
        var data = SaveManager.SaveData[player.Id];
        if (data == null) return false;
        var stats = data.GameStats;
        if (stats == null) return false;
        var summed = stats.NormalGames + stats.HardGames + stats.ImpossibleGames + stats.NightmareGames + stats.ProgressiveGames;
        return Math.Max(stats.TotalGames, summed) > ExperiencedGamesThreshold;
    }
    public static Action Wrap(Action cb, Action<Exception>? errorCb = null)
    {
        return () =>
        {
            try
            {
                cb.Invoke();
            }
            catch (Exception e)
            {
                Logger.Warning($"Error caught: " + e.Message + "\n" + e.StackTrace);
                errorCb?.Invoke(e);
            }
        };
    }
}
