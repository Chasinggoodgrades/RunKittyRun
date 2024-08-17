using System;
using System.Collections.Generic;
using System.Drawing;
using WCSharp.Api;
using static WCSharp.Api.Common;


public static class Difficulty
{
    public static string DifficultyChosen { get; private set; }
    public static int DifficultyValue { get; private set; }
    private static float TIME_TO_CHOOSE_DIFFICULTY = 10.0f;
    private static int[] DifficultyValues = { 4, 6, 9 };
    private static dialog DifficultyChoosing;
    private static button NormalButton;
    private static button HardButton;
    private static button ImpossibleButton;
    private static Dictionary<button, int> ButtonTallys;
    private static Dictionary<button, string> ButtonNames;
    private const string s_NORMAL = $"{Color.COLOR_YELLOW}Normal|r";
    private const string s_HARD = $"{Color.COLOR_RED}Hard|r";
    private const string s_IMPOSSIBLE = $"{Color.COLOR_DARK_RED}Impossible|r";
    private static trigger Trigger;

    public static bool IsDifficultyChosen { get; set; } = false;
    public static void Initialize()
    {
        if (Gamemode.CurrentGameMode != "Standard") return;

        CreateDialog();
        RegisterSelectionEvent();

        var timer = CreateTimer();
        TimerStart(timer, 3.0f, false, () =>
        {
            ChooseDifficulty();
            timer.Dispose();
        });
    }

    private static void CreateDialog()
    {
        DifficultyChoosing = DialogCreate();
        DifficultyChoosing.SetMessage($"{Color.COLOR_GOLD}Please choose a difficulty.{Color.COLOR_RESET}");
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
        Trigger = CreateTrigger();
        Trigger.RegisterDialogEvent(DifficultyChoosing);
        Trigger.AddAction(() =>
        {
            var player = GetTriggerPlayer();
            var button = GetClickedButton();

            if(!ButtonTallys.ContainsKey(button)) ButtonTallys.Add(button, 0);
            ButtonTallys[button]++;
            DialogDisplay(player, DifficultyChoosing, false);
            Utility.TimedTextToAllPlayers(5.0f, $"{Color.playerColors[player.Id+1]}{player.Name}|r has chosen {ButtonNames[button]} difficulty.");
        });
    }

    private static void ChooseDifficulty()
    {
        foreach(var player in Globals.ALL_PLAYERS)
            DialogDisplay(player, DifficultyChoosing, true);
        var timer = CreateTimer();
        timer.Start(TIME_TO_CHOOSE_DIFFICULTY, false, () =>
        {
            var highestTally = 0;
            button chosenButton = null;
            foreach (var button in ButtonTallys.Keys)
                if (ButtonTallys[button] > highestTally)
                {
                    highestTally = ButtonTallys[button];
                    chosenButton = button;
                }
            if(chosenButton != null) SetDifficulty(ButtonNames[chosenButton]);
            timer.Dispose();
        });
    }

    private static void SetDifficulty(string difficulty)
    {
        switch (difficulty)
        {
            case s_NORMAL:
                DifficultyChosen = s_NORMAL;
                DifficultyValue = DifficultyValues[0];
                break;
            case s_HARD:
                DifficultyChosen = s_HARD;
                DifficultyValue = DifficultyValues[1];
                break;
            case s_IMPOSSIBLE:
                DifficultyChosen = s_IMPOSSIBLE;
                DifficultyValue = DifficultyValues[2];
                break;
        }
        IsDifficultyChosen = true;
        Console.WriteLine($"{difficulty} has been chosen.");
    }

    /* summary
     * Changes the difficulty of the game.
     * 
     * param string={difficulty} The difficulty to change to.
     */
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
