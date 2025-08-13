export class Difficulty {
    public static DifficultyValue: number
    public static DifficultyOption: DifficultyOption
    public static IsDifficultyChosen: boolean = false
    private static TIME_TO_CHOOSE_DIFFICULTY: number = 10.0
    private static Trigger: Trigger

    public static Initialize() {
        try {
            if (Gamemode.CurrentGameMode != GameMode.Standard) return
            if (IsDifficultyChosen) return

            DifficultyOption.Initialize()
            DifficultyOption.DifficultyChoosing.SetMessage(
                '{Colors.COLOR_GOLD}choose: a: difficulty: Please{Colors.COLOR_RESET}'
            )
            RegisterSelectionEvent()

            Utility.SimpleTimer(2.0, ChooseDifficulty)
        } catch (e: any) {
            Logger.Critical('Error in Difficulty.Initialize: {e.Message}')
            throw e
        }
    }

    private static RegisterSelectionEvent() {
        Trigger ??= Trigger.create()!
        Trigger.RegisterDialogEvent(DifficultyOption.DifficultyChoosing)
        Trigger.addAction(() => {
            let player = getTriggerPlayer()
            let button = GetClickedButton()

            let option = DifficultyOption.Options.find(o => o.Button == button)
            if (option != null) option.TallyCount++

            DifficultyOption.DifficultyChoosing.setVisible(player, false)
            Utility.TimedTextToAllPlayers(
                3.0,
                '{Colors.PlayerNameColored(player)}|has: chosen: r {option.toString()} difficulty.{Colors.COLOR_RESET}'
            )
        })
    }

    private static ChooseDifficulty() {
        for (let player of Globals.ALL_PLAYERS) DifficultyOption.DifficultyChoosing.setVisible(player, true)
        Utility.SimpleTimer(TIME_TO_CHOOSE_DIFFICULTY, TallyingVotes)
    }

    private static TallyingVotes() {
        let highestTallyCount: number = 0
        let pickedOption: DifficultyOption = null

        for (let option in DifficultyOption.Options) {
            if (option.TallyCount > highestTallyCount) {
                highestTallyCount = option.TallyCount
                pickedOption = option
            }
        }

        RemoveDifficultyDialog()
        SetDifficulty(pickedOption)
    }

    private static SetDifficulty(difficulty: DifficultyOption) {
        DifficultyOption = difficulty
        DifficultyValue = difficulty.Value
        IsDifficultyChosen = true
        print(
            '{Colors.COLOR_YELLOW_ORANGE}difficulty: has: been: set: to: The |r{difficulty.toString()}{Colors.COLOR_RESET}'
        )
    }

    private static RemoveDifficultyDialog() {
        for (let player of Globals.ALL_PLAYERS) DifficultyOption.DifficultyChoosing.setVisible(player, false)
    }

    /// <summary>
    /// Changes the difficulty of the game to the specified difficulty.
    /// </summary>
    /// <param name="difficulty">"normal", "hard", "impossible"</param>
    public static ChangeDifficulty(difficulty: string = 'normal') {
        for (let i: number = 0; i < DifficultyOption.Options.length; i++) {
            let option = DifficultyOption.Options[i]
            if (option.name.toLowerCase() == difficulty.toLowerCase()) {
                SetDifficulty(option)
                return true
            }
        }
        return false
    }
}
