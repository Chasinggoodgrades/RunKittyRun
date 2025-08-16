import { Colors } from 'src/Utility/Colors/Colors'
import { Dialog, DialogButton } from 'w3ts'

export class DifficultyOption {
    public static Options: DifficultyOption[] = []
    public static DifficultyChoosing: Dialog = Dialog.create()!
    private static _OptionCount: number = -1
    public name: string
    public Value: number
    public Color: string
    public Button: DialogButton
    public TallyCount: number

    constructor(name: string, value: number, color: string) {
        this.name = name
        this.Value = value
        this.Color = color
        this.Button = this.AddButton()
        DifficultyOption.Options.push(this)
    }

    public AddButton(): DialogButton {
        return DifficultyOption.DifficultyChoosing.addButton(this.toString(), ++DifficultyOption._OptionCount)!
    }

    public ToString(): string {
        return `${this.Color}${this.name}|r`
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
