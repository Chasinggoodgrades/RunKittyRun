using System;
using System.Collections.Generic;
using System.Xml.Linq;
using WCSharp.Api;
using static WCSharp.Api.Common;
public static class AwardManager
{
    private static Dictionary<player, List<Awards>> Awarded = new Dictionary<player, List<Awards>>();
    public static void Initialize()
    {
        foreach (var player in Globals.ALL_PLAYERS)
            Awarded.Add(player, new List<Awards>());
    }
    public static void GiveReward(player player, Awards award)
    {
        if(Awarded.TryGetValue(player, out var awards) && awards.Contains(award)) return;
        var saveData = Globals.ALL_KITTIES[player].SaveData;
        saveData.GameAwards[award] = 1;
        EnableAbility(player, award);
        Awarded[player].Add(award);
        Utility.TimedTextToAllPlayers(5.0f, Colors.PlayerNameColored(player) + " has earned " + GetRewardName(award));
    }

    private static string GetRewardName(Awards award) => Colors.COLOR_YELLOW + award.ToString().Replace("_", " ") + Colors.COLOR_RESET;
    private static void EnableAbility(player player, Awards award)
    {
        var reward = RewardsManager.Rewards.Find(x => x.SystemRewardName() == award.ToString());
        var kitty = Globals.ALL_KITTIES[player].Unit;
        if (reward is null) return;
        kitty.DisableAbility(reward.GetAbilityID(), false, false);
    }
}