import { PersonalBestAwarder } from 'src/Game/Podium/PersonalBestAwarder'
import { GameTimer } from 'src/Game/Rounds/GameTimer'
import { CurrentGameMode } from 'src/Gamemodes/CurrentGameMode'
import { GameMode } from 'src/Gamemodes/GameModeEnum'
import { Globals } from 'src/Global/Globals'
import { MapPlayer } from 'w3ts'
import { RoundTimesData } from '../../SaveSystem2.0/MAKE REWARDS HERE/SaveObjects/RoundTimesData'
import { Logger } from '../Logger/Logger'
import { RoundEnums } from './RoundEnums'

export class TimeSetter {
    /// <summary>
    /// Sets the round time for standard and solo modes if the given player has a slower time than the current round time.
    /// </summary>
    /// <param name="player"></param>
    public static SetRoundTime(player: MapPlayer) {
        try {
            const standard = CurrentGameMode.active === GameMode.Standard
            const solo = CurrentGameMode.active === GameMode.SoloTournament // Solo
            let roundString: string = ''
            const currentTime = GameTimer.RoundTime[Globals.ROUND] || 0
            if (!Globals.ALL_KITTIES.get(player)!.CanEarnAwards) return false

            if (currentTime <= 90) return false // Below 90 seconds is impossible and not valid.. Don't save

            if (!standard && !solo) return false

            if (standard) roundString = RoundEnums.GetRoundEnum()
            if (solo) roundString = RoundEnums.GetSoloRoundEnum()
            if (currentTime >= 3599.0) return false // 59min 59 second cap

            const value = Globals.ALL_KITTIES.get(player)!.SaveData.RoundTimes[roundString as keyof RoundTimesData]

            if (currentTime >= value && value !== 0) return false

            RoundEnums.SetSavedTime(player, roundString)
            PersonalBestAwarder.BeatRecordTime(player)

            return true
        } catch (e) {
            Logger.Critical(`Error in TimeSetter.SetRoundTime: ${e}`)
            throw e
        }
    }
}
