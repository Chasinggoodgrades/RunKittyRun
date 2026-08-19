using WCSharp.Api;

public interface IReward
{
    string Category { get; }                                   // replaces SetRewardTypeSorted()'s reflection trick
    void Apply(player player, ActiveAwards awards, effect e);
    void Remove(player player, ActiveAwards awards);
    void SetSelected(GameSelectedData data, string rewardName);
}
