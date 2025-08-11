class DifficultyOption {
    public static Options: DifficultyOption[] = []
    public static DifficultyChoosing: dialog = dialog.Create()
    private static _OptionCount: number = -1
    public Name: string
    public Value: number
    public Color: string
    public Button: button
    public TallyCount: number

    public DifficultyOption(name: string, value: number, color: string) {
        Name = name
        Value = value
        Color = color
        Button = AddButton()
        Options.Add(this)
    }

    public AddButton(): button {
        return DifficultyChoosing.AddButton('{Color}{Name}|r', ++_OptionCount)
    }

    public override ToString(): string {
        return '{Color}{Name}|r'
    }

    public static Initialize() {
        Options.Clear()
        new DifficultyOption('Normal', DifficultyLevel.Normal, Colors.COLOR_YELLOW)
        new DifficultyOption('Hard', DifficultyLevel.Hard, Colors.COLOR_RED)
        new DifficultyOption('Impossible', DifficultyLevel.Impossible, Colors.COLOR_DARK_RED)
        new DifficultyOption('Nightmare', DifficultyLevel.Nightmare, Colors.COLOR_PURPLE)
    }
}

export enum DifficultyLevel {
    Normal = 4,
    Hard = 6,
    Impossible = 9,
    Nightmare = 11,
}
