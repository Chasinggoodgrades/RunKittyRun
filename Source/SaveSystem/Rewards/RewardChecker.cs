using System;
using WCSharp.Api;
using static WCSharp.Api.Common;
public static class RewardChecker
{
    private static void RewardCheckGameStats(player player)
    {
        var kitty = Globals.ALL_KITTIES[player];
        var stats = kitty.SaveData;
    }

    /// <summary>
    /// Checks if <typeparamref name="player"/> has earned any rewards for their saves or save streaks.
    /// </summary>
    /// <param name="player"></param>
    public static void RewardCheckSaves(player player)
    {
        var kitty = Globals.ALL_KITTIES[player];
        var stats = kitty.SaveData;

    }

    /// <summary>
    /// Disables all rewards that have yet to be earned by the player.
    /// </summary>
    public static void DisableALlRewards()
    {
        foreach (var player in Globals.ALL_PLAYERS)
        {
            var kitty = Globals.ALL_KITTIES[player];
            var awards = kitty.SaveData.GameAwards;
            foreach (var award in awards)
            {
                if (RewardsManager.Rewards.Find(x => x.SystemRewardName() == award.Key.ToString()) is { } reward)
                {
                    var abilityID = reward.GetAbilityID();
                    if (abilityID != 0 && award.Value == 0) kitty.Unit.DisableAbility(abilityID, true, true);
                }
                else Console.WriteLine($"Reward not fully added/found for {Colors.COLOR_YELLOW}{award.Key.ToString()}|r");
            }
        }
    }

    public static void CheckAllGameAwards(player player)
    {
        var kitty = Globals.ALL_KITTIES[player];
        var awards = kitty.SaveData.GameAwards;

        foreach(var award in awards)
        {
            Console.WriteLine($"{award.Key.ToString()} has a value of : {award.Value}");
            if(award.Value == 1)
            {
                Console.WriteLine($"{award.Key.ToString()} has been Awarded!");
                var abilityID = RewardsManager.Rewards.Find(x => x.SystemRewardName() == award.Key.ToString()).GetAbilityID();
                kitty.Unit.DisableAbility(abilityID, false, false);
            }
        }

    }

}