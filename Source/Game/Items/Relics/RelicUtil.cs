using WCSharp.Api;

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
}