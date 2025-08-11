class KittyTime {
    private readonly _cachedProgress: Action
    private RoundTime: { [x: number]: number } = {}
    private RoundProgress: { [x: number]: number } = {}
    private ProgressTimer: AchesTimers = ObjectPool.GetEmptyObject<AchesTimers>()
    private TotalTime: number
    private Kitty: Kitty

    public KittyTime(kitty: Kitty) {
        Kitty = kitty
        _cachedProgress = () => Progress.CalculateProgress(Kitty)
        Initialize()
    }

    private Initialize() {
        for (let i: number = 1; i <= Gamemode.NumberOfRounds; i++) RoundTime.Add(i, 0.0)
        for (let i: number = 1; i <= Gamemode.NumberOfRounds; i++) RoundProgress.Add(i, 0.0)
        PeriodicProgressTimer()
    }

    public Dispose() {
        ProgressTimer.Pause()
        ProgressTimer?.Dispose()
        RoundTime.Clear()
        RoundProgress.Clear()
        RoundTime = null
        RoundProgress = null
    }

    private PeriodicProgressTimer() {
        ProgressTimer.Timer.Start(0.2, true, _cachedProgress)
    }

    // #region Time Section

    public GetRoundTime(round: number) {
        return RoundTime.ContainsKey(round) ? RoundTime[round] : 0.0
    }

    public GetRoundTimeFormatted(round: number) {
        return RoundTime.ContainsKey(round) ? Utility.ConvertFloatToTime(RoundTime[round]) : '0:00'
    }

    public GetTotalTime(): number {
        return TotalTime
    }

    public GetTotalTimeFormatted(): string {
        return Utility.ConvertFloatToTime(TotalTime)
    }

    public SetRoundTime(round: number, time: number) {
        if (RoundTime.ContainsKey(round)) RoundTime[round] = time
        SetTotalTime()
    }

    public IncrementRoundTime(round: number) {
        if (RoundTime.ContainsKey(round)) RoundTime[round] += GameTimer.RoundSpeedIncrement
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
        return RoundProgress.ContainsKey(round) ? RoundProgress[round] : 0.0
    }

    public SetRoundProgress(round: number, progress: number) {
        RoundProgress[round] = progress
    }

    public GetOverallProgress(): number {
        // Solo Tournament Issue
        let overallProgress: number = 0.0
        for (let progress in RoundProgress) // IEnumberable
            overallProgress += progress.Value
        return overallProgress / RoundProgress.Count
    }

    // #endregion Progress Section
}
