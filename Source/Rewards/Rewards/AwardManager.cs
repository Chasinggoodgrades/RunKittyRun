using System;
using System.Collections.Generic;
using System.Numerics;
using WCSharp.Api;
using static WCSharp.Api.Common;

/// <summary>
/// This class handles Awarding functionality. 
/// </summary>
public static class AwardManager
{
    private static Dictionary<player, List<string>> Awarded = new Dictionary<player, List<string>>();
    private static trigger AwardTrigger = trigger.Create();
    //public static string GetRewardName(Awards award) => Colors.COLOR_YELLOW + award.ToString().Replace("_", " ") + Colors.COLOR_RESET;
    public static void Initialize()
    {
        foreach (var player in Globals.ALL_PLAYERS)
            Awarded.Add(player, new List<string>());
    }

    /// <summary>
    /// Gives the player an award and enables the ability for them to use.
    /// </summary>
    /// <param name="player">The Player</param>
    /// <param name="award">The Awards.{award} that you're handing out.</param>
    /// <param name="earnedPrompt">Whether or not to show the player has earned prompt or not.</param>
    public static void GiveReward(player player, string award, bool earnedPrompt = true)
    {
        // Check if the player already has the award
        if (Awarded.TryGetValue(player, out var awards) && awards.Contains(award))
            return;

        var saveData = Globals.ALL_KITTIES[player].SaveData;
        var reward = RewardsManager.Rewards.Find(x => x.SystemRewardName() == award.ToString());

        if (reward == null)
        {
            Console.WriteLine("Reward not found.");
            return;
        }

        UpdateProperty(saveData.GameAwards, award, 1);
        UpdateNestedProperty(saveData.GameAwardsSorted, reward.TypeSorted, award, 1);

        EnableAbility(player, award);

        // ex: PurpleFire should be Purple Fire
        var awardFormatted = Utility.FormatAwardName(award);
        if (earnedPrompt)
        {
            Utility.TimedTextToAllPlayers(5.0f, $"{Colors.PlayerNameColored(player)} has earned {Colors.COLOR_YELLOW}{awardFormatted}.|r");
            Awarded[player].Add(award);
        }
    }

    // Helper method to update a property value
    private static void UpdateProperty(object obj, string propertyName, object value)
    {
        var property = obj.GetType().GetProperty(propertyName);
        if (property != null)
        {
            property.SetValue(obj, value);
        }
        else
        {
            if(Source.Program.Debug) Console.WriteLine($"Property {propertyName} not found.");
        }
    }

    private static void UpdateNestedProperty(object obj, string nestedPropertyName, string propertyName, object value)
    {
        var nestedProperty = obj.GetType().GetProperty(nestedPropertyName);
        if (nestedProperty != null)
        {
            var nestedObject = nestedProperty.GetValue(obj);
            if (nestedObject != null)
            {
                UpdateProperty(nestedObject, propertyName, value);
            }
        }
        else
        {
            if(Source.Program.Debug) Console.WriteLine($"Nested property {nestedPropertyName} not found.");
        }
    }

    /// <summary>
    /// Updates all Game Awards for the player to add to GameSortedAwards.. 
    /// </summary>
    /// <param name="player"></param>
    public static void UpdateRewardsSorted()
    {
        foreach (var player in Globals.ALL_PLAYERS)
        {
            var gameAwards = Globals.ALL_KITTIES[player].SaveData.GameAwards;
            foreach (var property in gameAwards.GetType().GetProperties())
            {
                var value = (int)property.GetValue(gameAwards);
                if (value == 1) GiveReward(player, property.Name, false);
            }
        }
    }

    /// <summary>
    /// Gives reward to all players, set Prompt to false if you don't want to show the earned prompt.
    /// </summary>
    /// <param name="award"></param>
    public static void GiveRewardAll(string award, bool earnedPrompt = true)
    {
        var color = Colors.COLOR_YELLOW_ORANGE;
        var rewardColor = Colors.COLOR_YELLOW;
        foreach (var player in Globals.ALL_PLAYERS)
            GiveReward(player, award, false);
        if (earnedPrompt)
            Utility.TimedTextToAllPlayers(5.0f, $"{color}Congratulations! Everyone has earned|r {rewardColor}{award}");
    }

    private static void EnableAbility(player player, string award)
    {
        var reward = RewardsManager.Rewards.Find(x => x.SystemRewardName() == award.ToString());
        var kitty = Globals.ALL_KITTIES[player].Unit;
        if (reward is null) return;
        kitty.DisableAbility(reward.GetAbilityID(), false, false);
    }

    public static bool ReceivedAwardAlready(player player, string award)
    {
        return Awarded.TryGetValue(player, out var awards) && awards.Contains(award);
    }

