using System.Threading;

public class TournamentStats
{
    public string Tournament_ID { get; set; } = "";
    public bool AdminApproved { get; set; } = false; // Dictates whether this tournament can be shown on webend.
    public string PlayerName { get; set; } = "";
    public string Region { get; set; } = "";
    public string Gamemode { get; set; } = "";
    public string GameType { get; set; } = "";
    public string DateTime { get; set; } = "";
    public TournamentGameData Game_1 { get; set; }
    public TournamentGameData Game_2 { get; set; }
    public TournamentGameData Game_3 { get; set; }

    public TournamentStats()
    {
        Game_1 = new TournamentGameData();
        Game_2 = new TournamentGameData();
        Game_3 = new TournamentGameData();
    }

    public void Reset()
    {
        Tournament_ID = "";
        AdminApproved = false;
        PlayerName = "";
        Region = "";
        Gamemode = "";
        GameType = "";
        DateTime = "";
        Game_1.Reset();
        Game_2.Reset();
        Game_3.Reset();
    }

}
