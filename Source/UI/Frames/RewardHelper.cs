using System.Collections.Generic;

public class RewardHelper
{
    public List<Reward> Hats;
    public List<Reward> Wings;
    public List<Reward> Trails;
    public List<Reward> Auras;

    public RewardHelper()
    {
        Hats = new List<Reward>();
        Wings = new List<Reward>();
        Trails = new List<Reward>();
        Auras = new List<Reward>();
    }

    public void AddReward(Reward reward)
    {
        switch (reward.Type)
        {
            case RewardType.Hats:
                Hats.Add(reward);
                break;
            case RewardType.Wings:
                Wings.Add(reward);
                break;
            case RewardType.Trails:
            case RewardType.Nitros:
            case RewardType.Deathless:
                Trails.Add(reward);
                break;
            case RewardType.Auras:
                Auras.Add(reward);
                break;
        }
    }

    public void ClearRewards()
    {
        Hats.Clear();
        Wings.Clear();
        Trails.Clear();
        Auras.Clear();
    }

}