    /// <summary>
    /// Registers all gamestats for each player to earn rewards. 
    /// Ex. If less than 200 saves, itll add every game stat to check periodically. to see if you've hit or gone over said value.
    /// </summary>
    public static void RegisterGamestatEvents()
    {
        if (Gamemode.CurrentGameMode != "Standard") return;
        foreach (var player in Globals.ALL_PLAYERS)
        {
            var kittyStats = Globals.ALL_KITTIES[player].SaveData;
            var gameStats = kittyStats.GameStats;

            foreach(var gameStatReward in RewardsManager.GameStatRewards)
            {
                var gamestat = gameStatReward.GameStat;
                if (gamestat == nameof(gameStats.NormalWins) || gamestat == nameof(gameStats.NormalGames))
                {
                    HandleGameStatTrigger(player, kittyStats, gamestat, gameStatReward.GameStatValue, gameStatReward.Name);
                    HandleGameStatTrigger(player, kittyStats, nameof(gameStats.HardWins), gameStatReward.GameStatValue, gameStatReward.Name);
                    HandleGameStatTrigger(player, kittyStats, nameof(gameStats.HardGames), gameStatReward.GameStatValue, gameStatReward.Name);
                    HandleGameStatTrigger(player, kittyStats, nameof(gameStats.ImpossibleWins), gameStatReward.GameStatValue, gameStatReward.Name);
                    HandleGameStatTrigger(player, kittyStats, nameof(gameStats.ImpossibleGames), gameStatReward.GameStatValue, gameStatReward.Name);
                }
                else if (gamestat == nameof(gameStats.HardWins) || gamestat == nameof(gameStats.HardGames))
                {
                    HandleGameStatTrigger(player, kittyStats, gamestat, gameStatReward.GameStatValue, gameStatReward.Name);
                    HandleGameStatTrigger(player, kittyStats, nameof(gameStats.ImpossibleWins), gameStatReward.GameStatValue, gameStatReward.Name);
                    HandleGameStatTrigger(player, kittyStats, nameof(gameStats.ImpossibleGames), gameStatReward.GameStatValue, gameStatReward.Name);
                }
                else
                {
                    HandleGameStatTrigger(player, kittyStats, gamestat, gameStatReward.GameStatValue, gameStatReward.Name);
                }
            }
        }
        AwardTrigger.RegisterTimerEvent(1.0f, true);
    }

    private static void HandleGameStatTrigger(player player, KittyData kittyStats, string gamestat, int requiredValue, string award)
    {
        var property = kittyStats.GameStats.GetType().GetProperty(gamestat);
        var value = (int)property.GetValue(kittyStats.GameStats);
        if (value < requiredValue)
        {
            triggeraction abc = null;
            abc = TriggerAddAction(AwardTrigger, () =>
            {
                if (gamestat == nameof(kittyStats.GameStats.NormalGames) && !NormalGamesCheck(kittyStats, requiredValue)) return;
                else if (gamestat == nameof(kittyStats.GameStats.NormalWins) && !NormalWinsCheck(kittyStats, requiredValue)) return;
                else if (gamestat == nameof(kittyStats.GameStats.HardGames) && !HardGamesCheck(kittyStats, requiredValue)) return;
                else if (gamestat == nameof(kittyStats.GameStats.HardWins) && !HardWinsCheck(kittyStats, requiredValue)) return;
                else if ((int)property.GetValue(kittyStats.GameStats) < requiredValue) return;
                else
                {
                    GiveReward(player, award);
                    AwardTrigger.RemoveAction(abc);
                }
            });
        }
    }

    private static bool NormalGamesCheck(KittyData kittyStats, int requiredValue)
    {
        var combinedValue = 0;
        combinedValue += kittyStats.GameStats.NormalGames;
        combinedValue += kittyStats.GameStats.HardGames;
        combinedValue += kittyStats.GameStats.ImpossibleGames;
        return combinedValue >= requiredValue;
    }

    private static bool NormalWinsCheck(KittyData kittyStats, int requiredValue)
    {
        var combinedValue = 0;
        combinedValue += kittyStats.GameStats.NormalWins;
        combinedValue += kittyStats.GameStats.HardWins;
        combinedValue += kittyStats.GameStats.ImpossibleWins;
        return combinedValue >= requiredValue;
    }

    private static bool HardGamesCheck(KittyData kittyStats, int requiredValue)
    {
        var combinedValue = 0;
        combinedValue += kittyStats.GameStats.HardGames;
        combinedValue += kittyStats.GameStats.ImpossibleGames;
        return combinedValue >= requiredValue;
    }

    private static bool HardWinsCheck(KittyData kittyStats, int requiredValue)
    {
        var combinedValue = 0;
        combinedValue += kittyStats.GameStats.HardWins;
        combinedValue += kittyStats.GameStats.ImpossibleWins;
        return combinedValue >= requiredValue;
    }

    /// <summary>
    /// Applies all previously selected awards onto the player. Based on their save data.
    /// </summary>
    /// <param name="kitty"></param>
    public static void SetPlayerSelectedData(Kitty kitty)
    {
        if (kitty.Player.Controller != mapcontrol.User) return; // just reduce load, dont include bots.
        if (Gamemode.CurrentGameMode != "Standard") return; // only apply awards in standard mode (not in tournament modes).

        var unit = kitty.Unit;
        var selectedData = kitty.SaveData.SelectedData; // GameSelectData class object

        var skinProperty = selectedData.GetType().GetProperty(nameof(selectedData.SelectedSkin));
        var skinValue = (string)skinProperty.GetValue(selectedData);
        ProcessAward(kitty, skinValue);

        foreach (var property in selectedData.GetType().GetProperties())
        {
            var selectedName = (string)property.GetValue(selectedData);
            ProcessAward(kitty, selectedName);
        }
    }

    private static void ProcessAward(Kitty kitty, string selectedAwardName)
    {
        var reward = RewardsManager.Rewards.Find(x => x.Name == selectedAwardName);
        if (reward is null) return;
        reward.ApplyReward(kitty.Player, false);
    }
}