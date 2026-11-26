using WCSharp.Api;

/// <summary>
/// An item sold in the shop's Miscellaneous panel that carries behaviour of its own (triggers, state), e.g. the rings.
/// Unlike a <see cref="Relic"/> it has no level requirement, no slot limit, no upgrades, and no cooldown-gated selling.
/// </summary>
public abstract class MiscItem : IShopEffect
{
    public string Name { get; }
    public string Description { get; }
    public int AbilityID { get; }
    public int ItemID { get; }
    public int Cost { get; }
    public string IconPath { get; }

    protected MiscItem(string name, string desc, int abilityID, int itemID, int cost, string iconPath)
    {
        Name = name;
        Description = desc;
        AbilityID = abilityID;
        ItemID = itemID;
        Cost = cost;
        IconPath = iconPath;
    }

    public abstract void ApplyEffect(unit Unit);

    public abstract void RemoveEffect(unit Unit);
}
