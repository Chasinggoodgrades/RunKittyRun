using System;
using WCSharp.Api;

public static class DeathlessChallenges
{
    public static void Initialize()
    {
        ResetDeathless();
    }

    /// <summary>
    /// Resetes deathless progress for all players. Should be used at the beginning of new rounds.
    /// </summary>
    public static void ResetDeathless()
    {
        foreach (var kitty in Globals.ALL_KITTIES)
            ResetPlayerDeathless(kitty.Value);
    }

    /// <summary>
    /// Returns the number of deaths allowed for the current round.
    /// </summary>
    /// <returns></returns>
    public static int DeathlessPerRound()
    {
        var requiredValue = 14 - ((Globals.ROUND - 3) * 4);
        if (requiredValue > 14 || Difficulty.DifficultyValue == (int)DifficultyLevel.Normal) requiredValue = 14;
        return requiredValue;
    }

    /// <summary>
    /// Increments the players progress for deathless and awards them if they've reached the required checkpoints.
    /// </summary>
    /// <param name="player"></param>
    public static void DeathlessCheck(Kitty kitty)
    {
        if (Gamemode.CurrentGameMode != "Standard") return;
        kitty.CurrentStats.DeathlessProgress++;
        if (kitty.CurrentStats.DeathlessProgress == DeathlessPerRound())
        {
            AwardDeathless(kitty);
            ResetPlayerDeathless(kitty);
        }
    }

    public static void ResetPlayerDeathless(Kitty kitty) => kitty.CurrentStats.DeathlessProgress = 0;

    private static void AwardDeathless(Kitty kitty)
    {
        CrystalOfFire.AwardCrystalOfFire(kitty.Unit);
        AwardBasedOnDifficulty(kitty.Player);
        PlayInvulnerableSoundWithText(kitty);
    }

    private static void AwardBasedOnDifficulty(player player)
    {
        var difficulty = (DifficultyLevel)Difficulty.DifficultyValue;
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
                        throw new ArgumentOutOfRangeException();
                }*/
    }

    private static void NormalDeathlessAward(player player)
    {
        GameAwardsDataSorted gameAwards;
        GiveRoundReward(player, nameof(gameAwards.Deathless.NormalDeathless1), nameof(gameAwards.Deathless.NormalDeathless2), nameof(gameAwards.Deathless.NormalDeathless3), nameof(gameAwards.Deathless.NormalDeathless4), nameof(gameAwards.Deathless.NormalDeathless5));
    }

    private static void HardDeathlessAward(player player)
    {
        GameAwardsDataSorted gameAwards;
        GiveRoundReward(player, nameof(gameAwards.Deathless.HardDeathless1), nameof(gameAwards.Deathless.HardDeathless2), nameof(gameAwards.Deathless.HardDeathless3), nameof(gameAwards.Deathless.HardDeathless4), nameof(gameAwards.Deathless.HardDeathless5));
    }

    private static void ImpossibleDeathlessAward(player player)
    {
        GameAwardsDataSorted gameAwards;
        GiveRoundReward(player, nameof(gameAwards.Deathless.ImpossibleDeathless1), nameof(gameAwards.Deathless.ImpossibleDeathless2), nameof(gameAwards.Deathless.ImpossibleDeathless3), nameof(gameAwards.Deathless.ImpossibleDeathless4), nameof(gameAwards.Deathless.ImpossibleDeathless5));
    }

    private static void GiveRoundReward(player player, params string[] rewards)
    {
        if (Globals.ROUND >= 1 && Globals.ROUND <= rewards.Length)
        {
            AwardManager.GiveReward(player, rewards[Globals.ROUND - 1]);
        }
    }

    private static void PlayInvulnerableSoundWithText(Kitty k)
    {
        SoundManager.PlayInvulnerableSound();
        var textTag = texttag.Create();
        Utility.CreateSimpleTextTag($"{Colors.COLOR_RED}Deathless {Globals.ROUND}!", 2.0f, k.Unit);
    }
}
