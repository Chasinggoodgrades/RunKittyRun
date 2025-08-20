import { AffixFactory } from 'src/Affixes/AffixFactory'
import { Gameover } from 'src/Events/Gameover'
import { Logger } from 'src/Events/Logger/Logger'
import { CurrentGameMode } from 'src/Gamemodes/CurrentGameMode'
import { GameMode } from 'src/Gamemodes/GameModeEnum'
import { TeamsUtil } from 'src/Gamemodes/Teams/TeamsUtil'
import { Globals } from 'src/Global/Globals'
import { BarrierSetup } from 'src/Init/BarrierSetup'
import { Difficulty } from 'src/Init/Difficulty/Difficulty'
import { Resources } from 'src/Init/Resources'
import { ChainedTogether } from 'src/Rewards/Challenges/ChainedTogether'
import { DeathlessChallenges } from 'src/Rewards/Challenges/DeathlessChallenges'
import { NitroChallenges } from 'src/Rewards/Challenges/NitroChallenges'
import { TeamDeathless } from 'src/Rewards/Challenges/TeamDeathless'
import { SaveManager } from 'src/SaveSystem2.0/SaveManager'
import { TerrainChanger } from 'src/Seasonal/Terrain/TerrainChanger'
import { SoundManager } from 'src/Sounds/SoundManager'
import { MultiboardUtil } from 'src/UI/Multiboard/MultiboardUtil'
import { Tips } from 'src/UI/Tips/Tips'
import { Colors } from 'src/Utility/Colors/Colors'
import { createAchesTimer } from 'src/Utility/MemoryHandler/AchesTimers'
import { Utility } from 'src/Utility/Utility'
import { NitroPacer } from '../Entities/NitroPacer'
import { Wolf } from '../Entities/Wolf'
import { Safezone } from '../Management/Safezone'
import { WolfLaneHider } from '../WolfLaneHider/WolfLaneHider'
import { GameTimer } from './GameTimer'
import { RoundTimer } from './RoundTimer'
import { RoundUtilities } from './RoundUtilities'

export class RoundManager {
    public static ROUND_INTERMISSION = 30.0
    public static GAME_STARTED: boolean = false
    private static AddedTimeAlready: boolean = false

    public static Initialize = () => {
        if (CurrentGameMode.active === GameMode.Standard) RoundManager.HasDifficultyBeenChosen()
        else RoundManager.RoundSetup()
    }

    public static AddMoreRoundTime(): boolean {
        if (RoundManager.AddedTimeAlready) return false
        const remainingTime = RoundTimer.StartRoundTimer.remaining
        if (remainingTime <= 0.0) return false
        RoundManager.AddedTimeAlready = true
        const tempTime = remainingTime + 20.0 // 20 seconds
        RoundTimer.StartRoundTimer.start(tempTime, false, () => RoundManager.StartRound())
        return true
    }

    private static RoundSetup = () => {
        try {
            Globals.ROUND += 1
            GameTimer.RoundTime[Globals.ROUND] = 0.0
            NitroChallenges.SetNitroRoundTimes()
            Safezone.ResetPlayerSafezones()
            Wolf.SpawnWolves()
            Utility.SimpleTimer(1.0, AffixFactory.DistAffixes)
            RoundManager.AddedTimeAlready = false
            if (Globals.ROUND > 1) TerrainChanger.SetTerrain()

            RoundTimer.InitEndRoundTimer()
            RoundTimer.StartRoundTimer.start(RoundManager.ROUND_INTERMISSION, false, RoundManager.StartRound)

            RoundTimer.CountDown()
            TeamDeathless.StartEvent()
            ChainedTogether.StartEvent()
            WolfLaneHider.HideAllLanes()
            WolfLaneHider.LanesHider()
        } catch (e) {
            Logger.Critical(`Error in RoundManager.RoundSetup ${e}`)
            throw e
        }
    }

    private static StartRound = () => {
        RoundManager.GAME_STARTED = true
        Globals.GAME_ACTIVE = true
        RoundTimer.RoundTimerDialog.display = false
        RoundTimer.StartEndRoundTimer()

        BarrierSetup.DeactivateBarrier()
        NitroChallenges.StartNitroTimer()
        NitroPacer.StartNitroPacer()
        SoundManager.PlayRoundSound()
        Utility.TimedTextToAllPlayers(2.0, `${Colors.COLOR_CYAN}Run Kitty Run!!|r`)
    }

    private static HasDifficultyBeenChosen = () => {
        const Timer = createAchesTimer()
        Timer.Timer.start(0.35, true, () => {
            if (Difficulty.IsDifficultyChosen && Globals.ROUND === 0) {
                RoundManager.RoundSetup()
                Timer.dispose()
            }
        })
    }

    public static RoundEnd = () => {
        try {
            Globals.GAME_ACTIVE = false
            MultiboardUtil.RefreshMultiboards()
            RoundTimer.EndRoundTimer.pause()
            NitroChallenges.StopNitroTimer()
            Wolf.RemoveAllWolves()
            BarrierSetup.ActivateBarrier()
            Resources.BonusResources()
            RoundUtilities.MovedTimedCameraToStart()
            RoundUtilities.RoundResetAll()
            RoundUtilities.MoveAllPlayersToStart()
            TeamsUtil.RoundResetAllTeams()
            NitroPacer.ResetNitroPacer()
            DeathlessChallenges.ResetDeathless()
            WolfLaneHider.ResetLanes()
            SaveManager.SaveAll()
            if (Globals.ROUND === 5) Globals.WinGame = true
            if (Gameover.GameOver()) return
            Tips.DisplayTip()
            Utility.SimpleTimer(Globals.END_ROUND_DELAY, RoundManager.RoundSetup)
        } catch (e) {
            Logger.Critical(`Error in RoundManager.RoundEnd ${e}`)
            throw e
        }
    }

    public static RoundEndCheck(): boolean {
        // Always returns for standard mode, and solo progression mode.
        for (let i = 0; i < Globals.ALL_KITTIES_LIST.length; i++) {
            const kitty = Globals.ALL_KITTIES_LIST[i]
            if (!kitty.Finished) return false
        }
        RoundManager.RoundEnd()
        return true
    }

    public static RoundEndCheckSolo = () => {
        if (Globals.CurrentGameModeType !== Globals.SOLO_MODES[0]) return // Progression mode

        for (let i = 0; i < Globals.ALL_PLAYERS.length; i++) {
            const kitty = Globals.ALL_KITTIES.get(Globals.ALL_PLAYERS[i])!
            if (kitty.isAlive()) return
        }
        RoundManager.RoundEnd()
    }

    public static DidTeamEnd = (teamId: number) => {
        const teamMemebers = Globals.ALL_TEAMS.get(teamId)!.Teammembers
        // Always returns for standard mode, and solo progression mode.
        for (let i = 0; i < teamMemebers.length; i++) {
            const member = teamMemebers[i]
            const kitty = Globals.ALL_KITTIES.get(member)!
            if (!kitty.Finished) return false
        }
        return true
    }
}
