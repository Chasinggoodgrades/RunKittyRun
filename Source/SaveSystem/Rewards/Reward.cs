using WCSharp.Api;
public abstract class Reward
{
    string Name { get; }
    int AbilityID { get; }
    string OriginPoint { get; }
    string ModelPath { get; }
    RewardType Type { get; }
    bool GameStatsReward { get; }

    public abstract void ApplyReward(player player);

    public abstract string GetRewardName();
    public abstract int GetAbilityID();
    public abstract bool IsGameStatsReward();

}

public enum RewardType
{
    Wings,
    Hat,
    Aura,
    Trail
}