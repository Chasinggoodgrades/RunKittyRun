public class TournamentRoundData
{
    public float RoundTime { get; set; }
    public float Progress { get; set; }
    public int Saves { get; set; }
    public int Deaths { get; set; }
    public int Level { get; set; }

    public TournamentRoundData()
    {

    }

    public void Reset()
    {
        RoundTime = 0.0f;
        Progress = 0.0f;
        Saves = 0;
        Deaths = 0;
        Level = 1;
    }
}
