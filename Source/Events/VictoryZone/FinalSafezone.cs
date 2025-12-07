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
            if (TimeSetter.Instance.SetRoundTime(kitty)) MultiboardUtil.RefreshMultiboards();
            if (Gamemode.CurrentGameMode != GameMode.Standard) return;

            TimeSetter.Instance.SetRoundFinishedTime(); // Sets the finished time for the round (when someone hits the final safezone)
            NitroChallenges.CompletedNitro(kitty);
            Challenges.PurpleFire(player);
            Challenges.TurquoiseFire(player);
            Challenges.WhiteFire(player);
            Challenges.GreenLightning(player);
            Challenges.PatrioticLight(kitty);
            TeamDeathless.PrestartingEvent();
            NoKittyLeftBehind.CheckChallenge();
            kitty.CurrentStats.RoundFinished = true;
        }));
    }
}
