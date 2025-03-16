public class GameTimesData
{
    public NormalGameTimeData NormalGameTime { get; set; }
    public HardGameTimeData HardGameTime { get; set; }
    public ImpossibleGameTimeData ImpossibleGameTime { get; set; }

    public GameTimesData()
    {
        NormalGameTime = new NormalGameTimeData();
        HardGameTime = new HardGameTimeData();
        ImpossibleGameTime = new ImpossibleGameTimeData();
    }
}

public class NormalGameTimeData
{
    public string Date { get; set; } = "";
    public float Time { get; set; }
    public string TeamMembers { get; set; } = "";
}

public class HardGameTimeData
{
    public string Date { get; set; } = "";
    public float Time { get; set; }
    public string TeamMembers { get; set; } = "";
}

public class ImpossibleGameTimeData
{
    public string Date { get; set; } = "";
    public float Time { get; set; }
    public string TeamMembers { get; set; } = "";
}
