using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class Deathless
{
    private static Dictionary<player, int> DeathlessProgress;

    public static void Initialize()
    {
        DeathlessProgress = new Dictionary<player, int>();
        ResetDeathless();
    }

    public static void ResetDeathless()
    {
        foreach (var player in Globals.ALL_PLAYERS)
            DeathlessProgress[player] = 0;
    }

    public static void DeathlessCheck(player player)
    {
        var requiredValue = 14 - ((Globals.ROUND - 3) * 4);
        if(requiredValue > 14) { requiredValue = 14; }
        DeathlessProgress[player]++;
        if (DeathlessProgress[player] == requiredValue)
        {
            AwardDeathless(player);
            DeathlessProgress[player] = 0;
        }
    }

    private static void AwardDeathless(player player)
    {
        var kitty = Globals.ALL_KITTIES[player];
        // add item for crystal of fire later here..
        switch (Globals.ROUND)
        {
            case 1:
                AwardManager.GiveReward(player, Awards.Deathless_1);
                break;
            case 2:
                AwardManager.GiveReward(player, Awards.Deathless_2);
                break;
            case 3:
                AwardManager.GiveReward(player, Awards.Deathless_3);
                break;
            case 4:
                AwardManager.GiveReward(player, Awards.Deathless_4);
                break;
            case 5:
                AwardManager.GiveReward(player, Awards.Deathless_5);
                break;
        }
        SoundManager.PlayInvulnerableSound();
        var textTag = CreateTextTag();
        textTag.SetText($"Deathless {Globals.ROUND}!", 0.015f);
        SetTextTagVelocity(textTag, 120.0f, 90f);
        textTag.SetLifespan(1.0f);
        Utility.SimpleTimer(1.50f, () => textTag.Dispose());
    }


}