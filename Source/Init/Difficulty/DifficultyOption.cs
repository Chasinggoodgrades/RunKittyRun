using System.Collections.Generic;
using WCSharp.Api;

public class DifficultyOption
{
    public static List<DifficultyOption> Options { get; } = new();
    public static dialog DifficultyChoosing = dialog.Create();
    private static int _OptionCount = -1;
    public string Name { get; }
    public int Value { get; }
    public string Color { get; }
    public button Button { get; set; }
    public int TallyCount { get; set; }

    public DifficultyOption(string name, int value, string color)
    {
        Name = name;
        Value = value;
        Color = color;
        Button = AddButton();
        Options.Add(this);
    }

    public button AddButton()
    {
        _OptionCount++;
        return DifficultyChoosing.AddButton($"{Color}{Name}|r", _OptionCount);
    }

    public override string ToString()
    {
        return $"{Color}{Name}|r";
    }

    public static void Initialize()
    {
        Options.Clear();
        new DifficultyOption("Normal", (int)DifficultyLevel.Normal, Colors.COLOR_YELLOW);
        new DifficultyOption("Hard", (int)DifficultyLevel.Hard, Colors.COLOR_RED);
        new DifficultyOption("Impossible", (int)DifficultyLevel.Impossible, Colors.COLOR_DARK_RED);
        // new DifficultyOption("Nightmare", (int)DifficultyLevel.Nightmare, Colors.COLOR_PURPLE);
    }
}

public enum DifficultyLevel
{
    Normal = 4,
    Hard = 6,
    Impossible = 9,
    Nightmare = 12
}
