using System;
using System.Collections.Generic;
using WCSharp.Api;

public enum DifficultyLevel
{
    Normal = 4,
    Hard = 6,
    Impossible = 9
}

public static class Difficulty
{
    public const string s_NORMAL = $"{Colors.COLOR_YELLOW}Normal|r";
    public const string s_HARD = $"{Colors.COLOR_RED}Hard|r";
    public const string s_IMPOSSIBLE = $"{Colors.COLOR_DARK_RED}Impossible|r";
    public static string DifficultyChosen { get; private set; } = "";
    public static int DifficultyValue { get; private set; }
    public static bool IsDifficultyChosen = false;
    private static float TIME_TO_CHOOSE_DIFFICULTY = 10.0f;
    private static dialog DifficultyChoosing;
    private static button NormalButton;
    private static button HardButton;
    private static button ImpossibleButton;
    private static Dictionary<button, int> ButtonTallys;
    private static Dictionary<button, string> ButtonNames;

    private static trigger Trigger;

    public static void Initialize()
    {
        if (Gamemode.CurrentGameMode != "Standard") return;

        CreateDialog();
        RegisterSelectionEvent();

        Utility.SimpleTimer(2.0f, () => ChooseDifficulty());
    }

    private static void CreateDialog()
    {
        DifficultyChoosing = dialog.Create();
        DifficultyChoosing.SetMessage($"{Colors.COLOR_GOLD}Please choose a difficulty{Colors.COLOR_RESET}");
        NormalButton = DifficultyChoosing.AddButton(s_NORMAL, 1);
        HardButton = DifficultyChoosing.AddButton(s_HARD, 2);
        ImpossibleButton = DifficultyChoosing.AddButton(s_IMPOSSIBLE, 3);
        ButtonTallys = new Dictionary<button, int>();
        ButtonNames = new Dictionary<button, string> {
            { NormalButton, s_NORMAL },
            { HardButton, s_HARD },
            { ImpossibleButton, s_IMPOSSIBLE }
        };
    }

    private static void RegisterSelectionEvent()
    {
        Trigger = trigger.Create();
        Trigger.RegisterDialogEvent(DifficultyChoosing);
        Trigger.AddAction(() =>
        {
            var player = @event.Player;
            var button = @event.ClickedButton;

            if(!ButtonTallys.ContainsKey(button)) ButtonTallys.Add(button, 0);
            ButtonTallys[button]++;
            DifficultyChoosing.SetVisibility(player, false);
            Utility.TimedTextToAllPlayers(3.0f, $"{Colors.PlayerNameColored(player)}|r has chosen {ButtonNames[button]} difficulty.");
        });
    }

    private static void ChooseDifficulty()
    {
        foreach(var player in Globals.ALL_PLAYERS)
            DifficultyChoosing.SetVisibility(player, true);
        Utility.SimpleTimer(TIME_TO_CHOOSE_DIFFICULTY, () => TallyingVotes());
    }

    private static void TallyingVotes()
    {
        var highestTally = 0;
        button chosenButton = null;
        foreach (var button in ButtonTallys.Keys)
            if (ButtonTallys[button] > highestTally)
            {
                highestTally = ButtonTallys[button];
                chosenButton = button;
            }
        RemoveDifficultyDialog();
        if (chosenButton != null) SetDifficulty(ButtonNames[chosenButton]);
    }

    private static void SetDifficulty(string difficulty)
    {
        switch (difficulty)
        {
            case s_NORMAL:
                DifficultyChosen = s_NORMAL;
                DifficultyValue = (int)DifficultyLevel.Normal;
                break;
            case s_HARD:
                DifficultyChosen = s_HARD;
                DifficultyValue = (int)DifficultyLevel.Hard;
                break;
            case s_IMPOSSIBLE:
                DifficultyChosen = s_IMPOSSIBLE;
                DifficultyValue = (int)DifficultyLevel.Impossible;
                break;
        }
        IsDifficultyChosen = true;
        Console.WriteLine($"{Colors.COLOR_YELLOW_ORANGE}The difficulty has been set to |r{difficulty}");
    }

    private static void RemoveDifficultyDialog()
    {
        foreach(var player in Globals.ALL_PLAYERS)
            DifficultyChoosing.SetVisibility(player, false);
    }


    /// <summary>
    /// Changes the difficulty of the game to the specified difficulty.
    /// </summary>
    /// <param name="difficulty">"normal", "hard", "impossible"</param>
    public static void ChangeDifficulty(string difficulty)
    {
        switch (difficulty)
        {
            case "normal":
                SetDifficulty(s_NORMAL);
                break;
            case "hard":
                SetDifficulty(s_HARD);
                break;
            case "impossible":
                SetDifficulty(s_IMPOSSIBLE);
                break;
        }
    }

}
