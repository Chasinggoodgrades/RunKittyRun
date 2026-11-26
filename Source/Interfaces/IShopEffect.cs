using WCSharp.Api;

/// <summary>
/// Something sold in the shop that carries behaviour tied to the buying unit, e.g. a <see cref="Relic"/> or <see cref="MiscItem"/>.
/// </summary>
public interface IShopEffect
{
    string Name { get; }
    string Description { get; }
    int ItemID { get; }
    int Cost { get; }
    string IconPath { get; }

    void ApplyEffect(unit Unit);

    void RemoveEffect(unit Unit);
}
