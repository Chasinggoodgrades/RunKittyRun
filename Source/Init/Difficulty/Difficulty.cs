using System;
using WCSharp.Api;

public static class Difficulty
{
    public static int DifficultyValue { get; private set; }
    public static DifficultyOption DifficultyOption { get; private set; }
    public static bool IsDifficultyChosen { get; set; } = false;

    private const float TimeBeforeShowingVote = 2.0f;
    private const float TimeToChooseDifficulty = 10.0f;

    private static SelectionDialog voteDialog;

    public static void Initialize()
    {
        try
        {
            if (Gamemode.CurrentGameMode != GameMode.Standard) return;
            if (IsDifficultyChosen) return;

            DifficultyOption.Initialize();
            voteDialog = BuildVoteDialog();

            Utility.SimpleTimer(TimeBeforeShowingVote, ChooseDifficulty);
        }
        catch (Exception e)
        {
            Logger.Critical($"Error in Difficulty.Initialize: {e.Message}");
            throw;
        }
    }

    private static SelectionDialog BuildVoteDialog()
    {
        var dialog = new SelectionDialog(
            $"{Colors.COLOR_GOLD}Please choose a difficulty{Colors.COLOR_RESET}",
            closeOnSelect: false);

        foreach (var option in DifficultyOption.Options)
        {
            dialog.AddOption(option.ToString(), votingPlayer => RecordVote(option, votingPlayer));
        }

        return dialog;
    }

    private static void RecordVote(DifficultyOption option, player votingPlayer)
    {
        option.TallyCount++;
        Utility.TimedTextToAllPlayers(3.0f, $"{Colors.PlayerNameColored(votingPlayer)}|r has chosen {option} difficulty.{Colors.COLOR_RESET}");
    }

    private static void ChooseDifficulty()
    {
        voteDialog.ShowTo(Globals.ALL_PLAYERS);
        Utility.SimpleTimer(TimeToChooseDifficulty, TallyingVotes);
    }

    private static void TallyingVotes()
    {
        // Guards against the (already-scheduled) timer firing after the
        // difficulty was already forced through some other path, e.g.
        // ChangeDifficulty being called by an admin mid-vote.
        if (IsDifficultyChosen) return;

        DifficultyOption pickedOption = null;
        var highestTallyCount = 0;

        foreach (var option in DifficultyOption.Options)
        {
            if (option.TallyCount > highestTallyCount)
            {
                highestTallyCount = option.TallyCount;
                pickedOption = option;
            }
        }

        // Nobody voted: fall back to Normal rather than leaving pickedOption
        // null (the previous version would null-ref here).
        SetDifficulty(pickedOption ?? FindOption(DifficultyLevel.Normal));
    }

    private static void SetDifficulty(DifficultyOption difficulty)
    {
        voteDialog?.Cancel();

        DifficultyOption = difficulty;
        DifficultyValue = difficulty.Value;
        IsDifficultyChosen = true;
        SetupGamemodeBasedOnDifficulty();
        Console.WriteLine($"{Colors.COLOR_YELLOW_ORANGE}The difficulty has been set to |r{difficulty}{Colors.COLOR_RESET}");
    }

    private static void SetupGamemodeBasedOnDifficulty()
    {
        Gamemode.NumberOfRounds = DifficultyValue == (int)DifficultyLevel.Progressive ? 3 : 5;
    }

    private static DifficultyOption FindOption(DifficultyLevel level)
    {
        return DifficultyOption.Options.Find(o => o.Value == (int)level);
    }

    /// <summary>
    /// Changes the difficulty of the game to the specified difficulty,
    /// bypassing the vote. Cancels any vote still in progress so players
    /// aren't left looking at a dialog whose result will never matter.
    /// </summary>
    /// <param name="difficulty">"normal", "hard", "impossible", ...</param>
    public static bool ChangeDifficulty(string difficulty = "normal")
    {
        difficulty = difficulty.ToLower();

        foreach (var option in DifficultyOption.Options)
        {
            var name = option.Name.ToLower();

            if (name.Contains(difficulty) || name.StartsWith(difficulty))
            {
                SetDifficulty(option);
                return true;
            }
        }
        return false;
    }
}
