using System.Collections.Generic;
using WCSharp.Api;
using static WCSharp.Api.Common;
public abstract class Relic
{
    public static int RequiredLevel = 10;
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

    public static void DisableRelicBook(unit Unit) => Unit.DisableAbility(Constants.ABILITY_BOOK_OF_RELICS, true, true);

    public static void EnableRelicBook(unit Unit) => Unit.DisableAbility(Constants.ABILITY_BOOK_OF_RELICS, false, false);

    public static void DisableRelicAbilities(unit Unit)
    {
        Unit.DisableAbility(Constants.ABILITY_RING_OF_FROSTBITE_RING_ULTIMATE, true, true);
        Unit.DisableAbility(Constants.ABILITY_SUMMON_SHADOW_KITTY, true, true);
        Unit.DisableAbility(Constants.ABILITY_TAKE_EM_WITH_RING_ULTIMATE, true, true);
    }

}