using WCSharp.Api;
using WCSharp.Shared.Data;
using static WCSharp.Api.Common;
public static class TerrainChanger
{
    public static int[] Terrains { get; set; }
    public static int[] SafezoneTerrain { get; set; }

    public static void Initialize()
    {
        InitializeTerrain();
        if (Gamemode.CurrentGameMode != "Standard") return;
        ChristmasTerrain();
        SetTerrain();
    }

    /// <summary>
    /// Sets the terrain based on current round. Includes seasonal terrains.
    /// </summary>
    public static void SetTerrain()
    {
        SetWolfRegionTerrain();
        SetSafezoneTerrain();
    }

    public static void NoSeasonTerrain()
    {
        InitializeTerrain();
        SetTerrain();
    }

    public static void ActivateChristmasTerrain()
    {
        ChristmasTerrain(true);
        SetTerrain();
    }

    private static void InitializeTerrain()
    {
        Terrains = new int[Gamemode.NumberOfRounds];
        Terrains[0] = FourCC("Lgrd");
        Terrains[1] = FourCC("Ygsb");
        Terrains[2] = FourCC("Vgrs");
        Terrains[3] = FourCC("Xhdg");
        Terrains[4] = FourCC("Ywmb");

        SafezoneTerrain = new int[Gamemode.NumberOfRounds];
        for(int i = 0; i < Gamemode.NumberOfRounds; i++) {
            SafezoneTerrain[i] = FourCC("Jblm");
        }
    }

    private static void ChristmasTerrain(bool adminActivated = false)
    {
        if (!SeasonalManager.ChristmasSeason() && !adminActivated) return;
        SafezoneTerrain[0] = FourCC("Ibkb");
        SafezoneTerrain[1] = FourCC("Ksmb");
        SafezoneTerrain[2] = FourCC("Drds");
        SafezoneTerrain[3] = FourCC("Kdkt");
        SafezoneTerrain[4] = FourCC("Oaby");
        for(int i = 0; i < Gamemode.NumberOfRounds; i++) {
            Terrains[i] = FourCC("Nrck");
        }
    }

    private static void SetWolfRegionTerrain()
    {
        SetTerrainAtLocation(-20, 20, 18, 24); // Wolf Region #1
        SetTerrainAtLocation(20, 26, -23, 17); // Wolf Region #2
        SetTerrainAtLocation(-20, 20, -27, -23); // Wolf Region #3
        SetTerrainAtLocation(-26, -20, -23, 12); // Wolf Region #4  
        SetTerrainAtLocation(-20, 15, 13, 16); // Wolf Region #5
        SetTerrainAtLocation(15, 18, -18, 12); // Wolf Region #6
        SetTerrainAtLocation(-15, 15, -21, -18); // Wolf Region #7
        SetTerrainAtLocation(-19, -15, -18, 7); // Wolf Region #8
        SetTerrainAtLocation(-15, 10, 7, 10); // Wolf Region #9
        SetTerrainAtLocation(10, 13, -13, 7); // Wolf Region #10
        SetTerrainAtLocation(-10, 10, -16, -13); // Wolf Region #11
        SetTerrainAtLocation(-13, -10, -13, 2); // Wolf Region #12
        SetTerrainAtLocation(-10, 5, 2, 5); // Wolf Region #13
        SetTerrainAtLocation(5, 7, -11, 2); // Wolf Region #14
        SetTerrainAtLocation(-7, 7, -11, -8); // Wolf Region #15
        SetTerrainAtLocation(-7, -4, -11, 0); // Wolf Region #16
        SetTerrainAtLocation(-7, -1, -3, 0); // Wolf Region #17
    }

    private static void SetSafezoneTerrain()
    {
        SetTerrainAtSafezone(-25, -21, 18, 24); // Safezone #1 
        SetTerrainAtSafezone(21, 26, 18, 24); // Safezone #2 
        SetTerrainAtSafezone(21, 26, -27, -23); // Safezone #3 
        SetTerrainAtSafezone(-25, -21, -27, -23); // Safezone #4 
        SetTerrainAtSafezone(-26, -21, 13, 16); // Safezone #5 
        SetTerrainAtSafezone(16, 18, 13, 16); // Safezone #6 
        SetTerrainAtSafezone(16, 18, -21, -19); // Safezone #7 
        SetTerrainAtSafezone(-19, -16, -21, -19); // Safezone #8 
        SetTerrainAtSafezone(-19, -16, 8, 10); // Safezone #9 
        SetTerrainAtSafezone(11, 13, 8, 10); // Safezone #10 
        SetTerrainAtSafezone(11, 13, -16, -14); // Safezone #11 
        SetTerrainAtSafezone(-13, -11, -16, -14); // Safezone #12 
        SetTerrainAtSafezone(-13, -11, 3, 5); // Safezone #13 
        SetTerrainAtSafezone(6, 7, 3, 5); // Safezone #14
    }

    private static void SetTerrainAtLocation(float left, float right, float bot, float top)
    {
        var round = Globals.ROUND > 1 ? Globals.ROUND - 1 : 0;
        for(float x = left * 128f; x <= right * 128f; x += 128f)
        {
            for(float y = bot * 128f; y <= top * 128f; y += 128f)
            {
                SetTerrainType(x, y, Terrains[round], -1, 1, 1);
            }
        }
    }

    private static void SetTerrainAtSafezone(float left, float right, float bot, float top)
    {
        var round = Globals.ROUND > 1 ? Globals.ROUND - 1 : 0;
        for (float x = left * 128f; x <= right * 128f; x += 128f)
        {
            for (float y = bot * 128f; y <= top * 128f; y += 128f)
            {
                SetTerrainType(x, y, SafezoneTerrain[round], -1, 1, 1);
            }
        }
    }

}