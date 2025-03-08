using System;
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

    public static int GetAwardNestedValue(object saveData, string awardName)
    {
        // search rewardsList for this award name, then return getawardNestedvalue
        var reward = RewardsManager.Rewards.Find(r => r.Name == awardName);
        if (reward != null)
        {
            return GetAwardNestedValue(saveData, reward.TypeSorted, reward.Name);
        }
        return -1;
    }


    /// <summary>
    /// Gets the value of a nested property for GameAwardsSorted.
    /// </summary>
    /// <param name="obj">Players SaveData Object GameAwardsSorted in this case.</param>
    /// <param name="nestedPropertyName">The Reward.TypeSorted</param>
    /// <param name="propertyName">Reward.Name</param>
    /// <returns></returns>
    public static int GetAwardNestedValue(object obj, string nestedPropertyName, string propertyName)
    {
        var nestedProperty = obj.GetType().GetProperty(nestedPropertyName);
        if (nestedProperty != null)
        {
            var nestedObject = nestedProperty.GetValue(obj);
            if (nestedObject != null)
            {
                var property = nestedObject.GetType().GetProperty(propertyName);
                if (property != null)
                {
                    return (int)property.GetValue(nestedObject);
                }
            }
        }
        return 0;
    }

    /// <summary>
    /// Updates the nested property for GameAwardsSorted.
    /// </summary>
    /// <param name="obj">GameAwardsSorted object</param>
    /// <param name="nestedPropertyName">reward.TypeSorted</param>
    /// <param name="propertyName">the name of reward.</param>
    /// <param name="value">value to set it to</param>
    public static void UpdateNestedProperty(object obj, string nestedPropertyName, string propertyName, object value)
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
            Logger.Warning($"Nested property {nestedPropertyName} not found.");
        }
    }

    private static void UpdateProperty(object obj, string propertyName, object value)
    {
        var property = obj.GetType().GetProperty(propertyName);
        if (property != null)
        {
            property.SetValue(obj, value);
        }
        else
        {
            Logger.Warning($"Property {propertyName} not found.");
        }
    }
}