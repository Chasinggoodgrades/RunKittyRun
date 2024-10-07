using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;
public abstract class Relic
{
    public string Name;
    public string Description;
    public int ItemID;
    public int Cost;

    public Relic(string name, string desc, int itemID, int cost)
    {
        Name = name;
        Description = desc;
        ItemID = itemID;
        Cost = cost;
    }

    public abstract void ApplyEffect(unit Unit);

    public abstract void RemoveEffect(unit Unit);

    public void Equip(unit Unit) => Unit.AddItem(ItemID);
}