using System.Linq;
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
        AwardManager.GiveReward(player, Awards.Turquoise_Nitro, false);
        AwardManager.GiveReward(player, Awards.Turquoise_Wings, false);
        AwardManager.GiveReward(player, Awards.Violet_Aura, false);
        AwardManager.GiveReward(player, Awards.Violet_Wings, false);
    }

}