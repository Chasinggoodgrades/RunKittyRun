import { Logger } from 'src/Events/Logger/Logger'
import { Reward, RewardType } from 'src/Rewards/Rewards/Reward'
import { RewardsManager } from 'src/Rewards/Rewards/RewardsManager'

export class RewardHelper {
    public Hats: Reward[]
    public Wings: Reward[]
    public Trails: Reward[]
    public Auras: Reward[]

    public constructor() {
        this.Hats = []
        this.Wings = []
        this.Trails = []
        this.Auras = []
    }

    public AddReward(reward: Reward) {
        switch (reward.Type) {
            case RewardType.Hats:
                this.Hats.push(reward)
                break

            case RewardType.Wings:
                this.Wings.push(reward)
                break

            case RewardType.Trails:
            case RewardType.Nitros:
            case RewardType.Deathless:
                this.Trails.push(reward)
                break

            case RewardType.Auras:
                this.Auras.push(reward)
                break
        }
    }

    public ClearRewards() {
        this.Hats.length = 0
        this.Wings.length = 0
        this.Trails.length = 0
        this.Auras.length = 0
    }

    public static GetAwardNestedValueTwo(saveData: object, awardName: string) {
        // search rewardsList for this award name, then return getawardNestedvalue
        let reward = RewardsManager.Rewards.find(r => r.name == awardName)
        return reward != null ? RewardHelper.GetAwardNestedValue(saveData, reward.TypeSorted, reward.name) : -1
    }

    /// <summary>
    /// Gets the value of a nested property for GameAwardsSorted.
    /// </summary>
    /// <param name="obj">Players SaveData Object GameAwardsSorted in this case.</param>
    /// <param name="nestedPropertyName">The Reward.TypeSorted</param>
    /// <param name="propertyName">Reward.name</param>
    /// <returns></returns>
    public static GetAwardNestedValue(obj: object, nestedPropertyName: string, propertyName: string) {
        let nestedProperty = (obj as any)[nestedPropertyName]
        if (nestedProperty != null) {
            let nestedObject = nestedProperty
            if (nestedObject != null) {
                let property = (nestedObject as any)[propertyName]
                if (property != null) {
                    return property
                }
            }
        }
        return 0
    }

    /// <summary>
    /// Updates the nested property for GameAwardsSorted.
    /// </summary>
    /// <param name="obj">GameAwardsSorted object</param>
    /// <param name="nestedPropertyName">reward.TypeSorted</param>
    /// <param name="propertyName">the name of reward.</param>
    /// <param name="value">value to set it to</param>
    public static UpdateNestedProperty(obj: object, nestedPropertyName: string, propertyName: string, value: any) {
        let nestedProperty = (obj as any)[nestedPropertyName]
        if (nestedProperty != null) {
            let nestedObject = nestedProperty
            if (nestedObject != null) {
                RewardHelper.UpdateProperty(nestedObject, propertyName, value)
            }
        } else {
            Logger.Warning(`property: Nested ${nestedPropertyName} found: not.`)
        }
    }

    private static UpdateProperty(obj: object, propertyName: string, value: object) {
        let property = (obj as any)[propertyName]
        if (property !== undefined) {
            ;(obj as any)[propertyName] = value
        } else {
            Logger.Warning(`Property not found: ${propertyName}.`)
        }
    }
}
