export class FinalSafezone {
    private static Trigger: Trigger = Trigger.create()!
    private static Region: region = RegionList.SafeZones[RegionList.SafeZones.length - 1].Region

    public static Initialize() {
        RegisterEvents()
    }

    private static RegisterEvents() {
        Trigger.RegisterEnterRegion(Region, FilterList.KittyFilter)
        Trigger.addAction(
            ErrorHandler.Wrap(() => {
                let unit = getTriggerUnit()
                let player = unit.owner
                let kitty = Globals.ALL_KITTIES.get(player)!
                if (TimeSetter.SetRoundTime(player)) MultiboardUtil.RefreshMultiboards()
                if (Gamemode.CurrentGameMode != GameMode.Standard) return

                kitty.CurrentStats.RoundFinished = true
                NitroChallenges.CompletedNitro(kitty)
                Challenges.PurpleFire(player)
                Challenges.TurquoiseFire(player)
                Challenges.WhiteFire(player)
                Challenges.GreenLightning(player)
                Challenges.PatrioticLight(kitty) // transition to using kitty object later.
                TeamDeathless.PrestartingEvent()
                NoKittyLeftBehind.CheckChallenge()
            })
        )
    }
}
