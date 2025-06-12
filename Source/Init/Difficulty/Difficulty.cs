using System;
using WCSharp.Api;

public static class Difficulty
{
    public static int DifficultyValue { get; private set; }
    public static DifficultyOption DifficultyOption { get; private set; }
    public static bool IsDifficultyChosen { get; set; } = false;
    private static float TIME_TO_CHOOSE_DIFFICULTY = 10.0f;
    private static trigger Trigger;

    public static void Initialize()
    {
        if (Gamemode.CurrentGameMode != "Standard") return;
        if (IsDifficultyChosen) return;

        DifficultyOption.Initialize();
        DifficultyOption.DifficultyChoosing.SetMessage($"{Colors.COLOR_GOLD}Please choose a difficulty{Colors.COLOR_RESET}");
        RegisterSelectionEvent();

        Utility.SimpleTimer(2.0f, ChooseDifficulty);
    }

    private static void RegisterSelectionEvent()
    {
        Trigger = trigger.Create();
        Trigger.RegisterDialogEvent(DifficultyOption.DifficultyChoosing);
        Trigger.AddAction(() =>
        {
            var player = @event.Player;
            var button = @event.ClickedButton;

            var option = DifficultyOption.Options.Find(o => o.Button == button);
            if (option != null) option.TallyCount++;

            DifficultyOption.DifficultyChoosing.SetVisibility(player, false);
            Utility.TimedTextToAllPlayers(3.0f, $"{Colors.PlayerNameColored(player)}|r has chosen {option.ToString()} difficulty.{Colors.COLOR_RESET}");
        });
    }

    private static void ChooseDifficulty()
    {
        foreach (var player in Globals.ALL_PLAYERS)
            DifficultyOption.DifficultyChoosing.SetVisibility(player, true);
        Utility.SimpleTimer(TIME_TO_CHOOSE_DIFFICULTY, TallyingVotes);
    }

    private static void TallyingVotes()
    {
        int highestTallyCount = 0;
        DifficultyOption pickedOption = null;

        foreach (var option in DifficultyOption.Options)
        {
            if (option.TallyCount > highestTallyCount)
            {
                highestTallyCount = option.TallyCount;
                pickedOption = option;
            }
        }

        RemoveDifficultyDialog();
        SetDifficulty(pickedOption);
    }

    private static void SetDifficulty(DifficultyOption difficulty)
    {
        DifficultyOption = difficulty;
        DifficultyValue = difficulty.Value;
        IsDifficultyChosen = true;
        Console.WriteLine($"{Colors.COLOR_YELLOW_ORANGE}The difficulty has been set to |r{difficulty.ToString()}{Colors.COLOR_RESET}");
    }

    private static void RemoveDifficultyDialog()
    {
        foreach (var player in Globals.ALL_PLAYERS)
            DifficultyOption.DifficultyChoosing.SetVisibility(player, false);
    }

    /// <summary>
    /// Changes the difficulty of the game to the specified difficulty.
    /// </summary>
    /// <param name="difficulty">"normal", "hard", "impossible"</param>
    public static bool ChangeDifficulty(string difficulty = "normal")
    {
        for (int i = 0; i < DifficultyOption.Options.Count; i++)
        {
            var option = DifficultyOption.Options[i];
            if (option.Name.ToLower() == difficulty.ToLower())
            {
                SetDifficulty(option);
                return true;
            }
        }
        return false;
    }
}



