import { Gamemode } from 'src/Gamemodes/Gamemode'
import { Action } from 'src/Utility/CSUtils'
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

    public constructor(kitty: Kitty) {
        Kitty = kitty
        this._cachedProgress = () => Progress.CalculateProgress(Kitty)
        this.Initialize()
    }

    private Initialize() {
        for (let i: number = 1; i <= Gamemode.NumberOfRounds; i++) this.RoundTime.push(i, 0.0)
        for (let i: number = 1; i <= Gamemode.NumberOfRounds; i++) this.RoundProgress.push(i, 0.0)
        this.PeriodicProgressTimer()
    }

    public dispose() {
        this.ProgressTimer.pause()
        this.ProgressTimer?.dispose()
        this.RoundTime.clear()
        this.RoundProgress.clear()
        this.RoundTime = null
        this.RoundProgress = null
    }

    private PeriodicProgressTimer() {
        this.ProgressTimer.Timer.start(0.2, true, this._cachedProgress)
    }

    // #region Time Section

    public GetRoundTime(round: number) {
        return this.RoundTime.has(round) ? this.RoundTime[round] : 0.0
    }

    public GetRoundTimeFormatted(round: number) {
        return this.RoundTime.has(round) ? Utility.ConvertFloatToTime(this.RoundTime[round]) : '0:00'
    }

    public GetTotalTime(): number {
        return this.TotalTime
    }

    public GetTotalTimeFormatted(): string {
        return Utility.ConvertFloatToTime(this.TotalTime)
    }

    public SetRoundTime(round: number, time: number) {
        if (this.RoundTime.has(round)) this.RoundTime[round] = time
        this.SetTotalTime()
    }

    public IncrementRoundTime(round: number) {
        if (this.RoundTime.has(round)) this.RoundTime[round] += GameTimer.RoundSpeedIncrement
        this.SetTotalTime()
    }

    private SetTotalTime() {
        // Solo Tournament Issue
        this.TotalTime = 0.0
        for (let time in this.RoundTime) // IEnumberable
            this.TotalTime += time.Value
    }

    // #endregion Time Section

    // #region Progress Section

    public GetRoundProgress(round: number) {
        return this.RoundProgress.has(round) ? this.RoundProgress[round] : 0.0
    }

    public SetRoundProgress(round: number, progress: number) {
        this.RoundProgress[round] = progress
    }

    public GetOverallProgress(): number {
        // Solo Tournament Issue
        let overallProgress: number = 0.0
        for (let progress in this.RoundProgress) // IEnumberable
            overallProgress += progress.Value
        return overallProgress / this.RoundProgress.length
    }

    // #endregion Progress Section
}
