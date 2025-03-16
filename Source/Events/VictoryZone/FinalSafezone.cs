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
        Trigger.RegisterEnterRegion(Region, Filters.KittyFilter);
        Trigger.AddAction(ErrorHandler.Wrap(() =>
        {
            var unit = @event.Unit;
            var player = unit.Owner;

            if (TimeSetter.SetRoundTime(player)) MultiboardUtil.RefreshMultiboards();
            if (Gamemode.CurrentGameMode != "Standard") return;

            Globals.ALL_KITTIES[player].CurrentStats.RoundFinished = true;
            NitroChallenges.CompletedNitro(unit);
            Challenges.PurpleFire(player);
            Challenges.TurquoiseFire(player);
            Challenges.WhiteFire(player);
            Challenges.GreenLightning(player);
            NoKittyLeftBehind.CheckChallenge();
        }));
    }
}
