import { Logger } from 'src/Events/Logger/Logger'
import { CurrentGameMode } from 'src/Gamemodes/CurrentGameMode'
import { GameMode } from 'src/Gamemodes/GameModeEnum'
import { Globals } from 'src/Global/Globals'
import { Colors } from 'src/Utility/Colors/Colors'
import { ColorUtils } from 'src/Utility/Colors/ColorUtils'
import { Utility } from 'src/Utility/Utility'
import { getTriggerPlayer } from 'src/Utility/w3tsUtils'
import { Trigger } from 'w3ts'
import { DifficultyOption } from './DifficultyOption'

export class Difficulty {
    public static DifficultyValue: number
    public static DifficultyOption: DifficultyOption
    public static IsDifficultyChosen = false
    private static TIME_TO_CHOOSE_DIFFICULTY = 10.0
    private static triggerHandle: Trigger

    public static Initialize = () => {
        try {
            if (CurrentGameMode.active !== GameMode.Standard) return
            if (Difficulty.IsDifficultyChosen) return

            DifficultyOption.Initialize()
            DifficultyOption.DifficultyChoosing.setMessage(
                `${Colors.COLOR_GOLD}Please choose a difficulty${Colors.COLOR_RESET}`
            )
            Difficulty.RegisterSelectionEvent()

            Utility.SimpleTimer(2.0, () => Difficulty.ChooseDifficulty())
        } catch (e) {
            Logger.Critical(`Error in Difficulty.Initialize: ${e}`)
            throw e
        }
    }

    private static RegisterSelectionEvent = () => {
        Difficulty.triggerHandle ??= Trigger.create()!
        Difficulty.triggerHandle.registerDialogEvent(DifficultyOption.DifficultyChoosing)
        Difficulty.triggerHandle.addAction(() => {
            const player = getTriggerPlayer()
            const button = GetClickedButton()

            const option = DifficultyOption.Options.find(o => o.Button.handle === button)
            if (option) option.TallyCount++

            DifficultyOption.DifficultyChoosing.display(player, false)
            Utility.TimedTextToAllPlayers(
                3.0,
                `${ColorUtils.PlayerNameColored(player)}|r has chosen ${option?.toString()} difficulty.${Colors.COLOR_RESET}`
            )
        })
    }

    private static ChooseDifficulty = () => {
        for (const player of Globals.ALL_PLAYERS) DifficultyOption.DifficultyChoosing.display(player, true)
        Utility.SimpleTimer(Difficulty.TIME_TO_CHOOSE_DIFFICULTY, () => Difficulty.TallyingVotes())
    }

    private static TallyingVotes = () => {
        let highestTallyCount = 0
        let pickedOption: DifficultyOption | null = null

        for (const option of DifficultyOption.Options) {
            if (option.TallyCount > highestTallyCount) {
                highestTallyCount = option.TallyCount
                pickedOption = option
            }
        }

        Difficulty.RemoveDifficultyDialog()
        if (!pickedOption) print('picked option is null')
        if (pickedOption) Difficulty.SetDifficulty(pickedOption)
    }

    private static SetDifficulty = (difficulty: DifficultyOption) => {
        Difficulty.DifficultyOption = difficulty
        Difficulty.DifficultyValue = difficulty.Value
        Difficulty.IsDifficultyChosen = true
        print(
            `${Colors.COLOR_YELLOW_ORANGE}The difficulty has been set to |r${difficulty.toString()}${Colors.COLOR_RESET}`
        )
    }

    private static RemoveDifficultyDialog = () => {
        for (const player of Globals.ALL_PLAYERS) DifficultyOption.DifficultyChoosing.display(player, false)
    }

    /// <summary>
    /// Changes the difficulty of the game to the specified difficulty.
    /// </summary>
    /// <param name="difficulty">"normal", "hard", "impossible"</param>
    public static ChangeDifficulty = (difficulty = 'normal') => {
        for (let i = 0; i < DifficultyOption.Options.length; i++) {
            const option = DifficultyOption.Options[i]
            if (option.name.toLowerCase() === difficulty.toLowerCase()) {
                Difficulty.SetDifficulty(option)
                return true
            }
        }
        return false
    }
}
