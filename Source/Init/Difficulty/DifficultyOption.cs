using System.Collections.Generic;

/// <summary>
/// A single difficulty tier that can be voted on. Pure data - the dialog and
/// button wiring live in <see cref="Difficulty"/>, which owns a
/// SelectionDialog and maps each of its buttons back to one of these.
/// </summary>
public class DifficultyOption
{
    public static List<DifficultyOption> Options { get; } = new List<DifficultyOption>();

    public string Name { get; }
    public int Value { get; }
    public string Color { get; }
    public int TallyCount { get; set; }

    public DifficultyOption(string name, int value, string color)
    {
        Name = name;
        Value = value;
        Color = color;
        Options.Add(this);
    }

    public override string ToString()
    {
        return $"{Color}{Name}|r";
    }

    public static void Initialize()
    {
        Options.Clear();
        new DifficultyOption("Progressive (3 Rounds)", (int)DifficultyLevel.Progressive, Colors.COLOR_GREEN);
        new DifficultyOption("Normal", (int)DifficultyLevel.Normal, Colors.COLOR_YELLOW);
        new DifficultyOption("Hard", (int)DifficultyLevel.Hard, Colors.COLOR_RED);
        new DifficultyOption("Impossible", (int)DifficultyLevel.Impossible, Colors.COLOR_DARK_RED);
        new DifficultyOption("Nightmare", (int)DifficultyLevel.Nightmare, Colors.COLOR_PURPLE);
    }
}

public enum DifficultyLevel
{
    Normal = 4,
    Hard = 6,
    Impossible = 9,
    Nightmare = 11,
    Progressive = 99
}
