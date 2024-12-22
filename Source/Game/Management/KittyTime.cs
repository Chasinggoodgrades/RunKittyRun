using System.Collections.Generic;
using WCSharp.Api;

public class KittyTime
{
    private Dictionary<int, float> RoundTime { get; set; } = new Dictionary<int, float>();
    private Dictionary<int, float> RoundProgress { get; set; } = new Dictionary<int, float>();
    private timer ProgressTimer { get; set; } = timer.Create();
    private float TotalTime { get; set; }
    private Kitty Kitty { get; set; }

    public KittyTime(Kitty kitty)
    {
        Kitty = kitty;
        Initialize();
    }

    private void Initialize()
    {
        for(int i = 1; i <= Gamemode.NumberOfRounds; i++)
            RoundTime.Add(i, 0.0f);
        for(int i = 1; i <= Gamemode.NumberOfRounds; i++)
            RoundProgress.Add(i, 0.0f);
        PeriodicProgressTimer();
    }

    private void PeriodicProgressTimer()
    {
        ProgressTimer.Start(0.2f, true, () => Progress.CalculateProgress(Kitty));
    }
    #region Time Section
    public float GetRoundTime(int round)
    {
        if(RoundTime.ContainsKey(round))
            return RoundTime[round];
        return 0.0f;
    }

    public string GetRoundTimeFormatted(int round)
    {
        if(RoundTime.ContainsKey(round))
            return Utility.ConvertFloatToTime(RoundTime[round]);
        return "0:00";
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
        if(RoundTime.ContainsKey(round))
            RoundTime[round] = time;
        SetTotalTime();
    }

    public void IncrementRoundTime(int round)
    {
        if(RoundTime.ContainsKey(round))
            RoundTime[round] += GameTimer.RoundSpeedIncrement;
        SetTotalTime();
    }

    private void SetTotalTime()
    {
        TotalTime = 0.0f;
        foreach(var time in RoundTime.Values)
            TotalTime += time;
    }
    #endregion

    #region Progress Section
    public float GetRoundProgress(int round)
    {
        if(RoundProgress.ContainsKey(round))
            return RoundProgress[round];
        return 0.0f;
    }

    public void SetRoundProgress(int round, float progress)
    {
        if(RoundProgress.ContainsKey(round))
            RoundProgress[round] = progress;
    }

    public float GetOverallProgress()
    {
        float overallProgress = 0.0f;
        foreach(var progress in RoundProgress.Values)
            overallProgress += progress;
        return overallProgress / RoundProgress.Count;
    }
    #endregion


}