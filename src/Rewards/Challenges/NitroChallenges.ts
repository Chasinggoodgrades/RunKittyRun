class NitroChallenges {
    private static NitroRoundTimes: { [x: number]: number }
    private static NitroTimer: timer = timer.Create()
    private static NitroDialog: timerdialog = timerdialog.Create(NitroTimer)

    public static Initialize() {
        NitroRoundTimes = {}
    }

    public static GetNitroTimeRemaining(): number {
        return NitroTimer.Remaining
    }

    public static SetNitroRoundTimes() {
        NitroRoundTimes.Clear()
        switch (Difficulty.DifficultyValue) {
            case DifficultyLevel.Normal:
                SetNormalNitroRoundTimes()
                break

            case DifficultyLevel.Hard:
                SetHardNitroRoundTimes()
                break

            case DifficultyLevel.Impossible:
                SetImpossibleNitroRoundTimes()
                break
            case DifficultyLevel.Nightmare:
                SetImpossibleNitroRoundTimes() // Nightmare Nitros at a later date.. Cannot determine at the moment what it should be.
                break
            default:
                // Gamemode being solo / team;
                SetNormalNitroRoundTimes()
                break
        }
    }

    private static SetNormalNitroRoundTimes() {
        NitroRoundTimes.Add(1, 125) // 2:05
        NitroRoundTimes.Add(2, 140) // 2:20
        NitroRoundTimes.Add(3, 160) // 2:40
        NitroRoundTimes.Add(4, 215) // 3:35
        NitroRoundTimes.Add(5, 330) // 5:30
    }

    private static SetHardNitroRoundTimes() {
        NitroRoundTimes.Add(1, 125) // 2:05
        NitroRoundTimes.Add(2, 145) // 2:25
        NitroRoundTimes.Add(3, 170) // 2:50
        NitroRoundTimes.Add(4, 215) // 3:35
        NitroRoundTimes.Add(5, 330) // 5:30
    }

    private static SetImpossibleNitroRoundTimes() {
        NitroRoundTimes.Add(1, 125) // 2:05
        NitroRoundTimes.Add(2, 150) // 2:30
        NitroRoundTimes.Add(3, 175) // 2:55
        NitroRoundTimes.Add(4, 215) // 3:35
        NitroRoundTimes.Add(5, 330) // 5:30
    }

    public static StartNitroTimer() {
        NitroDialog.SetTitle('Nitro: ')
        NitroDialog.SetTitleColor(0, 255, 50)
        NitroDialog.IsDisplayed = true
        NitroTimer.Start(NitroRoundTimes[Globals.ROUND], false, ErrorHandler.Wrap(StopNitroTimer))
    }

    public static StopNitroTimer() {
        NitroDialog.IsDisplayed = false
        NitroTimer.Pause()
    }

    public static CompletedNitro(kitty: Kitty) {
        if (NitroTimer.Remaining <= 0.0) return
        if (Safezone.CountHitSafezones(kitty.Player) <= 12) {
            kitty.Player.DisplayTimedTextTo(
                6.0,
                "{Colors.COLOR_RED}didn: You'hit: enough: safezones: on: your: own: to: obtain: nitro: t."
            )
            return
        }

        AwardingNitroEvents(kitty)
        AwardingDivineLight(kitty)
    }

    private static AwardingNitroEvents(kitty: Kitty) {
        let nitroCount = kitty.CurrentStats.NitroCount
        let player = kitty.Player
        if (nitroCount == Globals.ROUND) return // already awarded
        if (NitroTimer == null || NitroTimer.Remaining <= 0.0 || !NitroDialog.IsDisplayed) return
        let round = Globals.ROUND

        switch (round) {
            case 1:
                AwardManager.GiveReward(player, 'Nitro')
                if (Difficulty.DifficultyValue >= DifficultyLevel.Impossible)
                    AwardManager.GiveReward(player, 'DivineLight')
                break

            case 2:
                AwardManager.GiveReward(player, 'NitroBlue')
                if (Difficulty.DifficultyValue >= DifficultyLevel.Impossible)
                    AwardManager.GiveReward(player, 'AzureLight')
                break

            case 3:
                AwardManager.GiveReward(player, 'NitroRed')
                if (Difficulty.DifficultyValue >= DifficultyLevel.Impossible)
                    AwardManager.GiveReward(player, 'CrimsonLight')
                break

            case 4:
                AwardManager.GiveReward(player, 'NitroGreen')
                Challenges.ButterflyAura(player)
                if (Difficulty.DifficultyValue >= DifficultyLevel.Impossible)
                    AwardManager.GiveReward(player, 'EmeraldLight')
                break

            case 5:
                AwardManager.GiveReward(player, 'NitroPurple')
                if (Difficulty.DifficultyValue >= DifficultyLevel.Impossible)
                    AwardManager.GiveReward(player, 'VioletLight')
                break

            default:
                break
        }

        PlayNitroSound(player)

        let currentStats = kitty.CurrentStats
        if (!currentStats.ObtainedNitros.Contains(round)) currentStats.ObtainedNitros.Add(round)

        currentStats.NitroCount += 1
        kitty.SaveData.GameStats.NitrosObtained += 1
    }

    private static AwardingDivineLight(kitty: Kitty) {
        if (Difficulty.DifficultyValue >= DifficultyLevel.Impossible) return
        let requiredCount = 5
        if (Difficulty.DifficultyValue == DifficultyLevel.Hard) requiredCount = 4

        if (kitty.CurrentStats.NitroCount == requiredCount) AwardManager.GiveReward(kitty.Player, 'DivineLight')
    }

    private static PlayNitroSound(player: player) {
        if (Globals.ALL_KITTIES[player].CurrentStats.NitroObtained) return // first time
        Globals.ALL_KITTIES[player].CurrentStats.NitroObtained = true
        SoundManager.PlaySpeedSound()
    }
}
