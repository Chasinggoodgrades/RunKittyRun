using static WCSharp.Api.Common;

/// <summary>
/// Could use wcsharp wrapper but for sake of being able to port this over in the future...
/// I've made this its own class and will probably port it to LUA at some point. Just so i have the codes.
/// </summary>
public static class WeatherEffects
{
    public static readonly int Snow = FourCC("SNls");            // light snow
    public static readonly int HeavySnow = FourCC("SNhs");       // heavy snow
    public static readonly int Blizzard = FourCC("SNbs");        // blizzard
    public static readonly int HeavyRain = FourCC("RLhr");       // heavy rain
    public static readonly int LightRain = FourCC("RLlr");       // light rain
    public static readonly int RaysOfLight = FourCC("LRaa");     // rays of light
    public static readonly int RaysOfMoonlight = FourCC("LRma"); // rays of moonlight
    public static readonly int DalaranShield = FourCC("MEds");   // Dalaran shield
}
