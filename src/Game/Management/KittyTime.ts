import { Globals } from 'src/Global/Globals'
import { Action } from 'src/Utility/CSUtils'
import { AchesTimers, createAchesTimer } from 'src/Utility/MemoryHandler/AchesTimers'
import { Utility } from 'src/Utility/Utility'
import { Kitty } from '../Entities/Kitty/Kitty'
import { GameTimer } from '../Rounds/GameTimer'
import { Progress } from './Progress'

export class KittyTime {
    private readonly _cachedProgress: Action
    private RoundTime: Map<number, number> = new Map()
    private RoundProgress: Map<number, number> = new Map()
    private ProgressTimer: AchesTimers = createAchesTimer()
    private TotalTime = 0
    private Kitty: Kitty

    public constructor(kitty: Kitty) {
        this.Kitty = kitty
        this._cachedProgress = () => Progress.CalculateProgress(this.Kitty)
        this.Initialize()
    }

    private Initialize = () => {
        for (let i = 1; i <= Globals.NumberOfRounds; i++) this.RoundTime.set(i, 0.0)
        for (let i = 1; i <= Globals.NumberOfRounds; i++) this.RoundProgress.set(i, 0.0)
        this.PeriodicProgressTimer()
    }

    public dispose = () => {
        this.ProgressTimer.pause()
        this.ProgressTimer?.dispose()
        this.RoundTime.clear()
        this.RoundProgress.clear()
    }

    private PeriodicProgressTimer = () => {
        this.ProgressTimer.Timer.start(0.2, true, this._cachedProgress)
    }

    // #region Time Section

    public GetRoundTime(round: number) {
        return this.RoundTime.has(round) ? this.RoundTime.get(round)! : 0.0
    }

    public GetRoundTimeFormatted(round: number) {
        return this.RoundTime.has(round) ? Utility.ConvertFloatToTime(this.RoundTime.get(round)!) : '0:00'
    }

    public GetTotalTime(): number {
        return this.TotalTime
    }

    public GetTotalTimeFormatted(): string {
        return Utility.ConvertFloatToTime(this.TotalTime)
    }

    public SetRoundTime(round: number, time: number) {
        if (this.RoundTime.has(round)) this.RoundTime.set(round, time)
        this.SetTotalTime()
    }

    public IncrementRoundTime(round: number) {
        if (this.RoundTime.has(round))
            this.RoundTime.set(round, this.RoundTime.get(round)! + GameTimer.RoundSpeedIncrement)
        this.SetTotalTime()
    }

    private SetTotalTime = () => {
        // Solo Tournament Issue
        this.TotalTime = 0.0
        for (const [_, time] of this.RoundTime) // IEnumberable
            this.TotalTime += time
    }

    // #endregion Time Section

    // #region Progress Section

    public GetRoundProgress(round: number) {
        return this.RoundProgress.has(round) ? this.RoundProgress.get(round)! : 0.0
    }

    public SetRoundProgress(round: number, progress: number) {
        this.RoundProgress.set(round, progress)
    }

    public GetOverallProgress(): number {
        // Solo Tournament Issue
        let overallProgress = 0.0
        for (const [_, progress] of this.RoundProgress) // IEnumberable
            overallProgress += progress
        return overallProgress / this.RoundProgress.size
    }

    // #endregion Progress Section
}
