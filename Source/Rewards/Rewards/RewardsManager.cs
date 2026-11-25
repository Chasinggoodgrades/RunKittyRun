using System.Collections.Generic;
using WCSharp.Api;

/// <summary>
/// This class handles:
/// * Activation / Deactivation of Rewards (Based on Spell Cast Event)
/// * Any activated reward including the Reset ability so long as it's added within the RewardCreation class.
/// </summary>
public static class RewardsManager
{
    private static trigger Trigger = trigger.Create();
    private static List<int> RewardAbilities = new List<int>();
    public static List<Reward> Rewards = new List<Reward>();
    public static List<Reward> GameStatRewards = new List<Reward>();

    public static void Initialize()
    {
        RegisterTrigger();
        RewardCreation.SetupRewards();
        RewardDisplayData.Configure(Rewards);
        RewardAbilitiesList();
        AwardManager.RegisterGamestatEvents();
        ChampionAwards.AwardAllChampions();
    }

    private static void RewardAbilitiesList()
    {
        foreach (var reward in Rewards)
            RewardAbilities.Add(reward.AbilityID);
    }

    private static void RegisterTrigger()
    {
        foreach (var player in Globals.ALL_PLAYERS)
        {
            Trigger.RegisterPlayerUnitEvent(player, playerunitevent.SpellCast, null);
        }
        Trigger.AddAction(CastedReward);
    }

    private static void CastedReward()
    {
        var spellID = @event.SpellAbilityId;
        var unit = @event.Unit;
        if (IsResetSpell(spellID))
        {
            ResetRewardSettings(unit);
            Globals.ALL_KITTIES[unit.Owner].KittyMorphosis.ScaleUnit(); // changes scale of unit if they have amulet.
            return;
        }
    }

    private static bool IsRewardAbility(int spellID) => RewardAbilities.Contains(spellID);

    private static bool IsResetSpell(int spellID) => spellID == Constants.ABILITY_RESET;

    private static void ResetRewardSettings(unit Unit)
    {
        var player = Unit.Owner;
        var kitty = Globals.ALL_KITTIES[player];
        RewardHandlers.RemoveAll(kitty);

        kitty.Unit.Skin = Constants.UNIT_KITTY;
        kitty.RefreshUnitName();
        kitty.Unit.SetVertexColor(255, 255, 255);
        kitty.NotifyVertexColor(255, 255, 255);
        kitty.AsyncEffect?.ReapplyUnitHidden(true); // the line above made the unit opaque again

        kitty.SaveData.SelectedData.Clear();
    }
}
