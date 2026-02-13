public class GameTimesData
{
    public NormalGameTimeData NormalGameTime { get; set; }
    public HardGameTimeData HardGameTime { get; set; }
    public ImpossibleGameTimeData ImpossibleGameTime { get; set; }
    public NightmareGameTimeData NightmareGameTime { get; set; }


    public GameTimesData()
    {
        NormalGameTime = new NormalGameTimeData();
        HardGameTime = new HardGameTimeData();
        ImpossibleGameTime = new ImpossibleGameTimeData();
        NightmareGameTime = new NightmareGameTimeData();
    }
}

/// <summary>
/// Round time references located in <see cref="GameoverUtil.SetBestGameRoundTimes(Kitty)"/>
/// </summary>
public class NormalGameTimeData
{
    public string Date { get; set; } = "";
    public float Time { get; set; }
    public string TeamMembers { get; set; } = "";
    public float RoundOneTime { get; set; }
    public float RoundTwoTime { get; set; }
    public float RoundThreeTime { get; set; }
    public float RoundFourTime { get; set; }
    public float RoundFiveTime { get; set; }
}

public class HardGameTimeData
{
    public string Date { get; set; } = "";
    public float Time { get; set; }
    public string TeamMembers { get; set; } = "";
    public float RoundOneTime { get; set; }
    public float RoundTwoTime { get; set; }
    public float RoundThreeTime { get; set; }
    public float RoundFourTime { get; set; }
    public float RoundFiveTime { get; set; }
}

public class ImpossibleGameTimeData
{
    public string Date { get; set; } = "";
    public float Time { get; set; }
    public string TeamMembers { get; set; } = "";
    public float RoundOneTime { get; set; }
    public float RoundTwoTime { get; set; }
    public float RoundThreeTime { get; set; }
    public float RoundFourTime { get; set; }
    public float RoundFiveTime { get; set; }
}

public class NightmareGameTimeData
{
    public string Date { get; set; } = "";
    public float Time { get; set; }
    public string TeamMembers { get; set; } = "";
    public float RoundOneTime { get; set; }
    public float RoundTwoTime { get; set; }
    public float RoundThreeTime { get; set; }
    public float RoundFourTime { get; set; }
    public float RoundFiveTime { get; set; }
}
