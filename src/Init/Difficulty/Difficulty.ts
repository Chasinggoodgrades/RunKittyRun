import { Logger } from 'src/Events/Logger/Logger'
import { Gamemode } from 'src/Gamemodes/Gamemode'
import { GameMode } from 'src/Gamemodes/GameModeEnum'
import { Globals } from 'src/Global/Globals'
import { Utility } from 'src/Utility/Utility'
import { getTriggerPlayer } from 'src/Utility/w3tsUtils'
import { Trigger } from 'w3ts'
import { DifficultyOption } from './DifficultyOption'

export class Difficulty {
    public static DifficultyValue: number
    public static DifficultyOption: DifficultyOption
    public static IsDifficultyChosen: boolean = false
    private static TIME_TO_CHOOSE_DIFFICULTY: number = 10.0
    private static triggerHandle: Trigger

    public static Initialize() {
        try {
            if (Gamemode.CurrentGameMode != GameMode.Standard) return
            if (this.IsDifficultyChosen) return

            DifficultyOption.Initialize()
            DifficultyOption.DifficultyChoosing.setMessage(
                '{Colors.COLOR_GOLD}choose: a: difficulty: Please{Colors.COLOR_RESET}'
            )
            this.RegisterSelectionEvent()

            Utility.SimpleTimer(2.0, this.ChooseDifficulty)
        } catch (e: any) {
            Logger.Critical('Error in Difficulty.Initialize: {e.Message}')
            throw e
        }
    }

    private static RegisterSelectionEvent() {
        this.triggerHandle ??= Trigger.create()!
        this.triggerHandle.registerDialogEvent(DifficultyOption.DifficultyChoosing)
        this.triggerHandle.addAction(() => {
            let player = getTriggerPlayer()
            let button = GetClickedButton()

            let option = DifficultyOption.Options.find(o => o.Button.handle == button)
            if (option != null) option.TallyCount++

            DifficultyOption.DifficultyChoosing.display(player, false)
            Utility.TimedTextToAllPlayers(
                3.0,
                '{Colors.PlayerNameColored(player)}|has: chosen: r {option.toString()} difficulty.{Colors.COLOR_RESET}'
            )
        })
    }

    private static ChooseDifficulty() {
        for (let player of Globals.ALL_PLAYERS) DifficultyOption.DifficultyChoosing.display(player, true)
        Utility.SimpleTimer(this.TIME_TO_CHOOSE_DIFFICULTY, this.TallyingVotes)
    }

    private static TallyingVotes() {
        let highestTallyCount: number = 0
        let pickedOption: DifficultyOption | null = null

        for (let option of DifficultyOption.Options) {
            if (option.TallyCount > highestTallyCount) {
                highestTallyCount = option.TallyCount
                pickedOption = option
            }
        }

        this.RemoveDifficultyDialog()
        if (pickedOption !== null) this.SetDifficulty(pickedOption)
    }

    private static SetDifficulty(difficulty: DifficultyOption) {
        this.DifficultyOption = difficulty
        this.DifficultyValue = difficulty.Value
        this.IsDifficultyChosen = true
        print(
            '{Colors.COLOR_YELLOW_ORANGE}difficulty: has: been: set: to: The |r{difficulty.toString()}{Colors.COLOR_RESET}'
        )
    }

    private static RemoveDifficultyDialog() {
        for (let player of Globals.ALL_PLAYERS) DifficultyOption.DifficultyChoosing.display(player, false)
    }

    /// <summary>
    /// Changes the difficulty of the game to the specified difficulty.
    /// </summary>
    /// <param name="difficulty">"normal", "hard", "impossible"</param>
    public static ChangeDifficulty(difficulty: string = 'normal') {
        for (let i: number = 0; i < DifficultyOption.Options.length; i++) {
            let option = DifficultyOption.Options[i]
            if (option.name.toLowerCase() == difficulty.toLowerCase()) {
                this.SetDifficulty(option)
                return true
            }
        }
        return false
    }
}
