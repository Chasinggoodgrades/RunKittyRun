using WCSharp.Api;

/// <summary>
/// One implementation per reward category (wings, hats, auras, trails, skins, windwalks).
/// <see cref="Reward"/> resolves its handler once when it is created, so applying, removing and
/// saving a reward never needs to switch on <see cref="RewardType"/>.
/// </summary>
public interface IReward
{
    /// <summary>Applies the reward's cosmetic to the kitty, replacing whatever the category had active.</summary>
    void Apply(Kitty kitty, Reward reward);

    /// <summary>Removes the category's currently active cosmetic from the kitty, if any.</summary>
    void Remove(Kitty kitty);

    /// <summary>Records the reward as the player's selected one for this category in their save data.</summary>
    void SetSelected(GameSelectedData data, string rewardName);

    /// <summary>The name of the reward the player has selected for this category, or an empty string. Rewards that are never saved give "".</summary>
    string GetSelected(GameSelectedData data);
}
