using System.Collections.Generic;

public class GameTimesData
{
    public NormalGameTimeData NormalGameTime { get; set; }
    public GameTimesData()
    {
        NormalGameTime = new NormalGameTimeData();
    }
}


public class NormalGameTimeData
{
    public string Date { get; set; } = "";
    public float Time { get; set; }
    public List<string> TeamMembers { get; set; } = new List<string>();
}