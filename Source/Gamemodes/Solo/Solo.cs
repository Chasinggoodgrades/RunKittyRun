using System;
using WCSharp.Api;
using static WCSharp.Api.Common;

public static class Solo
{
    private const float TIME_TO_REVIVE = 6.0f;
    public static void Initialize()
    {
        Console.WriteLine($"{Colors.COLOR_YELLOW}Solo Mode may still have several bugs. Report as you come across :)|r");
        ItemSpawner.NUMBER_OF_ITEMS = 8;
    }

    public static void ReviveKittySoloTournament(Kitty kitty)
    {
        if (Gamemode.CurrentGameMode != Globals.GAME_MODES[1] || Gamemode.CurrentGameModeType != "Race") return; // Solo Gamemode & Race GamemodeType.
        new SoloDeathTimer(kitty.Player);
    }


}
