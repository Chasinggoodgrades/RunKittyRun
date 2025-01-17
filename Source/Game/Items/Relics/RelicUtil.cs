using WCSharp.Api;
using static WCSharp.Api.Common;
public static class RelicUtil
{
    public static void DisableRelicBook(unit Unit) => Unit.DisableAbility(Constants.ABILITY_BOOK_OF_RELICS, true, true);

    public static void EnableRelicBook(unit Unit) => Unit.DisableAbility(Constants.ABILITY_BOOK_OF_RELICS, false, false);

    public static void DisableRelicAbilities(unit Unit)
    {
        Unit.DisableAbility(Constants.ABILITY_TAKE_EM_WITH_RING_ULTIMATE, false, true);
        Unit.DisableAbility(Constants.ABILITY_RING_OF_FROSTBITE_RING_ULTIMATE, false, true);
        Unit.DisableAbility(Constants.ABILITY_SUMMON_SHADOW_KITTY, false, true);
        Unit.DisableAbility(Constants.ABILITY_TRANSLOCATE, false, true);
    }

    public static void EnableRelicAbilities(unit Unit)
    {
        Unit.DisableAbility(Constants.ABILITY_TAKE_EM_WITH_RING_ULTIMATE, false, false);
        Unit.DisableAbility(Constants.ABILITY_RING_OF_FROSTBITE_RING_ULTIMATE, false, false);
        Unit.DisableAbility(Constants.ABILITY_SUMMON_SHADOW_KITTY, false, false);
        Unit.DisableAbility(Constants.ABILITY_TRANSLOCATE, false, false);
    }

    /// <summary>
    /// Technically does the job it's assigned to do, however it toggles the multiboard in the process. Should be fixed later. TODO:
    /// </summary>
    /// <param name="Unit"></param>
    public static void CloseRelicBook(unit Unit)
    {
        var player = Unit.Owner;
        if (!player.IsLocal) return;
        ForceUICancel();
    }

    public static void CloseRelicBook(player Player)
    {
        if (!Player.IsLocal) return;
        ForceUICancel();
    }
}