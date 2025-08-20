import { Kitty } from 'src/Game/Entities/Kitty/Kitty'
import { CurrentGameMode } from 'src/Gamemodes/CurrentGameMode'
import { GameMode } from 'src/Gamemodes/GameModeEnum'
import { Globals } from 'src/Global/Globals'
import { Difficulty } from 'src/Init/Difficulty/Difficulty'
import { DifficultyLevel } from 'src/Init/Difficulty/DifficultyOption'
import { GameAwardsDataSorted } from 'src/SaveSystem2.0/MAKE REWARDS HERE/SaveObjects/GameAwardsDataSorted'
import { SoundManager } from 'src/Sounds/SoundManager'
import { Colors } from 'src/Utility/Colors/Colors'
import { Utility } from 'src/Utility/Utility'
import { MapPlayer, TextTag } from 'w3ts'
import { CrystalOfFire } from '../EasterEggs/Fieryfox/CrystalOfFire'
import { AwardManager } from '../Rewards/AwardManager'

export class DeathlessChallenges {
    public static DeathlessCount = 0 // Number of deaths allowed for the current round.

    public static Initialize = () => {
        DeathlessChallenges.ResetDeathless()
    }

    /// <summary>
    /// Resetes deathless progress for all players. Should be used at the beginning of new rounds.
    /// </summary>
    public static ResetDeathless = () => {
        DeathlessChallenges.DeathlessCount = 0
        for (let i = 0; i < Globals.ALL_KITTIES_LIST.length; i++) {
            const kitty = Globals.ALL_KITTIES_LIST[i]
            DeathlessChallenges.ResetPlayerDeathless(kitty)
        }
    }

    /// <summary>
    /// Returns the number of deaths allowed for the current round.
    /// </summary>
    /// <returns></returns>
    public static DeathlessPerRound(): number {
        let requiredValue = 14 - (Globals.ROUND - 3) * 4
        if (requiredValue > 14 || Difficulty.DifficultyValue === DifficultyLevel.Normal) requiredValue = 14
        return requiredValue
    }

    /// <summary>
    /// Increments the players progress for deathless and awards them if they've reached the required checkpoints.
    /// </summary>
    /// <param name="player"></param>
    public static DeathlessCheck = (kitty: Kitty) => {
        if (CurrentGameMode.active !== GameMode.Standard) return
        kitty.CurrentStats.DeathlessProgress++
        if (kitty.CurrentStats.DeathlessProgress === DeathlessChallenges.DeathlessPerRound()) {
            DeathlessChallenges.AwardDeathless(kitty)
            DeathlessChallenges.ResetPlayerDeathless(kitty)
        }
    }

    public static ResetPlayerDeathless = (kitty: Kitty) => {
        return (kitty.CurrentStats.DeathlessProgress = 0)
    }

    private static AwardDeathless = (kitty: Kitty) => {
        DeathlessChallenges.DeathlessCount += 1
        CrystalOfFire.AwardCrystalOfFire(kitty.Unit)
        DeathlessChallenges.AwardBasedOnDifficulty(kitty.Player)
        DeathlessChallenges.PlayInvulnerableSoundWithText(kitty)
    }

    private static AwardBasedOnDifficulty = (player: MapPlayer) => {
        const difficulty = Difficulty.DifficultyValue
        DeathlessChallenges.NormalDeathlessAward(player)
        /*        switch (difficulty)
                {
                    case DifficultyLevel.Normal:
                        NormalDeathlessAward(player);
                        break;

                    case DifficultyLevel.Hard:
                        HardDeathlessAward(player);
                        break;

                    case DifficultyLevel.Impossible:
                        ImpossibleDeathlessAward(player);
                        break;

                    default:
                        throw new ArgumentOutOfRangeError();
                }*/
    }

    private static NormalDeathlessAward = (player: MapPlayer) => {
        let gameAwards: GameAwardsDataSorted
        DeathlessChallenges.GiveRoundReward(
            player,
            'NormalDeathless1',
            'NormalDeathless2',
            'NormalDeathless3',
            'NormalDeathless4',
            'NormalDeathless5'
        )
    }

    private static HardDeathlessAward = (player: MapPlayer) => {
        let gameAwards: GameAwardsDataSorted
        DeathlessChallenges.GiveRoundReward(
            player,
            'HardDeathless1',
            'HardDeathless2',
            'HardDeathless3',
            'HardDeathless4',
            'HardDeathless5'
        )
    }

    private static ImpossibleDeathlessAward = (player: MapPlayer) => {
        let gameAwards: GameAwardsDataSorted
        DeathlessChallenges.GiveRoundReward(
            player,
            'ImpossibleDeathless1',
            'ImpossibleDeathless2',
            'ImpossibleDeathless3',
            'ImpossibleDeathless4',
            'ImpossibleDeathless5'
        )
    }

    private static GiveRoundReward = (player: MapPlayer, ...rewards: string[]) => {
        if (Globals.ROUND >= 1 && Globals.ROUND <= rewards.length) {
            AwardManager.GiveReward(player, rewards[Globals.ROUND - 1])
        }
    }

    private static PlayInvulnerableSoundWithText = (k: Kitty) => {
        SoundManager.PlayInvulnerableSound()
        const textTag = TextTag.create()!
        Utility.CreateSimpleTextTag(`${Colors.COLOR_RED}Deathless ${Globals.ROUND}!`, 2.0, k.Unit)
    }
}
