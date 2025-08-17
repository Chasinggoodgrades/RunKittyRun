import { CurrentGameMode } from 'src/Gamemodes/CurrentGameMode'
import { GameMode } from 'src/Gamemodes/GameModeEnum'
import { Globals } from 'src/Global/Globals'
import { RegionList } from 'src/Global/RegionList'
import { Challenges } from 'src/Rewards/Challenges/Challenges'
import { NitroChallenges } from 'src/Rewards/Challenges/NitroChallenges'
import { TeamDeathless } from 'src/Rewards/Challenges/TeamDeathless'
import { NoKittyLeftBehind } from 'src/Rewards/EasterEggs/NoKittyLeftBehind'
import { MultiboardUtil } from 'src/UI/Multiboard/MultiboardUtil'
import { ErrorHandler } from 'src/Utility/ErrorHandler'
import { FilterList } from 'src/Utility/FilterList'
import { getTriggerUnit } from 'src/Utility/w3tsUtils'
import { Trigger } from 'w3ts'
import { TimeSetter } from './TimeSetter'

export class FinalSafezone {
    private static triggerHandle: Trigger = Trigger.create()!
    private static Region: region

    public static Initialize = () => {
        FinalSafezone.Region = RegionList.SafeZones[RegionList.SafeZones.length - 1].region()
        FinalSafezone.RegisterEvents()
    }

    private static RegisterEvents = () => {
        FinalSafezone.triggerHandle.registerEnterRegion(FinalSafezone.Region, FilterList.KittyFilter)
        FinalSafezone.triggerHandle.addAction(
            ErrorHandler.Wrap(() => {
                const unit = getTriggerUnit()
                const player = unit.owner
                const kitty = Globals.ALL_KITTIES.get(player)!
                if (TimeSetter.SetRoundTime(player)) MultiboardUtil.RefreshMultiboards()
                if (CurrentGameMode.active !== GameMode.Standard) return

                kitty.CurrentStats.RoundFinished = true
                NitroChallenges.CompletedNitro(kitty)
                Challenges.PurpleFire(player)
                Challenges.TurquoiseFire(player)
                NitroChallenges.WhiteFire(player)
                Challenges.GreenLightning(player)
                Challenges.PatrioticLight(kitty) // transition to using kitty object later.
                TeamDeathless.PrestartingEvent()
                NoKittyLeftBehind.CheckChallenge()
            })
        )
    }
}
