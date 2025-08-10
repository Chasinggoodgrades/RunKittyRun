

class DeathlessChallenges
{
    public static DeathlessCount: number = 0; // Number of deaths allowed for the current round.

    public static Initialize()
    {
        ResetDeathless();
    }

    /// <summary>
    /// Resetes deathless progress for all players. Should be used at the beginning of new rounds.
    /// </summary>
    public static ResetDeathless()
    {
        DeathlessCount = 0;
        for (let i: number = 0; i < Globals.ALL_KITTIES_LIST.Count; i++)
        {
            let kitty = Globals.ALL_KITTIES_LIST[i];
            ResetPlayerDeathless(kitty);
        }
    }

    /// <summary>
    /// Returns the number of deaths allowed for the current round.
    /// </summary>
    /// <returns></returns>
    public static DeathlessPerRound(): number
    {
        let requiredValue = 14 - ((Globals.ROUND - 3) * 4);
        if (requiredValue > 14 || Difficulty.DifficultyValue == DifficultyLevel.Normal) requiredValue = 14;
        return requiredValue;
    }

    /// <summary>
    /// Increments the players progress for deathless and awards them if they've reached the required checkpoints.
    /// </summary>
    /// <param name="player"></param>
    public static DeathlessCheck(kitty: Kitty)
    {
        if (Gamemode.CurrentGameMode != GameMode.Standard) return;
        kitty.CurrentStats.DeathlessProgress++;
        if (kitty.CurrentStats.DeathlessProgress == DeathlessPerRound())
        {
            AwardDeathless(kitty);
            ResetPlayerDeathless(kitty);
        }
    }

    public static ResetPlayerDeathless(kitty: Kitty)  { return kitty.CurrentStats.DeathlessProgress = 0; }

    private static AwardDeathless(kitty: Kitty)
    {
        DeathlessCount += 1;
        CrystalOfFire.AwardCrystalOfFire(kitty.Unit);
        AwardBasedOnDifficulty(kitty.Player);
        PlayInvulnerableSoundWithText(kitty);
    }

    private static AwardBasedOnDifficulty(player: player)
    {
        let difficulty = (DifficultyLevel)Difficulty.DifficultyValue;
        NormalDeathlessAward(player);
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

    private static NormalDeathlessAward(player: player)
    {
        let gameAwards: GameAwardsDataSorted;
        GiveRoundReward(player, nameof(gameAwards.Deathless.NormalDeathless1), nameof(gameAwards.Deathless.NormalDeathless2), nameof(gameAwards.Deathless.NormalDeathless3), nameof(gameAwards.Deathless.NormalDeathless4), nameof(gameAwards.Deathless.NormalDeathless5));
    }

    private static HardDeathlessAward(player: player)
    {
        let gameAwards: GameAwardsDataSorted;
        GiveRoundReward(player, nameof(gameAwards.Deathless.HardDeathless1), nameof(gameAwards.Deathless.HardDeathless2), nameof(gameAwards.Deathless.HardDeathless3), nameof(gameAwards.Deathless.HardDeathless4), nameof(gameAwards.Deathless.HardDeathless5));
    }

    private static ImpossibleDeathlessAward(player: player)
    {
        let gameAwards: GameAwardsDataSorted;
        GiveRoundReward(player, nameof(gameAwards.Deathless.ImpossibleDeathless1), nameof(gameAwards.Deathless.ImpossibleDeathless2), nameof(gameAwards.Deathless.ImpossibleDeathless3), nameof(gameAwards.Deathless.ImpossibleDeathless4), nameof(gameAwards.Deathless.ImpossibleDeathless5));
    }

    private static GiveRoundReward(player: player, string: params[] rewards)
    {
        if (Globals.ROUND >= 1 && Globals.ROUND <= rewards.Length)
        {
            AwardManager.GiveReward(player, rewards[Globals.ROUND - 1]);
        }
    }

    private static PlayInvulnerableSoundWithText(k: Kitty)
    {
        SoundManager.PlayInvulnerableSound();
        let textTag = texttag.Create();
        Utility.CreateSimpleTextTag("{Colors.COLOR_RED}Deathless {Globals.ROUND}!", 2.0, k.Unit);
    }
}
