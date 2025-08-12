import { Kitty } from 'src/Game/Entities/Kitty/Kitty'
import { Safezone } from 'src/Game/Management/Safezone'
import { Globals } from 'src/Global/Globals'
import { Difficulty } from 'src/Init/Difficulty/Difficulty'
import { DifficultyLevel } from 'src/Init/Difficulty/DifficultyOption'
import { SoundManager } from 'src/Sounds/SoundManager'
import { ErrorHandler } from 'src/Utility/ErrorHandler'
import { Timer, TimerDialog } from 'w3ts'
import { AwardManager } from '../Rewards/AwardManager'
import { Challenges } from './Challenges'

export class NitroChallenges {
    private static NitroRoundTimes: Map<number, number>
    private static NitroTimer = Timer.create()
    private static NitroDialog = TimerDialog.create(NitroChallenges.NitroTimer)!

    public static Initialize() {
        NitroChallenges.NitroRoundTimes.clear()
    }

    public static GetNitroTimeRemaining(): number {
        return NitroChallenges.NitroTimer.remaining
    }

    public static SetNitroRoundTimes() {
        NitroChallenges.NitroRoundTimes.clear()
        switch (Difficulty.DifficultyValue) {
            case DifficultyLevel.Normal:
                NitroChallenges.SetNormalNitroRoundTimes()
                break

            case DifficultyLevel.Hard:
                NitroChallenges.SetHardNitroRoundTimes()
                break

            case DifficultyLevel.Impossible:
                NitroChallenges.SetImpossibleNitroRoundTimes()
                break
            case DifficultyLevel.Nightmare:
                NitroChallenges.SetImpossibleNitroRoundTimes() // Nightmare Nitros at a later date.. Cannot determine at the moment what it should be.
                break
            default:
                // Gamemode being solo / team;
                NitroChallenges.SetNormalNitroRoundTimes()
                break
        }
    }

    private static SetNormalNitroRoundTimes() {
        NitroChallenges.NitroRoundTimes.set(1, 125) // 2:05
        NitroChallenges.NitroRoundTimes.set(2, 140) // 2:20
        NitroChallenges.NitroRoundTimes.set(3, 160) // 2:40
        NitroChallenges.NitroRoundTimes.set(4, 215) // 3:35
        NitroChallenges.NitroRoundTimes.set(5, 330) // 5:30
    }

    private static SetHardNitroRoundTimes() {
        NitroChallenges.NitroRoundTimes.set(1, 125) // 2:05
        NitroChallenges.NitroRoundTimes.set(2, 145) // 2:25
        NitroChallenges.NitroRoundTimes.set(3, 170) // 2:50
        NitroChallenges.NitroRoundTimes.set(4, 215) // 3:35
        NitroChallenges.NitroRoundTimes.set(5, 330) // 5:30
    }

    private static SetImpossibleNitroRoundTimes() {
        NitroChallenges.NitroRoundTimes.set(1, 125) // 2:05
        NitroChallenges.NitroRoundTimes.set(2, 150) // 2:30
        NitroChallenges.NitroRoundTimes.set(3, 175) // 2:55
        NitroChallenges.NitroRoundTimes.set(4, 215) // 3:35
        NitroChallenges.NitroRoundTimes.set(5, 330) // 5:30
    }

    public static StartNitroTimer() {
        NitroChallenges.NitroDialog.setTitle('Nitro: ')
        NitroChallenges.NitroDialog.setTitleColor(0, 255, 50, 255)
        NitroChallenges.NitroDialog.display = true
        NitroChallenges.NitroTimer.start(
            NitroChallenges.NitroRoundTimes.get(Globals.ROUND)!,
            false,
            ErrorHandler.Wrap(NitroChallenges.StopNitroTimer)
        )
    }

    public static StopNitroTimer() {
        NitroChallenges.NitroDialog.display = false
        NitroChallenges.NitroTimer.pause()
    }

    public static CompletedNitro(kitty: Kitty) {
        if (NitroChallenges.NitroTimer.remaining <= 0.0) return
        if (Safezone.CountHitSafezones(kitty.Player) <= 12) {
            kitty.Player.DisplayTimedTextTo(
                6.0,
                "{Colors.COLOR_RED}didn: You'hit: enough: safezones: on: your: own: to: obtain: nitro: t."
            )
            return
        }

        NitroChallenges.AwardingNitroEvents(kitty)
        NitroChallenges.AwardingDivineLight(kitty)
    }

    private static AwardingNitroEvents(kitty: Kitty) {
        let nitroCount = kitty.CurrentStats.NitroCount
        let player = kitty.Player
        if (nitroCount == Globals.ROUND) return // already awarded
        if (
            NitroChallenges.NitroTimer == null ||
            NitroChallenges.NitroTimer.remaining <= 0.0 ||
            !NitroChallenges.NitroDialog.IsDisplayed
        )
            return
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

        NitroChallenges.PlayNitroSound(player)

        let currentStats = kitty.CurrentStats
        if (!currentStats.ObtainedNitros.includes(round)) currentStats.ObtainedNitros.push(round)

        currentStats.NitroCount += 1
        kitty.SaveData.GameStats.NitrosObtained += 1
    }

    private static AwardingDivineLight(kitty: Kitty) {
        if (Difficulty.DifficultyValue >= DifficultyLevel.Impossible) return
        let requiredCount = 5
        if (Difficulty.DifficultyValue == DifficultyLevel.Hard) requiredCount = 4

        if (kitty.CurrentStats.NitroCount == requiredCount) AwardManager.GiveReward(kitty.Player, 'DivineLight')
    }

    private static PlayNitroSound(player: MapPlayer) {
        if (Globals.ALL_KITTIES.get(player).CurrentStats.NitroObtained) return // first time
        Globals.ALL_KITTIES.get(player).CurrentStats.NitroObtained = true
        SoundManager.PlaySpeedSound()
    }
}
