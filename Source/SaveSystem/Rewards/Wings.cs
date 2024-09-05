using System;
using System.Collections.Generic;
using WCSharp.Api;
using WCSharp.SaveLoad;
using static WCSharp.Api.Common;


public class Wings : Reward
{
    public string Name { get; }
    public int AbilityID { get; }
    public string OriginPoint { get; }
    public string ModelPath { get; }
    public RewardType Type { get; }
    public bool GameStatsReward { get; }
    public Wings(string name, int abilityID, string originPoint, string modelPath, RewardType type, bool gameStatsReward)
    {
        Name = name;
        AbilityID = abilityID;
        OriginPoint = originPoint;
        ModelPath = modelPath;
        Type = type;
        GameStatsReward = gameStatsReward;
        if(GameStatsReward) RewardsManager.GameStatRewards.Add(this);
    }

    public override void ApplyReward(player player)
    {
        Console.WriteLine("Applying wings to player...");
        var kitty = Globals.ALL_KITTIES[player].Unit;
        var effect = AddSpecialEffectTarget(ModelPath, kitty, OriginPoint);
        RewardsManager.ActiveWings[player] = effect;
    }

    public override string GetRewardName() => Name;
    public override int GetAbilityID() => AbilityID;
    public override bool IsGameStatsReward() => GameStatsReward;


}