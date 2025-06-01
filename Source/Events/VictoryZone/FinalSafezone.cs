using WCSharp.Api;

public static class FinalSafezone
{
    private static trigger Trigger = trigger.Create();
    private static region Region = RegionList.SafeZones[RegionList.SafeZones.Length - 1].Region;

    public static void Initialize()
    {
        RegisterEvents();
    }

    private static void RegisterEvents()
    {
        Trigger.RegisterEnterRegion(Region, FilterList.KittyFilter);
        Trigger.AddAction(ErrorHandler.Wrap(() =>
        {
            var unit = @event.Unit;
            var player = unit.Owner;
            var kitty = Globals.ALL_KITTIES[player];
            if (TimeSetter.SetRoundTime(player)) MultiboardUtil.RefreshMultiboards();
            if (Gamemode.CurrentGameMode != "Standard") return;

            kitty.CurrentStats.RoundFinished = true;
            NitroChallenges.CompletedNitro(kitty);
            Challenges.PurpleFire(player);
            Challenges.TurquoiseFire(player);
            Challenges.WhiteFire(player);
            Challenges.GreenLightning(player);
            Challenges.PatrioticLight(kitty); // transition to using kitty object later.
            TeamDeathless.PrestartingEvent();
            NoKittyLeftBehind.CheckChallenge();
        }));
    }
}
