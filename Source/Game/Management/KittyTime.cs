using System;
using System.Collections.Generic;
using WCSharp.Api;

public class KittyTime
{
    private readonly Action _cachedProgress;
    private Dictionary<int, float> RoundTime { get; set; } = new Dictionary<int, float>();
    private Dictionary<int, float> RoundProgress { get; set; } = new Dictionary<int, float>();
    private AchesTimers ProgressTimer { get; set; } = ObjectPool<AchesTimers>.GetEmptyObject();
    private float TotalTime { get; set; }
    private Kitty Kitty { get; set; }

    public KittyTime(Kitty kitty)
    {
        Kitty = kitty;
        _cachedProgress = () => Progress.CalculateProgress(Kitty);
        Initialize();
    }

    private void Initialize()
    {
        for (int i = 1; i <= Gamemode.NumberOfRounds; i++)
            RoundTime.Add(i, 0.0f);
        for (int i = 1; i <= Gamemode.NumberOfRounds; i++)
            RoundProgress.Add(i, 0.0f);
        PeriodicProgressTimer();
    }

    public void Dispose()
    {
        ProgressTimer.Pause();
        ProgressTimer?.Dispose();
        RoundTime.Clear();
        RoundProgress.Clear();
        RoundTime = null;
        RoundProgress = null;
    }

    private void PeriodicProgressTimer()
    {
        ProgressTimer.Timer.Start(0.2f, true, _cachedProgress);
    }

    #region Time Section

    public float GetRoundTime(int round)
    {
        return RoundTime.ContainsKey(round) ? RoundTime[round] : 0.0f;
    }

    public string GetRoundTimeFormatted(int round)
    {
        return RoundTime.ContainsKey(round) ? Utility.ConvertFloatToTime(RoundTime[round]) : "0:00";
    }

    public float GetTotalTime()
    {
        return TotalTime;
    }

    public string GetTotalTimeFormatted()
    {
        return Utility.ConvertFloatToTime(TotalTime);
    }

    public void SetRoundTime(int round, float time)
    {
        if (RoundTime.ContainsKey(round))
            RoundTime[round] = time;
        SetTotalTime();
    }

    public void IncrementRoundTime(int round)
    {
        if (RoundTime.ContainsKey(round))
            RoundTime[round] += GameTimer.RoundSpeedIncrement;
        SetTotalTime();
    }

    private void SetTotalTime() // Solo Tournament Issue
    {
        TotalTime = 0.0f;
        foreach (var time in RoundTime) // IEnumberable
            TotalTime += time.Value;
    }

    #endregion Time Section

    #region Progress Section

    public float GetRoundProgress(int round)
    {
        return RoundProgress.ContainsKey(round) ? RoundProgress[round] : 0.0f;
    }

    public void SetRoundProgress(int round, float progress)
    {
        RoundProgress[round] = progress;
    }

    public float GetOverallProgress() // Solo Tournament Issue
    {
        float overallProgress = 0.0f;
        foreach (var progress in RoundProgress) // IEnumberable
            overallProgress += progress.Value;
        return overallProgress / RoundProgress.Count;
    }

    #endregion Progress Section
}
