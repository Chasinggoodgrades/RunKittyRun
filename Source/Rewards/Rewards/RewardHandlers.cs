using System;
using WCSharp.Api;

/// <summary>
/// The <see cref="IReward"/> implementations, one per reward category, plus the lookup that maps a
/// <see cref="Reward"/> to its handler. All handlers are shared singletons.
/// </summary>
public static class RewardHandlers
{
    public static readonly IReward Wings = new WingsReward();
    public static readonly IReward Hats = new HatsReward();
    public static readonly IReward Auras = new AurasReward();
    public static readonly IReward Trails = new TrailsReward(); // Trails, Nitros and Deathless all share the trail slot.
    public static readonly IReward Windwalks = new WindwalkReward();
    public static readonly IReward Skins = new SkinReward();

    // Tournament rewards use the same slots as the normal ones but are never saved as a selection.
    private static readonly IReward TournamentWings = new NotSavedReward(Wings);
    private static readonly IReward TournamentAuras = new NotSavedReward(Auras);
    private static readonly IReward TournamentTrails = new NotSavedReward(Trails);
    private static readonly IReward Unknown = new UnknownReward();

    // Everything that owns something removable on a kitty (skins have nothing to remove).
    private static readonly IReward[] Removable = { Wings, Hats, Auras, Trails, Windwalks };

    public static IReward Resolve(RewardType type, string name)
    {
        switch (type)
        {
            case RewardType.Wings: return Wings;
            case RewardType.Hats: return Hats;
            case RewardType.Auras: return Auras;
            case RewardType.Trails:
            case RewardType.Nitros:
            case RewardType.Deathless: return Trails;
            case RewardType.Skins: return Skins;
            case RewardType.Windwalks: return Windwalks;
            case RewardType.Tournament: return ResolveTournament(name);
            default: throw new ArgumentOutOfRangeException(nameof(type), type, null);
        }
    }

    /// <summary>
    /// Tournament rewards share one RewardType, so the category comes from the reward's name.
    /// This runs once per reward at setup, not every time one is applied.
    /// </summary>
    private static IReward ResolveTournament(string name)
    {
        if (name.Contains("Nitro")) return TournamentTrails;
        if (name.Contains("Aura")) return TournamentAuras;
        if (name.Contains("Wings")) return TournamentWings;
        if (name.Contains("Skin")) return Skins;

        Logger.Warning($"Error: Tournament reward {name} is not a valid type.");
        return Unknown;
    }

    /// <summary>Removes every active reward effect and windwalk from the kitty.</summary>
    public static void RemoveAll(Kitty kitty)
    {
        for (int i = 0; i < Removable.Length; i++)
            Removable[i].Remove(kitty);
    }

    /// <summary>A reward that lives as an attached effect in one <see cref="ActiveAwards"/> slot.</summary>
    private abstract class EffectReward : IReward
    {
        protected abstract effect GetActive(ActiveAwards awards);

        protected abstract void SetActive(ActiveAwards awards, effect value);

        public abstract void SetSelected(GameSelectedData data, string rewardName);

        public void Apply(Kitty kitty, Reward reward)
        {
            var newEffect = kitty.AddKittyEffect(reward.ModelPath, reward.OriginPoint);
            Remove(kitty);
            SetActive(kitty.ActiveAwards, newEffect);
        }

        public void Remove(Kitty kitty)
        {
            var awards = kitty.ActiveAwards;
            var current = GetActive(awards);
            if (current == null) return;

            kitty.RemoveKittyEffect(ref current);
            SetActive(awards, null);
        }
    }

    private sealed class WingsReward : EffectReward
    {
        protected override effect GetActive(ActiveAwards awards) => awards.ActiveWings;

        protected override void SetActive(ActiveAwards awards, effect value) => awards.ActiveWings = value;

        public override void SetSelected(GameSelectedData data, string rewardName) => data.SelectedWings = rewardName;
    }

    private sealed class HatsReward : EffectReward
    {
        protected override effect GetActive(ActiveAwards awards) => awards.ActiveHats;

        protected override void SetActive(ActiveAwards awards, effect value) => awards.ActiveHats = value;

        public override void SetSelected(GameSelectedData data, string rewardName) => data.SelectedHat = rewardName;
    }

    private sealed class AurasReward : EffectReward
    {
        protected override effect GetActive(ActiveAwards awards) => awards.ActiveAura;

        protected override void SetActive(ActiveAwards awards, effect value) => awards.ActiveAura = value;

        public override void SetSelected(GameSelectedData data, string rewardName) => data.SelectedAura = rewardName;
    }

    private sealed class TrailsReward : EffectReward
    {
        protected override effect GetActive(ActiveAwards awards) => awards.ActiveTrail;

        protected override void SetActive(ActiveAwards awards, effect value) => awards.ActiveTrail = value;

        public override void SetSelected(GameSelectedData data, string rewardName) => data.SelectedTrail = rewardName;
    }

    private sealed class WindwalkReward : IReward
    {
        public void Apply(Kitty kitty, Reward reward) => kitty.ActiveAwards.WindwalkID = reward.AbilityID;

        public void Remove(Kitty kitty) => kitty.ActiveAwards.WindwalkID = 0;

        public void SetSelected(GameSelectedData data, string rewardName) => data.SelectedWindwalk = rewardName;
    }

    private sealed class SkinReward : IReward
    {
        public void Apply(Kitty kitty, Reward reward)
        {
            if (reward.SkinID == 0)
            {
                Logger.Critical($"Skins ID invalid for {reward.Name}");
                return;
            }

            kitty.Unit.Skin = reward.SkinID;
            kitty.KittyMorphosis.ScaleUnit();
            kitty.AsyncEffect?.ReapplyUnitHidden(true);
            kitty.Unit.Name = $"{Colors.PlayerNameColored(kitty.Player)} ({Colors.GetColoredCommandTier(kitty.CommandTier)})";
        }

        public void Remove(Kitty kitty)
        { } // the skin is reset to the default by the reset command, there is nothing attached to remove

        public void SetSelected(GameSelectedData data, string rewardName) => data.SelectedSkin = rewardName;
    }

    /// <summary>Wraps a handler so the reward is applied normally but not stored as the player's selection.</summary>
    private sealed class NotSavedReward : IReward
    {
        private readonly IReward inner;

        public NotSavedReward(IReward inner) => this.inner = inner;

        public void Apply(Kitty kitty, Reward reward) => inner.Apply(kitty, reward);

        public void Remove(Kitty kitty) => inner.Remove(kitty);

        public void SetSelected(GameSelectedData data, string rewardName)
        { }
    }

    private sealed class UnknownReward : IReward
    {
        public void Apply(Kitty kitty, Reward reward)
        { }

        public void Remove(Kitty kitty)
        { }

        public void SetSelected(GameSelectedData data, string rewardName)
        { }
    }
}
