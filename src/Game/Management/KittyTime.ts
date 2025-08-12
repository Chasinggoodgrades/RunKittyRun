import { Gamemode } from 'src/Gamemodes/Gamemode'
import { AchesTimers } from 'src/Utility/MemoryHandler/AchesTimers'
import { MemoryHandler } from 'src/Utility/MemoryHandler/MemoryHandler'
import { Utility } from 'src/Utility/Utility'
import { Kitty } from '../Entities/Kitty/Kitty'
import { GameTimer } from '../Rounds/GameTimer'
import { Progress } from './Progress'

export class KittyTime {
    private readonly _cachedProgress: Action
    private RoundTime: Map<number, number> = new Map()
    private RoundProgress: Map<number, number> = new Map()
    private ProgressTimer: AchesTimers = MemoryHandler.getEmptyObject<AchesTimers>()
    private TotalTime: number
    private Kitty: Kitty

    public KittyTime(kitty: Kitty) {
        Kitty = kitty
        _cachedProgress = () => Progress.CalculateProgress(Kitty)
        Initialize()
    }

    private Initialize() {
        for (let i: number = 1; i <= Gamemode.NumberOfRounds; i++) RoundTime.push(i, 0.0)
        for (let i: number = 1; i <= Gamemode.NumberOfRounds; i++) RoundProgress.push(i, 0.0)
        PeriodicProgressTimer()
    }

    public Dispose() {
        ProgressTimer.pause()
        ProgressTimer?.Dispose()
        RoundTime.clear()
        RoundProgress.clear()
        RoundTime = null
        RoundProgress = null
    }

    private PeriodicProgressTimer() {
        ProgressTimer.Timer.start(0.2, true, _cachedProgress)
    }

    // #region Time Section

    public GetRoundTime(round: number) {
        return RoundTime.has(round) ? RoundTime[round] : 0.0
    }

    public GetRoundTimeFormatted(round: number) {
        return RoundTime.has(round) ? Utility.ConvertFloatToTime(RoundTime[round]) : '0:00'
    }

    public GetTotalTime(): number {
        return TotalTime
    }

    public GetTotalTimeFormatted(): string {
        return Utility.ConvertFloatToTime(TotalTime)
    }

    public SetRoundTime(round: number, time: number) {
        if (RoundTime.has(round)) RoundTime[round] = time
        SetTotalTime()
    }

    public IncrementRoundTime(round: number) {
        if (RoundTime.has(round)) RoundTime[round] += GameTimer.RoundSpeedIncrement
        SetTotalTime()
    }

    private SetTotalTime() {
        // Solo Tournament Issue
        TotalTime = 0.0
        for (let time in RoundTime) // IEnumberable
            TotalTime += time.Value
    }

    // #endregion Time Section

    // #region Progress Section

    public GetRoundProgress(round: number) {
        return RoundProgress.has(round) ? RoundProgress[round] : 0.0
    }

    public SetRoundProgress(round: number, progress: number) {
        RoundProgress[round] = progress
    }

    public GetOverallProgress(): number {
        // Solo Tournament Issue
        let overallProgress: number = 0.0
        for (let progress in RoundProgress) // IEnumberable
            overallProgress += progress.Value
        return overallProgress / RoundProgress.length
    }

    // #endregion Progress Section
}
