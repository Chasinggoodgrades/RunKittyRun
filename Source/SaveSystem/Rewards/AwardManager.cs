using System;
using System.Collections.Generic;
using System.Linq;
using System.Numerics;
using WCSharp.Api;
using static WCSharp.Api.Common;
/// <summary>
/// This class handles Awarding functionality. 
/// * If you add more skins, they'll need to go in the Set StartingSkin function
/// </summary>
public static class AwardManager
{
    private static Dictionary<player, List<Awards>> Awarded = new Dictionary<player, List<Awards>>();
    private static trigger AwardTrigger = trigger.Create();
    public static string GetRewardName(Awards award) => Colors.COLOR_YELLOW + award.ToString().Replace("_", " ") + Colors.COLOR_RESET;
    public static void Initialize()
    {
        foreach (var player in Globals.ALL_PLAYERS)
            Awarded.Add(player, new List<Awards>());
    }

    /// <summary>
    /// Gives the player an award and enables the ability for them to use.
    /// </summary>
    /// <param name="player">The Player</param>
    /// <param name="award">The Awards.{award} that you're handing out.</param>
    /// <param name="earnedPrompt">Whether or not to show the player has earned prompt or not.</param>
    public static void GiveReward(player player, Awards award, bool earnedPrompt = true)
    {
        if (Awarded.TryGetValue(player, out var awards) && awards.Contains(award)) return;
        var saveData = Globals.ALL_KITTIES[player].SaveData;
        saveData.GameAwards[award] = 1;
        EnableAbility(player, award);
        Awarded[player].Add(award);
        if (earnedPrompt) Utility.TimedTextToAllPlayers(5.0f, Colors.PlayerNameColored(player) + " has earned " + GetRewardName(award));
    }

    /// <summary>
    /// Gives reward to all players.
    /// </summary>
    /// <param name="award"></param>
    public static void GiveRewardAll(Awards award)
    {
        var color = Colors.COLOR_YELLOW_ORANGE;
        var rewardColor = Colors.COLOR_YELLOW;
        foreach (var player in Globals.ALL_PLAYERS)
            GiveReward(player, award, false);
        Utility.TimedTextToAllPlayers(5.0f, $"{color}Congratulations! Everyone has earned|r {rewardColor}{GetRewardName(award)}");
    }

    private static void EnableAbility(player player, Awards award)
    {
        var reward = RewardsManager.Rewards.Find(x => x.SystemRewardName() == award.ToString());
        var kitty = Globals.ALL_KITTIES[player].Unit;
        if (reward is null) return;
        kitty.DisableAbility(reward.GetAbilityID(), false, false);
    }

    public static bool ReceivedAwardAlready(player player, Awards award)
    {
        return Awarded.TryGetValue(player, out var awards) && awards.Contains(award);
    }

    /// <summary>
    /// Registers all gamestats for each player to earn rewards. 
    /// Ex. If less than 200 saves, itll add every game stat to check periodically. to see if you've hit or gone over said value.
    /// </summary>
    public static void RegisterGamestatEvents()
    {
        foreach (var player in Globals.ALL_PLAYERS)
        {
            var kittyStats = Globals.ALL_KITTIES[player].SaveData;
            foreach (var gameStatReward in RewardsManager.GameStatRewards)
            {
                var gamestat = gameStatReward.GameStat;
                var requiredValue = gameStatReward.GameStatValue;
                var award = gameStatReward.Name;

                // Check if the gamestat is NormalWins or NormalGames
                if (gamestat == StatTypes.NormalWins || gamestat == StatTypes.NormalGames)
                {
                    HandleGameStatTrigger(player, kittyStats, gamestat, requiredValue, award);

                    // Also check HardWins, HardGames, ImpossibleWins, ImpossibleGames
                    HandleGameStatTrigger(player, kittyStats, StatTypes.HardWins, requiredValue, award);
                    HandleGameStatTrigger(player, kittyStats, StatTypes.HardGames, requiredValue, award);
                    HandleGameStatTrigger(player, kittyStats, StatTypes.ImpossibleWins, requiredValue, award);
                    HandleGameStatTrigger(player, kittyStats, StatTypes.ImpossibleGames, requiredValue, award);
                }
                // Check if the gamestat is HardWins or HardGames
                else if (gamestat == StatTypes.HardWins || gamestat == StatTypes.HardGames)
                {
                    HandleGameStatTrigger(player, kittyStats, gamestat, requiredValue, award);

                    // Also check ImpossibleWins, ImpossibleGames
                    HandleGameStatTrigger(player, kittyStats, StatTypes.ImpossibleWins, requiredValue, award);
                    HandleGameStatTrigger(player, kittyStats, StatTypes.ImpossibleGames, requiredValue, award);
                }
                else
                {
                    // Handle other game stats normally
                    HandleGameStatTrigger(player, kittyStats, gamestat, requiredValue, award);
                }
            }
        }
        AwardTrigger.RegisterTimerEvent(1.0f, true);
    }

    private static void HandleGameStatTrigger(player player, KittyData kittyStats, StatTypes gamestat, int requiredValue, Awards award)
    {
        if (kittyStats.GameStats[gamestat] < requiredValue)
        {
            triggeraction abc = null;
            abc = TriggerAddAction(AwardTrigger, () =>
            {
                if (kittyStats.GameStats[gamestat] >= requiredValue)
                {
                    GiveReward(player, award);
                    AwardTrigger.RemoveAction(abc);
                }
            });
        }
    }


    /// <summary>
    /// Applies all previously selected awards onto the player. Based on their save data.
    /// </summary>
    /// <param name="kitty"></param>
    public static void SetPlayerSelectedData(Kitty kitty)
    {
        if (kitty.Player.Controller != mapcontrol.User) return; // just reduce load, dont include bots.

        var unit = kitty.Unit;
        var selectedData = kitty.SaveData.SelectedData;

        // Process SelectedSkin first if it exists
        if (selectedData.TryGetValue(SelectedData.SelectedSkin, out var selectedSkinValue))
        {
            ProcessAward(kitty, selectedSkinValue);
        }

        // Process the remaining selected data excluding SelectedSkin
        foreach (var entry in selectedData.Where(entry => entry.Key != SelectedData.SelectedSkin))
        {
            ProcessAward(kitty, entry.Value);
        }
    }

    private static void ProcessAward(Kitty kitty, int selectedEnum)
    {
        var award = (Awards)selectedEnum;
        var reward = Reward.GetRewardFromAward(award);

        if (reward is null) return;

        reward.ApplyReward(kitty.Player, false);
    }

}