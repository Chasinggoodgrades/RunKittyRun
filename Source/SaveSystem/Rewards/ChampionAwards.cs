﻿using System.Linq;
using WCSharp.Api;

public static class ChampionAwards
{
    public static void AwardAllChampions()
    {
        foreach (var player in Globals.ALL_PLAYERS)
        {
            if (!Globals.CHAMPIONS.Contains(player.Name)) continue;
            GiveAllChampionAwards(player);
        }
    }

    private static void GiveAllChampionAwards(player player)
    {
        var awards = Globals.GAME_AWARDS;
        AwardManager.GiveReward(player, nameof(awards.TurquoiseNitro), false);
        AwardManager.GiveReward(player, nameof(awards.TurquoiseWings), false);
        AwardManager.GiveReward(player, nameof(awards.VioletAura), false);
        AwardManager.GiveReward(player, nameof(awards.VioletWings), false);
    }

}