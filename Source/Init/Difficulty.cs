using System;
using System.Collections.Generic;
using System.Drawing;
using WCSharp.Api;
using static WCSharp.Api.Common;


public static class Difficulty
{
    private static dialog DifficultyChoosing;
    private static button NormalButton;
    private static button HardButton;
    private static button InsaneButton;
    private static string s_NORMAL = $"{Color.COLOR_YELLOW}Normal";
    private static string s_HARD = $"{Color.COLOR_RED}Hard";
    private static string s_IMPOSSIBLE = $"{Color.COLOR_DARK_RED}Impossible";

    public static bool IsDifficultyChosen { get; set; } = false;
    public static void Initialize()
    {
        DifficultyChoosing = DialogCreate();
        NormalButton = DialogAddButton(DifficultyChoosing, s_NORMAL, 1);
        HardButton = DialogAddButton(DifficultyChoosing, s_HARD, 2);
        InsaneButton = DialogAddButton(DifficultyChoosing, s_IMPOSSIBLE, 3);
    }

    private static void ChooseDifficulty()
    {

    }

    private static void SetDifficulty()
    {
        IsDifficultyChosen = true;
        Console.WriteLine("Difficulty has been set.");
    }

    public static void ChangeDifficulty(string difficulty)
    {
        switch (difficulty)
        {
            case "normal":
                SetDifficulty();
                break;
            case "hard":
                SetDifficulty();
                break;
            case "impossible":
                SetDifficulty();
                break;
            default:
                Console.WriteLine($"{Color.COLOR_YELLOW_ORANGE}Invalid difficulty.|r");
                break;
        }
    }
}
