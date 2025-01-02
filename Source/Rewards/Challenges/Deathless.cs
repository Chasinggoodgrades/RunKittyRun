using System.Collections.Generic;
using WCSharp.Api;

public static class Deathless
{
    private static Dictionary<player, int> DeathlessProgress;

    public static void Initialize()
    {
        DeathlessProgress = new Dictionary<player, int>();
        ResetDeathless();
    }

    /// <summary>
    /// Resetes deathless progress for all players. Should be used at the beginning of new rounds.
    /// </summary>
    public static void ResetDeathless()
    {
        foreach (var player in Globals.ALL_PLAYERS)
            DeathlessProgress[player] = 0;
    }

    /// <summary>
    /// Returns the number of deaths allowed for the current round.
    /// </summary>
    /// <returns></returns>
    public static int DeathlessPerRound()
    {
        var requiredValue = 14 - ((Globals.ROUND - 3) * 4);
        if (requiredValue > 14) requiredValue = 14;
        return requiredValue;
    }

    /// <summary>
    /// Increments the players progress for deathless and awards them if they've reached the required checkpoints.
    /// </summary>
    /// <param name="player"></param>
    public static void DeathlessCheck(player player)
    {
        if(Gamemode.CurrentGameMode != "Standard") return;
        DeathlessProgress[player]++;
        if (DeathlessProgress[player] == DeathlessPerRound())
        {
            AwardDeathless(player);
            DeathlessProgress[player] = 0;
        }
    }

    public static void ResetPlayerDeathless(player player) => DeathlessProgress[player] = 0;

    private static void AwardDeathless(player player)
    {
        var kitty = Globals.ALL_KITTIES[player];
        var gameAwards = Globals.GAME_AWARDS;
        CrystalOfFire.AwardCrystalOfFire(kitty.Unit);
        switch (Globals.ROUND)
        {
            case 1:
                AwardManager.GiveReward(player, nameof(gameAwards.NormalDeathless1));
                break;
            case 2:
                AwardManager.GiveReward(player, nameof(gameAwards.NormalDeathless2));
                break;
            case 3:
                AwardManager.GiveReward(player, nameof(gameAwards.NormalDeathless3));
                break;
            case 4:
                AwardManager.GiveReward(player, nameof(gameAwards.NormalDeathless4));
                break;
            case 5:
                AwardManager.GiveReward(player, nameof(gameAwards.NormalDeathless5));
                break;
        }
        SoundManager.PlayInvulnerableSound();
        var textTag = texttag.Create();
        textTag.SetText($"Deathless {Globals.ROUND}!", 0.015f);
        textTag.SetVelocity(120.0f, 90f);
        textTag.SetLifespan(1.0f);
        Utility.SimpleTimer(1.50f, () => textTag.Dispose());
    }


}