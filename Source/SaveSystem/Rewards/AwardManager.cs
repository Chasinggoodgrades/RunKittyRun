using System;
using System.Collections.Generic;
using System.Xml.Linq;
using WCSharp.Api;
using static WCSharp.Api.Common;
public static class AwardManager
{
    private static Dictionary<player, List<Awards>> Awarded = new Dictionary<player, List<Awards>>();
    private static trigger AwardTrigger = CreateTrigger();
    private static string GetRewardName(Awards award) => Colors.COLOR_YELLOW + award.ToString().Replace("_", " ") + Colors.COLOR_RESET;
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

    private static void EnableAbility(player player, Awards award)
    {
        var reward = RewardsManager.Rewards.Find(x => x.SystemRewardName() == award.ToString());
        var kitty = Globals.ALL_KITTIES[player].Unit;
        if (reward is null) return;
        kitty.DisableAbility(reward.GetAbilityID(), false, false);
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
                // if the players value is < the required value..
                // We're gonna create a new event that listens for the game stat to hit said value.
                var gamestat = gameStatReward.GameStat;
                var requiredValue = gameStatReward.GameStatValue;
                var award = gameStatReward.Name; // award
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
        }
        AwardTrigger.RegisterTimerEvent(1.0f, true);
    }
    /// <summary>
    /// Sets the players skin to the last skin they used previously.
    /// </summary>
    /// <param name="player"></param>
    public static void SetStartingSkin(Kitty kitty)
    {
        var unit = kitty.Unit;
        var skin = kitty.SaveData.SelectedData[SelectedData.SelectedSkin];
        switch (skin)
        {
            case 0:
                break;
            case 1:
                unit.Skin = Constants.UNIT_ASTRAL_KITTY;
                break;
            case 2:
                unit.Skin = Constants.UNIT_HIGHELF_KITTY;
                break;
            case 3:
                unit.Skin = Constants.UNIT_UNDEAD_KITTY;
                break;
            case 4:
                unit.Skin = Constants.UNIT_SATYR_KITTY;
                break;
            case 5:
                unit.Skin = Constants.UNIT_ANCIENT_KITTY;
                break;
            case 6:
                // new skin later;
                break;
        }

    }
}