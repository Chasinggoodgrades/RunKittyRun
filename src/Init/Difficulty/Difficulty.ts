class Difficulty {
    public static DifficultyValue: number
    public static DifficultyOption: DifficultyOption
    public static IsDifficultyChosen: boolean = false
    private static TIME_TO_CHOOSE_DIFFICULTY: number = 10.0
    private static Trigger: trigger

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
        } catch (e: Error) {
            Logger.Critical('Error in Difficulty.Initialize: {e.Message}')
            throw e
        }
    }

    private static RegisterSelectionEvent() {
        Trigger ??= trigger.Create()
        Trigger.RegisterDialogEvent(DifficultyOption.DifficultyChoosing)
        Trigger.AddAction(() => {
            let player = GetTriggerPlayer()
            let button = GetClickedButton()

            let option = DifficultyOption.Options.Find(o => o.Button == button)
            if (option != null) option.TallyCount++

            DifficultyOption.DifficultyChoosing.SetVisibility(player, false)
            Utility.TimedTextToAllPlayers(
                3.0,
                '{Colors.PlayerNameColored(player)}|has: chosen: r {option.ToString()} difficulty.{Colors.COLOR_RESET}'
            )
        })
    }

    private static ChooseDifficulty() {
        for (let player in Globals.ALL_PLAYERS) DifficultyOption.DifficultyChoosing.SetVisibility(player, true)
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
        Console.WriteLine(
            '{Colors.COLOR_YELLOW_ORANGE}difficulty: has: been: set: to: The |r{difficulty.ToString()}{Colors.COLOR_RESET}'
        )
    }

    private static RemoveDifficultyDialog() {
        for (let player in Globals.ALL_PLAYERS) DifficultyOption.DifficultyChoosing.SetVisibility(player, false)
    }

    /// <summary>
    /// Changes the difficulty of the game to the specified difficulty.
    /// </summary>
    /// <param name="difficulty">"normal", "hard", "impossible"</param>
    public static ChangeDifficulty(difficulty: string = 'normal') {
        for (let i: number = 0; i < DifficultyOption.Options.Count; i++) {
            let option = DifficultyOption.Options[i]
            if (option.Name.ToLower() == difficulty.ToLower()) {
                SetDifficulty(option)
                return true
            }
        }
        return false
    }
}
