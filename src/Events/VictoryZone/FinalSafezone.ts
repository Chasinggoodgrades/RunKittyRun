class FinalSafezone {
    private static Trigger: trigger = CreateTrigger()
    private static Region: region = RegionList.SafeZones[RegionList.SafeZones.Length - 1].Region

    public static Initialize() {
        RegisterEvents()
    }

    private static RegisterEvents() {
        Trigger.RegisterEnterRegion(Region, FilterList.KittyFilter)
        Trigger.AddAction(
            ErrorHandler.Wrap(() => {
                let unit = GetTriggerUnit()
                let player = unit.Owner
                let kitty = Globals.ALL_KITTIES[player]
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
