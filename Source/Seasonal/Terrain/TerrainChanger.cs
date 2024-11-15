using WCSharp.Api;
using static WCSharp.Api.Common;
public static class TerrainChanger
{
    public static int[] Terrains { get; set; }
    public static int[] SafezoneTerrain { get; set; }
    private static int CurrentMonth { get; set; }

    public static void Initialize()
    {
        InitializeTerrain();
        if (Gamemode.CurrentGameMode != "Standard") return;
        CurrentMonth = DateTimeManager.DateTime.Month;
        //ChristmasSafezones();
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

    private static void ChristmasSafezones()
    {
        if (CurrentMonth == 11 || CurrentMonth == 12)
        {
            SafezoneTerrain[0] = FourCC("Ibkb");
            SafezoneTerrain[1] = FourCC("Ksmb");
            SafezoneTerrain[2] = FourCC("Drds");
            SafezoneTerrain[3] = FourCC("Kdkt");
            SafezoneTerrain[4] = FourCC("Oaby");
        }

    }

    /// <summary>
    /// Sets the terrain based on current round. Includes seasonal terrains.
    /// </summary>
    public static void SetTerrain()
    {
        foreach (var region in RegionList.WolfRegions)
        {
            // Extending the boundaries by an extra 128 units
            float minX = region.Rect.MinX - 128f;
            float maxX = region.Rect.MaxX + 128f;
            float minY = region.Rect.MinY - 128f;
            float maxY = region.Rect.MaxY + 128f;
            
            for (float x = minX; x < maxX; x += 128f)
            {
                for (float y = minY; y < maxY; y += 128f)
                {
                    SetTerrainType(x, y, Terrains[Globals.ROUND-1], -1, 1, 1);
                }
            }
        }
        SetSafezones();
    }

    private static void SetSafezones()
    {
        foreach (var region in RegionList.SafeZones)
        {
            for (float x = region.Rect.MinX; x < region.Rect.MaxX; x += 128f)
            {
                for (float y = region.Rect.MinY; y < region.Rect.MaxY; y += 128f)
                {
                    SetTerrainType(x, y, SafezoneTerrain[Globals.ROUND-1], -1, 1, 1);
                }
            }
        }
    }

}