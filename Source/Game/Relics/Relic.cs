using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;
public abstract class Relic
{
    public string Name { get; }
    public string Description { get; }
    public int ItemID { get; }
    public int Cost { get; }
    public string IconPath { get; }

    public Relic(string name, string desc, int itemID, int cost, string iconPath)
    {
        Name = name;
        Description = desc;
        ItemID = itemID;
        Cost = cost;
        IconPath = iconPath;
    }

    public abstract void ApplyEffect(unit Unit);

    public abstract void RemoveEffect(unit Unit);

    public void Equip(unit Unit) => Unit.AddItem(ItemID);
}