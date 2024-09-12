using static WCSharp.Api.Common;
using WCSharp.Api;
using System;
public static class Gameover
{
    public static bool WinGame = false;
    public static bool GameOver()
    {
        if(WinningGame()) return true;
        if (LosingGameCheck()) return true;
        return false;
    }

    private static bool WinningGame()
    {
        if(!WinGame) return false;
        Console.WriteLine("You won!!!");
        return true;
    }

    private static void LosingGame()
    {
        Console.WriteLine("Game will end... eventually..");
    }

    private static bool LosingGameCheck()
    {
        if (Gamemode.CurrentGameMode != "Standard") return false; 
        foreach (var kitty in Globals.ALL_KITTIES.Values)
            if (kitty.Alive) return false;
        LosingGame();
        return true;
    }
}