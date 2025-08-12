class DifficultyOption {
    public static Options: DifficultyOption[] = []
    public static DifficultyChoosing: dialog = DialogCreate()!
    private static _OptionCount: number = -1
    public Name!: string
    public Value!: number
    public Color!: string
    public Button!: button
    public TallyCount!: number

    constructor(name: string, value: number, color: string) {
        this.Name = name
        this.Value = value
        this.Color = color
        this.Button = this.AddButton()
        DifficultyOption.Options.push(this)
    }

    public AddButton(): button {
        return DialogAddButton(DifficultyOption.DifficultyChoosing, this.ToString(), ++DifficultyOption._OptionCount)!
    }

    public ToString(): string {
        return '{Color}{Name}|r'
    }

    public static Initialize() {
        DifficultyOption.Options = []
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
